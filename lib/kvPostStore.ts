import { kv } from "@vercel/kv";

export class InvalidPostStoreError extends Error {
  constructor(message = "Post store is not a JSON array") {
    super(message);
    this.name = "InvalidPostStoreError";
  }
}

export class ConcurrentPostWriteError extends Error {
  constructor(message = "Post store changed while saving") {
    super(message);
    this.name = "ConcurrentPostWriteError";
  }
}

type CommonPostFields = {
  id: string;
  slug: string;
  title: string;
  content: string;
  imageUrls: unknown[];
  createdAt: string;
};

type StoredPostRecord = CommonPostFields & Record<string, unknown>;

type MutationOutcome<T> =
  | { changed: true; posts: unknown[]; result: T }
  | { changed: false; result: T };

type KvWithEval = {
  eval: (
    script: string,
    keys: string[],
    args: string[]
  ) => Promise<number | string>;
};

const MAX_WRITE_ATTEMPTS = 5;

const COMPARE_AND_SET_POSTS_SCRIPT = `
local version = redis.call("GET", KEYS[2])
if not version then
  version = "0"
end

if version ~= ARGV[1] then
  return 0
end

redis.call("SET", KEYS[1], ARGV[2])
redis.call("INCR", KEYS[2])
return 1
`;

function isValidStoredPost(value: unknown): value is StoredPostRecord {
  if (!value || typeof value !== "object") return false;
  const post = value as Partial<CommonPostFields>;
  return (
    typeof post.id === "string" &&
    typeof post.slug === "string" &&
    typeof post.title === "string" &&
    typeof post.content === "string" &&
    Array.isArray(post.imageUrls) &&
    typeof post.createdAt === "string"
  );
}

function parseVersion(value: unknown): string {
  if (value == null) return "0";
  if (typeof value === "number" && Number.isSafeInteger(value) && value >= 0) {
    return String(value);
  }
  if (typeof value === "string" && /^\d+$/.test(value)) {
    return value;
  }
  throw new InvalidPostStoreError("Post store version is invalid");
}

async function compareAndSetPosts(
  key: string,
  expectedVersion: string,
  posts: unknown[]
): Promise<boolean> {
  const result = await (kv as KvWithEval).eval(
    COMPARE_AND_SET_POSTS_SCRIPT,
    [key, `${key}:version`],
    [expectedVersion, JSON.stringify(posts)]
  );

  return result === 1 || result === "1";
}

async function mutatePostStore<T>(
  key: string,
  mutate: (posts: unknown[]) => MutationOutcome<T>
): Promise<T> {
  for (let attempt = 0; attempt < MAX_WRITE_ATTEMPTS; attempt++) {
    const [storedPosts, storedVersion] = await Promise.all([
      kv.get<unknown>(key),
      kv.get<unknown>(`${key}:version`),
    ]);
    const posts = storedPosts == null ? [] : storedPosts;

    if (!Array.isArray(posts)) {
      throw new InvalidPostStoreError();
    }

    const outcome = mutate([...posts]);
    if (!outcome.changed) {
      return outcome.result;
    }

    const committed = await compareAndSetPosts(
      key,
      parseVersion(storedVersion),
      outcome.posts
    );

    if (committed) {
      return outcome.result;
    }
  }

  throw new ConcurrentPostWriteError();
}

export async function insertPost<T extends CommonPostFields>(
  key: string,
  post: T
): Promise<T> {
  return mutatePostStore(key, (posts) => ({
    changed: true,
    posts: [post, ...posts],
    result: post,
  }));
}

export async function updatePost<T extends CommonPostFields>(
  key: string,
  id: string,
  updates: Omit<T, "createdAt">
): Promise<T | null> {
  return mutatePostStore(key, (posts) => {
    const idx = posts.findIndex(
      (post) => isValidStoredPost(post) && post.id === id
    );

    if (idx === -1) {
      return { changed: false, result: null };
    }

    const existing = posts[idx] as StoredPostRecord;
    const post = {
      ...existing,
      ...updates,
      id,
      createdAt: existing.createdAt,
    } as T;
    const nextPosts = [...posts];
    nextPosts[idx] = post;

    return { changed: true, posts: nextPosts, result: post };
  });
}

export async function deletePost(key: string, id: string): Promise<boolean> {
  return mutatePostStore(key, (posts) => {
    let deleted = false;
    const nextPosts = posts.filter((post) => {
      if (isValidStoredPost(post) && post.id === id) {
        deleted = true;
        return false;
      }
      return true;
    });

    return deleted
      ? { changed: true, posts: nextPosts, result: true }
      : { changed: false, result: false };
  });
}
