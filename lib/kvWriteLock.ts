import { kv } from "@vercel/kv";

const LOCK_TTL_MS = 10_000;
const LOCK_WAIT_MS = 5_000;
const RETRY_DELAY_MS = 50;

type KvWithEval = typeof kv & {
  eval: <T>(script: string, keys: string[], args: string[]) => Promise<T>;
};

export class KvWriteLockTimeoutError extends Error {
  constructor(resource: string) {
    super(`Timed out waiting for KV write lock for ${resource}`);
    this.name = "KvWriteLockTimeoutError";
  }
}

function delay(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function releaseLock(lockKey: string, token: string) {
  try {
    await (kv as KvWithEval).eval<number>(
      "if redis.call('get', KEYS[1]) == ARGV[1] then return redis.call('del', KEYS[1]) else return 0 end",
      [lockKey],
      [token]
    );
  } catch (err) {
    console.error("KV write lock release failed:", err);
  }
}

export async function withKvWriteLock<T>(
  resource: string,
  operation: () => Promise<T>
): Promise<T> {
  const lockKey = `${resource}:write_lock`;
  const token = `${Date.now()}-${Math.random().toString(36).slice(2)}`;
  const deadline = Date.now() + LOCK_WAIT_MS;

  while (true) {
    const acquired = await kv.set(lockKey, token, {
      nx: true,
      px: LOCK_TTL_MS,
    });
    if (acquired) {
      break;
    }
    if (Date.now() >= deadline) {
      throw new KvWriteLockTimeoutError(resource);
    }
    await delay(RETRY_DELAY_MS + Math.floor(Math.random() * RETRY_DELAY_MS));
  }

  try {
    return await operation();
  } finally {
    await releaseLock(lockKey, token);
  }
}
