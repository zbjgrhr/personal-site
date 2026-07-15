import assert from "node:assert/strict";
import test from "node:test";
import { resolveUpdatedSlug } from "./postSlug";

test("preserves the current slug when an update omits a slug", () => {
  assert.equal(resolveUpdatedSlug(undefined, "published-url"), "published-url");
});

test("preserves the current slug when an update sends a blank slug", () => {
  assert.equal(resolveUpdatedSlug("   ", "published-url"), "published-url");
});

test("normalizes an explicitly requested replacement slug", () => {
  assert.equal(resolveUpdatedSlug(" New Public URL ", "published-url"), "new-public-url");
});
