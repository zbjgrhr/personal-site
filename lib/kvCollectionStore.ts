import { randomUUID } from "crypto";

type KvSetOptions = {
  nx?: true;
  px?: number;
};

export type KvCollectionClient = {
  get<T = unknown>(key: string): Promise<T | null>;
  set<T = unknown>(
    key: string,
    value: T,
    options?: KvSetOptions
  ): Promise<"OK" | T | null>;
  eval<TResult = unknown>(
    script: string,
    keys: string[],
    args: string[]
  ): Promise<TResult>;
};

type MutationResult<TResult> = {
  items: unknown[];
  result: TResult;
};

const DEFAULT_LOCK_TTL_MS = 5000;
const DEFAULT_RETRY_DELAY_MS = 50;
const DEFAULT_MAX_ATTEMPTS = 100;

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function acquireLock(
  client: KvCollectionClient,
  lockKey: string,
  token: string
): Promise<void> {
  for (let attempt = 0; attempt < DEFAULT_MAX_ATTEMPTS; attempt++) {
    const acquired = await client.set(lockKey, token, {
      nx: true,
      px: DEFAULT_LOCK_TTL_MS,
    });
    if (acquired === "OK") return;
    await sleep(DEFAULT_RETRY_DELAY_MS);
  }
  throw new Error(`Timed out waiting for KV write lock: ${lockKey}`);
}

async function releaseLock(
  client: KvCollectionClient,
  lockKey: string,
  token: string
): Promise<void> {
  await client.eval(
    `
if redis.call("get", KEYS[1]) == ARGV[1] then
  return redis.call("del", KEYS[1])
end
return 0
`,
    [lockKey],
    [token]
  );
}

export async function mutateKvArray<TResult>(
  client: KvCollectionClient,
  key: string,
  mutate: (items: unknown[]) => MutationResult<TResult> | Promise<MutationResult<TResult>>
): Promise<TResult> {
  const lockKey = `${key}:write-lock`;
  const token = randomUUID();

  await acquireLock(client, lockKey, token);
  try {
    const data = await client.get<unknown>(key);
    if (data != null && !Array.isArray(data)) {
      throw new Error(`KV value for ${key} is not an array`);
    }

    const currentItems = Array.isArray(data) ? [...data] : [];
    const { items, result } = await mutate(currentItems);
    await client.set(key, items);
    return result;
  } finally {
    await releaseLock(client, lockKey, token).catch((err) => {
      console.error("KV lock release error:", err);
    });
  }
}
