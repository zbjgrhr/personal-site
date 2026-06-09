type SetResult = "OK" | null | unknown;

export type KvMutexClient = {
  set: (
    key: string,
    value: string,
    options: { nx: true; ex: number }
  ) => Promise<SetResult>;
  get: <T>(key: string) => Promise<T | null>;
  del: (key: string) => Promise<unknown>;
};

export class KvMutexTimeoutError extends Error {
  constructor(resourceKey: string) {
    super(`Timed out waiting for KV write lock: ${resourceKey}`);
    this.name = "KvMutexTimeoutError";
  }
}

const DEFAULT_RETRY_DELAYS_MS = [25, 50, 100, 200, 400, 800, 1000];
const DEFAULT_LOCK_TTL_SECONDS = 30;

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function createLockToken(): string {
  return globalThis.crypto?.randomUUID?.() ?? `${Date.now()}-${Math.random()}`;
}

type KvMutexOptions = {
  retryDelaysMs?: readonly number[];
  lockTtlSeconds?: number;
  sleep?: (ms: number) => Promise<void>;
  token?: string;
};

async function releaseLock(
  client: KvMutexClient,
  lockKey: string,
  token: string
) {
  try {
    const currentToken = await client.get<string>(lockKey);
    if (currentToken === token) {
      await client.del(lockKey);
    }
  } catch (err) {
    console.error("Failed to release KV write lock:", err);
  }
}

export async function withKvMutex<T>(
  client: KvMutexClient,
  resourceKey: string,
  operation: () => Promise<T>,
  options: KvMutexOptions = {}
): Promise<T> {
  const lockKey = `${resourceKey}:write-lock`;
  const token = options.token ?? createLockToken();
  const retryDelaysMs = options.retryDelaysMs ?? DEFAULT_RETRY_DELAYS_MS;
  const lockTtlSeconds = options.lockTtlSeconds ?? DEFAULT_LOCK_TTL_SECONDS;
  const wait = options.sleep ?? sleep;

  for (let attempt = 0; attempt <= retryDelaysMs.length; attempt++) {
    const acquired = await client.set(lockKey, token, {
      nx: true,
      ex: lockTtlSeconds,
    });

    if (acquired !== null) {
      try {
        return await operation();
      } finally {
        await releaseLock(client, lockKey, token);
      }
    }

    const delay = retryDelaysMs[attempt];
    if (delay === undefined) break;
    await wait(delay);
  }

  throw new KvMutexTimeoutError(resourceKey);
}
