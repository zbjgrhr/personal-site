type KvSetOptions = {
  nx?: true;
  px?: number;
};

export type KvCollectionClient = {
  get<T = unknown>(key: string): Promise<T | null>;
  set<T>(
    key: string,
    value: T,
    options?: KvSetOptions
  ): Promise<"OK" | T | null>;
  eval<TArgs extends unknown[], TData = unknown>(
    script: string,
    keys: string[],
    args: TArgs
  ): Promise<TData>;
};

type MutationResult<TItem, TResult> = {
  posts: TItem[];
  result: TResult;
  write?: boolean;
};

type MutateCollectionOptions<TItem, TResult> = {
  client: KvCollectionClient;
  key: string;
  parsePosts(data: unknown): TItem[];
  mutate(posts: TItem[]): MutationResult<TItem, TResult>;
  lockTtlMs?: number;
  acquireTimeoutMs?: number;
};

const DEFAULT_LOCK_TTL_MS = 30000;
const DEFAULT_ACQUIRE_TIMEOUT_MS = 10000;
const LOCK_RETRY_DELAY_MS = 25;

const RELEASE_LOCK_SCRIPT = `
if redis.call("get", KEYS[1]) == ARGV[1] then
  return redis.call("del", KEYS[1])
end
return 0
`;

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function createLockOwner(): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }
  return `${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

async function acquireLock(
  client: KvCollectionClient,
  lockKey: string,
  owner: string,
  lockTtlMs: number,
  acquireTimeoutMs: number
) {
  const deadline = Date.now() + acquireTimeoutMs;

  while (true) {
    const acquired = await client.set(lockKey, owner, {
      nx: true,
      px: lockTtlMs,
    });

    if (acquired === "OK") {
      return;
    }

    if (Date.now() >= deadline) {
      throw new Error(`Timed out acquiring KV write lock for ${lockKey}`);
    }

    await delay(LOCK_RETRY_DELAY_MS);
  }
}

async function releaseLock(
  client: KvCollectionClient,
  lockKey: string,
  owner: string
) {
  await client.eval<[string], number>(RELEASE_LOCK_SCRIPT, [lockKey], [owner]);
}

export async function mutateKvCollection<TItem, TResult>({
  client,
  key,
  parsePosts,
  mutate,
  lockTtlMs = DEFAULT_LOCK_TTL_MS,
  acquireTimeoutMs = DEFAULT_ACQUIRE_TIMEOUT_MS,
}: MutateCollectionOptions<TItem, TResult>): Promise<TResult> {
  const lockKey = `${key}:write-lock`;
  const owner = createLockOwner();

  await acquireLock(client, lockKey, owner, lockTtlMs, acquireTimeoutMs);

  try {
    const data = await client.get<unknown>(key);
    const posts = parsePosts(data ?? []);
    const mutation = mutate(posts);

    if (mutation.write !== false) {
      await client.set(key, mutation.posts);
    }

    return mutation.result;
  } finally {
    try {
      await releaseLock(client, lockKey, owner);
    } catch (err) {
      console.error("Failed to release KV write lock:", err);
    }
  }
}
