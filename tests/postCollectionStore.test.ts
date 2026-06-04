import assert from "node:assert/strict";
import test from "node:test";
import { mutatePostCollection } from "@/lib/postCollectionStore";

class FakeKvClient {
  casAttempts = 0;
  beforeCas?: () => void;

  constructor(public raw: string | null) {}

  async eval<TArgs extends unknown[], TData>(
    _script: string,
    _keys: string[],
    args: TArgs
  ): Promise<TData> {
    if (args.length === 0) {
      return this.raw as TData;
    }

    this.casAttempts += 1;
    this.beforeCas?.();

    const [expectedRaw, expectedExists, nextRaw] = args as unknown as [
      string,
      "0" | "1",
      string,
    ];
    const matches =
      (this.raw === null && expectedExists === "0") || this.raw === expectedRaw;

    if (matches) {
      this.raw = nextRaw;
      return 1 as TData;
    }

    return 0 as TData;
  }
}

test("mutations preserve malformed sibling entries", async () => {
  const post = {
    id: "post-1",
    slug: "first",
    title: "First",
    content: "Original",
    imageUrls: [],
    createdAt: "2026-01-01T00:00:00.000Z",
  };
  const malformedSibling = {
    id: "legacy-post",
    title: "Legacy without imageUrls",
  };
  const client = new FakeKvClient(JSON.stringify([post, malformedSibling]));

  const result = await mutatePostCollection<typeof post>(
    "blog:posts",
    (entries) => {
      let updatedPost: typeof post | null = null;
      const nextEntries = entries.map((entry) => {
        if (
          !entry ||
          typeof entry !== "object" ||
          (entry as typeof post).id !== post.id
        ) {
          return entry;
        }

        updatedPost = { ...(entry as typeof post), title: "Updated" };
        return updatedPost;
      });

      assert.ok(updatedPost);
      return { entries: nextEntries, result: updatedPost };
    },
    client
  );

  assert.equal(result.title, "Updated");
  assert.deepEqual(JSON.parse(client.raw!), [
    { ...post, title: "Updated" },
    malformedSibling,
  ]);
});

test("mutations reject non-array stored values instead of replacing them", async () => {
  const rawObject = JSON.stringify({ posts: [] });
  const client = new FakeKvClient(rawObject);

  await assert.rejects(
    () =>
      mutatePostCollection(
        "blog:posts",
        (entries) => ({
          entries: [{ id: "new-post" }, ...entries],
          result: true,
        }),
        client
      ),
    /not an array/
  );

  assert.equal(client.raw, rawObject);
  assert.equal(client.casAttempts, 0);
});

test("mutations retry when another writer changes the collection", async () => {
  const concurrentPost = { id: "post-from-other-request" };
  const newPost = { id: "post-from-this-request" };
  const client = new FakeKvClient(JSON.stringify([]));

  client.beforeCas = () => {
    if (client.casAttempts === 1) {
      client.raw = JSON.stringify([concurrentPost]);
    }
  };

  await mutatePostCollection(
    "blog:posts",
    (entries) => ({
      entries: [newPost, ...entries],
      result: newPost,
    }),
    client
  );

  assert.equal(client.casAttempts, 2);
  assert.deepEqual(JSON.parse(client.raw!), [newPost, concurrentPost]);
});
