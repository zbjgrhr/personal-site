import { kv } from "@vercel/kv";
import { randomUUID } from "crypto";

const LOCK_TTL_SECONDS = 30;
const LOCK_RETRY_DELAY_MS = 100;
const LOCK_RETRY_ATTEMPTS = 50;

export class KvMutationLockError extends Error {
  constructor(key: string) {
    super(`Timed out waiting for KV mutation lock: ${key}`);
    this.name = "KvMutationLockError";
  }
}

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export async function withKvMutationLock<T>(
  key: string,
  mutate: () => Promise<T>
): Promise<T> {
  const lockKey = `${key}:mutation_lock`;
  const token = randomUUID();

  for (let attempt = 0; attempt < LOCK_RETRY_ATTEMPTS; attempt++) {
    const acquired = await kv.set(lockKey, token, {
      nx: true,
      ex: LOCK_TTL_SECONDS,
    });

    if (acquired) {
      try {
        return await mutate();
      } finally {
        try {
          if ((await kv.get<string>(lockKey)) === token) {
            await kv.del(lockKey);
          }
        } catch (err) {
          console.error("KV mutation lock release error:", err);
        }
      }
    }

    await delay(LOCK_RETRY_DELAY_MS);
  }

  throw new KvMutationLockError(key);
}
