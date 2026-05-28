import { kv } from "@vercel/kv";

const MAX_MUTATION_ATTEMPTS = 5;

const COMMIT_IF_VERSION_SCRIPT = `
local current = redis.call("GET", KEYS[2])
if current == false then
  current = ""
end

if tostring(current) ~= ARGV[2] then
  return 0
end

redis.call("SET", KEYS[1], ARGV[1])
redis.call("INCR", KEYS[2])
return 1
`;

export class InvalidPostStoreError extends Error {
  constructor(key: string) {
    super(`${key} must contain a JSON array before it can be mutated`);
    this.name = "InvalidPostStoreError";
  }
}

export class PostConflictError extends Error {
  constructor(key: string) {
    super(`${key} changed too many times while saving`);
    this.name = "PostConflictError";
  }
}

export class PostNotFoundError extends Error {
  constructor(id: string) {
    super(`Post ${id} was not found`);
    this.name = "PostNotFoundError";
  }
}

function versionKey(key: string): string {
  return `${key}:version`;
}

function normalizeVersion(version: unknown): string {
  return version == null ? "" : String(version);
}

async function readPostsSnapshot(key: string): Promise<{
  posts: unknown[];
  version: string;
}> {
  const [data, version] = await Promise.all([
    kv.get<unknown>(key),
    kv.get<unknown>(versionKey(key)),
  ]);

  if (data == null) {
    return { posts: [], version: normalizeVersion(version) };
  }

  if (!Array.isArray(data)) {
    throw new InvalidPostStoreError(key);
  }

  return { posts: [...data], version: normalizeVersion(version) };
}

async function commitIfVersionMatches(
  key: string,
  posts: unknown[],
  expectedVersion: string
): Promise<boolean> {
  const committed = await kv.eval<[string, string], number>(
    COMMIT_IF_VERSION_SCRIPT,
    [key, versionKey(key)],
    [JSON.stringify(posts), expectedVersion]
  );

  return committed === 1;
}

export async function mutatePostStore<T>(
  key: string,
  mutate: (posts: unknown[]) => T
): Promise<T> {
  for (let attempt = 0; attempt < MAX_MUTATION_ATTEMPTS; attempt++) {
    const snapshot = await readPostsSnapshot(key);
    const result = mutate(snapshot.posts);
    const committed = await commitIfVersionMatches(
      key,
      snapshot.posts,
      snapshot.version
    );

    if (committed) {
      return result;
    }
  }

  throw new PostConflictError(key);
}
