import assert from "node:assert/strict";
import test from "node:test";
import {
  mutateKvCollection,
  type KvCollectionClient,
} from "./kvCollectionStore";

type Post = {
  id: string;
};

type Lock = {
  owner: string;
  expiresAt: number;
};

function clone<T>(value: T): T {
  if (value == null) return value;
  return JSON.parse(JSON.stringify(value)) as T;
}

class FakeKvClient implements KvCollectionClient {
  private values = new Map<string, unknown>();
  private locks = new Map<string, Lock>();

  lockContentionCount = 0;

  constructor(initialValues: Record<string, unknown>) {
    for (const [key, value] of Object.entries(initialValues)) {
      this.values.set(key, clone(value));
    }
  }

  async get<T = unknown>(key: string): Promise<T | null> {
    if (!this.values.has(key)) return null;
    return clone(this.values.get(key)) as T;
  }

  async set<T>(
    key: string,
    value: T,
    options?: { nx?: true; px?: number }
  ): Promise<"OK" | T | null> {
    if (options?.nx) {
      const now = Date.now();
      const existing = this.locks.get(key);
      if (existing && existing.expiresAt > now) {
        this.lockContentionCount += 1;
        return null;
      }

      this.locks.set(key, {
        owner: String(value),
        expiresAt: now + (options.px ?? 0),
      });
      return "OK";
    }

    this.values.set(key, clone(value));
    return "OK";
  }

  async eval<TArgs extends unknown[], TData = unknown>(
    _script: string,
    keys: string[],
    args: TArgs
  ): Promise<TData> {
    const [key] = keys;
    const [owner] = args;
    const existing = this.locks.get(key);
    if (existing?.owner === owner) {
      this.locks.delete(key);
      return 1 as TData;
    }
    return 0 as TData;
  }
}

function parsePosts(data: unknown): Post[] {
  return Array.isArray(data) ? (data as Post[]) : [];
}

test("mutateKvCollection serializes concurrent full-array writes", async () => {
  const client = new FakeKvClient({ "posts": [] });

  await Promise.all([
    mutateKvCollection<Post, string>({
      client,
      key: "posts",
      parsePosts,
      mutate(posts) {
        posts.unshift({ id: "first" });
        return { posts, result: "first" };
      },
    }),
    mutateKvCollection<Post, string>({
      client,
      key: "posts",
      parsePosts,
      mutate(posts) {
        posts.unshift({ id: "second" });
        return { posts, result: "second" };
      },
    }),
  ]);

  const posts = await client.get<Post[]>("posts");
  assert.equal(posts?.length, 2);
  assert.deepEqual(
    new Set(posts?.map((post) => post.id)),
    new Set(["first", "second"])
  );
  assert.equal(client.lockContentionCount > 0, true);
});

test("mutateKvCollection can skip writes for no-op mutations", async () => {
  const initialPosts = [{ id: "existing" }];
  const client = new FakeKvClient({ "posts": initialPosts });

  const result = await mutateKvCollection<Post, null>({
    client,
    key: "posts",
    parsePosts,
    mutate(posts) {
      return { posts, result: null, write: false };
    },
  });

  assert.equal(result, null);
  assert.deepEqual(await client.get<Post[]>("posts"), initialPosts);
});
