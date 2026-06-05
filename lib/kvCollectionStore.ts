import { kv } from "@vercel/kv";

type KvSetOptions = {
  nx?: true;
  px?: number;
};

export type KvClient = {
  get<T = unknown>(key: string): Promise<T | null>;
  set<T = unknown>(
    key: string,
    value: T,
    options?: KvSetOptions
  ): Promise<"OK" | null | boolean | unknown>;
  del(key: string): Promise<unknown>;
  eval?<T = unknown>(
    script: string,
    keys: string[],
    args: string[]
  ): Promise<T>;
};

type MutationResult<Post, Result> = {
  posts: Post[];
  result: Result;
  save?: boolean;
};

type MutationOptions = {
  lockTtlMs?: number;
  lockTimeoutMs?: number;
  retryDelayMs?: number;
  lockKeyPrefix?: string;
};

const DEFAULT_LOCK_TTL_MS = 10_000;
const DEFAULT_LOCK_TIMEOUT_MS = 5_000;
const DEFAULT_RETRY_DELAY_MS = 25;
const DEFAULT_LOCK_KEY_PREFIX = "lock:collection:";

const RELEASE_LOCK_SCRIPT = `
if redis.call("GET", KEYS[1]) == ARGV[1] then
  return redis.call("DEL", KEYS[1])
end
return 0
`;

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function lockWasAcquired(result: unknown): boolean {
  return result === "OK" || result === true;
}

async function acquireLock(
  client: KvClient,
  lockKey: string,
  token: string,
  options: Required<MutationOptions>
): Promise<void> {
  const deadline = Date.now() + options.lockTimeoutMs;

  while (Date.now() <= deadline) {
    const result = await client.set(lockKey, token, {
      nx: true,
      px: options.lockTtlMs,
    });
    if (lockWasAcquired(result)) return;

    await sleep(options.retryDelayMs);
  }

  throw new Error(`Timed out acquiring KV collection lock for ${lockKey}`);
}

async function releaseLock(
  client: KvClient,
  lockKey: string,
  token: string
): Promise<void> {
  if (typeof client.eval === "function") {
    await client.eval<number>(RELEASE_LOCK_SCRIPT, [lockKey], [token]);
    return;
  }

  const currentToken = await client.get<string>(lockKey);
  if (currentToken === token) {
    await client.del(lockKey);
  }
}

function getOptions(options: MutationOptions): Required<MutationOptions> {
  return {
    lockTtlMs: options.lockTtlMs ?? DEFAULT_LOCK_TTL_MS,
    lockTimeoutMs: options.lockTimeoutMs ?? DEFAULT_LOCK_TIMEOUT_MS,
    retryDelayMs: options.retryDelayMs ?? DEFAULT_RETRY_DELAY_MS,
    lockKeyPrefix: options.lockKeyPrefix ?? DEFAULT_LOCK_KEY_PREFIX,
  };
}

export async function mutateKvCollectionWithClient<Post, Result>(
  client: KvClient,
  key: string,
  parsePosts: (data: unknown) => Post[],
  mutate: (
    posts: Post[]
  ) => MutationResult<Post, Result> | Promise<MutationResult<Post, Result>>,
  options: MutationOptions = {}
): Promise<Result> {
  const resolvedOptions = getOptions(options);
  const lockKey = `${resolvedOptions.lockKeyPrefix}${key}`;
  const token = crypto.randomUUID();

  await acquireLock(client, lockKey, token, resolvedOptions);
  try {
    const data = await client.get<unknown>(key);
    const posts = parsePosts(data ?? []);
    const mutation = await mutate(posts);
    if (mutation.save !== false) {
      await client.set(key, mutation.posts);
    }
    return mutation.result;
  } finally {
    await releaseLock(client, lockKey, token);
  }
}

export async function mutateKvCollection<Post, Result>(
  key: string,
  parsePosts: (data: unknown) => Post[],
  mutate: (
    posts: Post[]
  ) => MutationResult<Post, Result> | Promise<MutationResult<Post, Result>>,
  options?: MutationOptions
): Promise<Result> {
  return mutateKvCollectionWithClient(
    kv as unknown as KvClient,
    key,
    parsePosts,
    mutate,
    options
  );
}
