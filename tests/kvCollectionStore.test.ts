import assert from "node:assert/strict";
import test from "node:test";
import {
  mutateKvArray,
  type KvCollectionClient,
} from "../lib/kvCollectionStore";

class FakeKv implements KvCollectionClient {
  store = new Map<string, unknown>();

  async get<T = unknown>(key: string): Promise<T | null> {
    return (this.store.get(key) ?? null) as T | null;
  }

  async set<T = unknown>(
    key: string,
    value: T,
    options?: { nx?: true; px?: number }
  ): Promise<"OK" | T | null> {
    if (options?.nx && this.store.has(key)) {
      return null;
    }
    this.store.set(key, value);
    return "OK";
  }

  async eval<TResult = unknown>(
    _script: string,
    keys: string[],
    args: string[]
  ): Promise<TResult> {
    const [key] = keys;
    const [token] = args;
    if (this.store.get(key) === token) {
      this.store.delete(key);
      return 1 as TResult;
    }
    return 0 as TResult;
  }
}

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

test("mutateKvArray serializes concurrent writes", async () => {
  const kv = new FakeKv();
  kv.store.set("posts", []);

  await Promise.all(
    ["a", "b", "c"].map((id) =>
      mutateKvArray(kv, "posts", async (items) => {
        await delay(10);
        return {
          items: [{ id }, ...items],
          result: id,
        };
      })
    )
  );

  const posts = kv.store.get("posts") as Array<{ id: string }>;
  assert.deepEqual(
    posts.map((post) => post.id).sort(),
    ["a", "b", "c"]
  );
});

test("mutateKvArray rejects non-array values without overwriting them", async () => {
  const kv = new FakeKv();
  const corruptValue = { unexpected: true };
  kv.store.set("posts", corruptValue);

  await assert.rejects(
    mutateKvArray(kv, "posts", () => ({
      items: [],
      result: true,
    })),
    /not an array/
  );

  assert.equal(kv.store.get("posts"), corruptValue);
});
