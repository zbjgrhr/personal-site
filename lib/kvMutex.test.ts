import assert from "node:assert/strict";
import test from "node:test";
import { KvMutexTimeoutError, type KvMutexClient, withKvMutex } from "./kvMutex.ts";

class FakeKvClient implements KvMutexClient {
  private store = new Map<string, string>();

  async set(
    key: string,
    value: string,
    options: { nx: true; ex: number }
  ): Promise<"OK" | null> {
    void options;
    if (this.store.has(key)) return null;
    this.store.set(key, value);
    return "OK";
  }

  async get<T>(key: string): Promise<T | null> {
    return (this.store.get(key) as T | undefined) ?? null;
  }

  async del(key: string): Promise<number> {
    return this.store.delete(key) ? 1 : 0;
  }
}

test("withKvMutex serializes overlapping writes for the same resource", async () => {
  const kv = new FakeKvClient();
  const order: string[] = [];
  let releaseFirst!: () => void;
  const firstCanFinish = new Promise<void>((resolve) => {
    releaseFirst = resolve;
  });
  let retryCount = 0;

  const first = withKvMutex(
    kv,
    "posts",
    async () => {
      order.push("first-start");
      await firstCanFinish;
      order.push("first-end");
      return "first";
    },
    { token: "first-token" }
  );

  await Promise.resolve();

  const second = withKvMutex(
    kv,
    "posts",
    async () => {
      order.push("second-start");
      return "second";
    },
    {
      retryDelaysMs: [1, 1, 1],
      sleep: async () => {
        retryCount += 1;
        releaseFirst();
        await Promise.resolve();
      },
      token: "second-token",
    }
  );

  assert.equal(await first, "first");
  assert.equal(await second, "second");
  assert.deepEqual(order, ["first-start", "first-end", "second-start"]);
  assert.ok(retryCount >= 1);
});

test("withKvMutex fails when the lock cannot be acquired", async () => {
  const kv = new FakeKvClient();
  await kv.set("posts:write-lock", "held", { nx: true, ex: 30 });

  await assert.rejects(
    () =>
      withKvMutex(kv, "posts", async () => "unreachable", {
        retryDelaysMs: [],
        token: "blocked",
      }),
    KvMutexTimeoutError
  );
});
