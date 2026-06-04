import { kv } from "@vercel/kv";

const READ_SCRIPT = 'return redis.call("GET", KEYS[1])';

const COMPARE_AND_SET_SCRIPT = `
local current = redis.call("GET", KEYS[1])
if ((not current and ARGV[2] == "0") or current == ARGV[1]) then
  redis.call("SET", KEYS[1], ARGV[3])
  return 1
end
return 0
`;

const MAX_ATTEMPTS = 5;

type KvEvalClient = {
  eval<TArgs extends unknown[], TData>(
    script: string,
    keys: string[],
    args: TArgs
  ): Promise<TData>;
};

export class PostCollectionStoreError extends Error {
  constructor(
    message: string,
    public readonly status = 500
  ) {
    super(message);
    this.name = "PostCollectionStoreError";
  }
}

export class PostNotFoundError extends PostCollectionStoreError {
  constructor() {
    super("Post not found", 404);
    this.name = "PostNotFoundError";
  }
}

export type PostCollectionMutation<TResult> = (
  entries: unknown[]
) => { entries: unknown[]; result: TResult };

function parseRawCollection(raw: string | null): unknown[] {
  if (raw === null) return [];

  let value: unknown;
  try {
    value = JSON.parse(raw);
  } catch {
    throw new PostCollectionStoreError("Stored post collection is invalid JSON");
  }

  if (!Array.isArray(value)) {
    throw new PostCollectionStoreError("Stored post collection is not an array");
  }

  return value;
}

async function readRawCollection(
  key: string,
  client: KvEvalClient
): Promise<string | null> {
  const raw = await client.eval<[], string | null>(READ_SCRIPT, [key], []);
  return raw ?? null;
}

async function compareAndSetCollection(
  key: string,
  expectedRaw: string | null,
  nextRaw: string,
  client: KvEvalClient
): Promise<boolean> {
  const committed = await client.eval<[string, "0" | "1", string], 0 | 1>(
    COMPARE_AND_SET_SCRIPT,
    [key],
    [expectedRaw ?? "", expectedRaw === null ? "0" : "1", nextRaw]
  );

  return committed === 1;
}

export async function mutatePostCollection<TResult>(
  key: string,
  mutation: PostCollectionMutation<TResult>,
  client: KvEvalClient = kv
): Promise<TResult> {
  let raw = await readRawCollection(key, client);

  for (let attempt = 0; attempt < MAX_ATTEMPTS; attempt += 1) {
    const entries = parseRawCollection(raw);
    const { entries: nextEntries, result } = mutation(entries);
    const nextRaw = JSON.stringify(nextEntries);

    if (await compareAndSetCollection(key, raw, nextRaw, client)) {
      return result;
    }

    raw = await readRawCollection(key, client);
  }

  throw new PostCollectionStoreError(
    "Stored post collection changed too many times; please retry",
    409
  );
}
