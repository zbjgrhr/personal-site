import { kv } from "@vercel/kv";

const LOCK_TTL_MS = 10_000;
const LOCK_RETRY_DELAYS_MS = [25, 50, 75, 100, 150, 250, 400, 600, 800, 1000];

type KvSetWithOptions = (
  key: string,
  value: string,
  options?: { nx?: boolean; px?: number }
) => Promise<unknown>;

type KvWithEval = {
  eval?: (script: string, keys: string[], args: string[]) => Promise<unknown>;
};

export class KvCollectionLockError extends Error {
  constructor(collectionKey: string) {
    super(`Timed out waiting for ${collectionKey} lock`);
    this.name = "KvCollectionLockError";
  }
}

function getLockKey(collectionKey: string): string {
  return `${collectionKey}:lock`;
}

function createLockToken(): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }
  return `${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function acquireLock(lockKey: string, token: string): Promise<boolean> {
  for (const delay of LOCK_RETRY_DELAYS_MS) {
    const result = await (kv.set as KvSetWithOptions)(lockKey, token, {
      nx: true,
      px: LOCK_TTL_MS,
    });
    if (result === "OK" || result === true) return true;
    await sleep(delay);
  }

  const result = await (kv.set as KvSetWithOptions)(lockKey, token, {
    nx: true,
    px: LOCK_TTL_MS,
  });
  return result === "OK" || result === true;
}

async function releaseLock(lockKey: string, token: string): Promise<void> {
  const redis = kv as unknown as KvWithEval;
  if (typeof redis.eval === "function") {
    await redis.eval(
      "if redis.call('get', KEYS[1]) == ARGV[1] then return redis.call('del', KEYS[1]) else return 0 end",
      [lockKey],
      [token]
    );
    return;
  }

  const current = await kv.get<string>(lockKey);
  if (current === token) {
    await kv.del(lockKey);
  }
}

export async function withKvCollectionLock<T>(
  collectionKey: string,
  action: () => Promise<T>
): Promise<T> {
  const lockKey = getLockKey(collectionKey);
  const token = createLockToken();
  const acquired = await acquireLock(lockKey, token);

  if (!acquired) {
    throw new KvCollectionLockError(collectionKey);
  }

  try {
    return await action();
  } finally {
    try {
      await releaseLock(lockKey, token);
    } catch (err) {
      console.error("KV lock release error:", err);
    }
  }
}
