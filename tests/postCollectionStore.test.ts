import assert from "node:assert/strict";
import test from "node:test";

import {
  deleteRawPostFromCollection,
  getPostCollectionForWrite,
  InvalidPostCollectionError,
  updateRawPostCollection,
} from "../lib/postCollectionStore.ts";

type TestPost = {
  id: string;
  title: string;
};

function isTestPost(post: unknown): post is TestPost {
  return (
    !!post &&
    typeof post === "object" &&
    typeof (post as TestPost).id === "string" &&
    typeof (post as TestPost).title === "string"
  );
}

test("rejects non-array post collections before writes", () => {
  assert.throws(
    () => getPostCollectionForWrite({ id: "not-an-array" }, "blog:posts"),
    InvalidPostCollectionError
  );
});

test("treats missing post collections as empty arrays", () => {
  assert.deepEqual(getPostCollectionForWrite(null, "blog:posts"), []);
  assert.deepEqual(getPostCollectionForWrite(undefined, "blog:posts"), []);
});

test("updates a valid post without dropping malformed siblings", () => {
  const malformed = { id: "legacy", body: "missing title" };
  const rawPosts: unknown[] = [
    malformed,
    { id: "post-1", title: "Old title" },
  ];

  const updated = updateRawPostCollection(
    rawPosts,
    isTestPost,
    "post-1",
    (post) => ({ ...post, title: "New title" })
  );

  assert.ok(updated);
  assert.notEqual(updated.posts, rawPosts);
  assert.strictEqual(updated.posts[0], malformed);
  assert.deepEqual(updated.post, { id: "post-1", title: "New title" });
  assert.deepEqual(updated.posts[1], { id: "post-1", title: "New title" });
});

test("deletes a valid post without dropping malformed siblings", () => {
  const malformed = { id: "legacy", body: "missing title" };
  const rawPosts: unknown[] = [
    { id: "post-1", title: "First" },
    malformed,
    { id: "post-2", title: "Second" },
  ];

  const deleted = deleteRawPostFromCollection(
    rawPosts,
    isTestPost,
    "post-1"
  );

  assert.equal(deleted.deleted, true);
  assert.deepEqual(deleted.posts, [malformed, { id: "post-2", title: "Second" }]);
});
