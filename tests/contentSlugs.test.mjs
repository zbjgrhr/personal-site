import assert from "node:assert/strict";
import test from "node:test";
import {
  slugForNewPost,
  slugForUpdatedPost,
  slugify,
} from "../lib/contentSlugs.ts";

const posts = [
  { id: "1", slug: "demo" },
  { id: "2", slug: "demo-2" },
];

test("slugify creates safe fallback slugs", () => {
  assert.equal(slugify(" Demo Post! "), "demo-post");
  assert.equal(slugify("!!!"), "post");
});

test("new post slugs are unique", () => {
  assert.equal(slugForNewPost("Demo", posts), "demo-3");
});

test("updates preserve existing slugs when no slug is requested", () => {
  assert.equal(slugForUpdatedPost(posts[0], posts), "demo");
});

test("requested update slugs avoid other posts", () => {
  assert.equal(slugForUpdatedPost(posts[0], posts, "Demo"), "demo");
  assert.equal(slugForUpdatedPost(posts[0], posts, "Demo 2"), "demo-2-2");
});
