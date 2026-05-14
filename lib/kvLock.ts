import { kv } from "@vercel/kv";

const DEFAULT_LOCK_TTL_MS = 10_000;
const DEFAULT_WAIT_MS = 3_000;
const DEFAULT_RETRY_DELAY_MS = 100;

const RELEASE_LOCK_SCRIPT = `
if redis.call("get", KEYS[1]) == ARGV[1] then
  return redis.call("del", KEYS[1])
end
return 0
`;

type LockOptions = {
  ttlMs?: number;
  waitMs?: number;
  retryDelayMs?: number;
};

export class KvMutationLockTimeoutError extends Error {
  constructor(lockKey: string) {
    super(`Timed out waiting for KV mutation lock: ${lockKey}`);
    this.name = "KvMutationLockTimeoutError";
  }
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function acquireLock(
  lockKey: string,
  token: string,
  options: Required<LockOptions>
): Promise<boolean> {
  const deadline = Date.now() + options.waitMs;

  while (true) {
    const acquired = await kv.set(lockKey, token, {
      nx: true,
      px: options.ttlMs,
    });

    if (acquired === "OK") return true;
    if (Date.now() >= deadline) return false;

    await sleep(options.retryDelayMs);
  }
}

export async function withKvMutationLock<T>(
  lockKey: string,
  action: () => Promise<T>,
  options: LockOptions = {}
): Promise<T> {
  const resolvedOptions = {
    ttlMs: options.ttlMs ?? DEFAULT_LOCK_TTL_MS,
    waitMs: options.waitMs ?? DEFAULT_WAIT_MS,
    retryDelayMs: options.retryDelayMs ?? DEFAULT_RETRY_DELAY_MS,
  };
  const token = globalThis.crypto.randomUUID();
  const acquired = await acquireLock(lockKey, token, resolvedOptions);

  if (!acquired) {
    throw new KvMutationLockTimeoutError(lockKey);
  }

  try {
    return await action();
  } finally {
    try {
      await kv.eval(RELEASE_LOCK_SCRIPT, [lockKey], [token]);
    } catch (err) {
      console.error("KV mutation lock release error:", err);
    }
  }
}
