import assert from "node:assert/strict";
import test from "node:test";
import { makeUniqueSlug, slugify } from "./slugs";

test("slugify normalizes ascii titles", () => {
  assert.equal(slugify(" Hello,  World! "), "hello-world");
});

test("makeUniqueSlug falls back when preferred text has no ascii slug", () => {
  assert.equal(makeUniqueSlug("测试作品", "post-123", []), "post-123");
});

test("makeUniqueSlug appends a suffix for collisions", () => {
  const existing = [
    { id: "1", slug: "same-title" },
    { id: "2", slug: "same-title-2" },
  ];

  assert.equal(makeUniqueSlug("Same Title", "post-3", existing), "same-title-3");
});

test("makeUniqueSlug ignores the current post when editing", () => {
  const existing = [
    { id: "1", slug: "same-title" },
    { id: "2", slug: "other-title" },
  ];

  assert.equal(
    makeUniqueSlug("Same Title", "post-1", existing, "1"),
    "same-title"
  );
});
