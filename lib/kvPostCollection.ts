import { kv } from "@vercel/kv";

const MUTATE_POST_COLLECTION_SCRIPT = `
local key = KEYS[1]
local op = ARGV[1]
local id = ARGV[2]
local payload = ARGV[3]

local raw = redis.call("GET", key)
local posts = {}

if raw then
  local ok, decoded = pcall(cjson.decode, raw)
  if ok and type(decoded) == "table" then
    posts = decoded
  end
end

local function save_posts()
  if #posts == 0 then
    redis.call("SET", key, "[]")
  else
    redis.call("SET", key, cjson.encode(posts))
  end
end

if op == "create" then
  local post = cjson.decode(payload)
  table.insert(posts, 1, post)
  save_posts()
  return cjson.encode(post)
end

if op == "update" then
  local patch = cjson.decode(payload)
  for i, post in ipairs(posts) do
    if type(post) == "table" and post["id"] == id then
      for field, value in pairs(patch) do
        post[field] = value
      end
      save_posts()
      return cjson.encode(post)
    end
  end
  return nil
end

if op == "delete" then
  for i, post in ipairs(posts) do
    if type(post) == "table" and post["id"] == id then
      table.remove(posts, i)
      save_posts()
      return "1"
    end
  end
  return "0"
end

return nil
`;

function parseMutationResult<T>(result: unknown): T | null {
  if (result == null) return null;
  if (typeof result === "string") {
    try {
      return JSON.parse(result) as T;
    } catch {
      return result as T;
    }
  }
  if (typeof result === "object") return result as T;
  return null;
}

async function mutatePostCollection<T>(
  key: string,
  op: "create" | "update" | "delete",
  id: string,
  payload: unknown
): Promise<T | null> {
  const result = await kv.eval(
    MUTATE_POST_COLLECTION_SCRIPT,
    [key],
    [op, id, JSON.stringify(payload)]
  );
  return parseMutationResult<T>(result);
}

export async function createCollectionPost<T>(key: string, post: T): Promise<T> {
  const created = await mutatePostCollection<T>(key, "create", "", post);
  if (!created) throw new Error("Failed to create post");
  return created;
}

export async function updateCollectionPost<T>(
  key: string,
  id: string,
  patch: Partial<T>
): Promise<T | null> {
  return mutatePostCollection<T>(key, "update", id, patch);
}

export async function deleteCollectionPost(
  key: string,
  id: string
): Promise<void> {
  await mutatePostCollection<string>(key, "delete", id, null);
}
