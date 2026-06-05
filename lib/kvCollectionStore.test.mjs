import assert from "node:assert/strict";
import test from "node:test";
import { mutateKvCollectionWithClient } from "./kvCollectionStore.ts";

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function clone(value) {
  if (value === undefined || value === null) return value ?? null;
  return JSON.parse(JSON.stringify(value));
}

class FakeKvClient {
  store = new Map();
  expirations = new Map();

  expireIfNeeded(key) {
    const expiration = this.expirations.get(key);
    if (expiration && expiration.expiresAt <= Date.now()) {
      this.store.delete(key);
      this.expirations.delete(key);
    }
  }

  async get(key) {
    this.expireIfNeeded(key);
    return clone(this.store.get(key) ?? null);
  }

  async set(key, value, options) {
    this.expireIfNeeded(key);
    if (options?.nx && this.store.has(key)) {
      return null;
    }

    this.store.set(key, clone(value));
    if (options?.px) {
      this.expirations.set(key, {
        expiresAt: Date.now() + options.px,
      });
    } else {
      this.expirations.delete(key);
    }
    return "OK";
  }

  async del(key) {
    this.store.delete(key);
    this.expirations.delete(key);
    return 1;
  }

  async eval(_script, keys, args) {
    const [key] = keys;
    const [token] = args;
    if ((await this.get(key)) === token) {
      await this.del(key);
      return 1;
    }
    return 0;
  }
}

function parsePosts(data) {
  if (!Array.isArray(data)) return [];
  return data.filter((post) => post && typeof post.id === "string");
}

test("serializes overlapping collection mutations so writes are not lost", async () => {
  const client = new FakeKvClient();
  await client.set("posts", []);

  async function addPost(id, delayMs) {
    return mutateKvCollectionWithClient(
      client,
      "posts",
      parsePosts,
      async (posts) => {
        await sleep(delayMs);
        posts.unshift({ id });
        return { posts, result: id };
      },
      { lockTtlMs: 1_000, lockTimeoutMs: 1_000, retryDelayMs: 1 }
    );
  }

  await Promise.all([addPost("first", 25), addPost("second", 0)]);

  const posts = await client.get("posts");
  assert.equal(posts.length, 2);
  assert.deepEqual(
    new Set(posts.map((post) => post.id)),
    new Set(["first", "second"])
  );
});

test("skips persistence when a mutation returns save false", async () => {
  const client = new FakeKvClient();
  await client.set("posts", [{ id: "keep" }]);

  const result = await mutateKvCollectionWithClient(
    client,
    "posts",
    parsePosts,
    (posts) => ({ posts: [], result: "missing", save: false }),
    { lockTtlMs: 1_000, lockTimeoutMs: 1_000, retryDelayMs: 1 }
  );

  assert.equal(result, "missing");
  assert.deepEqual(await client.get("posts"), [{ id: "keep" }]);
});
