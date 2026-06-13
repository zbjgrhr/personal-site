import assert from "node:assert/strict";
import test from "node:test";
import { isAllowedWorkPdfUrl } from "./workPdfAccess";

const posts = [
  {
    id: "post-1",
    pdfUrls: ["https://blob.example.com/project.pdf"],
  },
];

test("isAllowedWorkPdfUrl accepts saved HTTPS work PDF URLs", () => {
  assert.equal(
    isAllowedWorkPdfUrl(posts, "https://blob.example.com/project.pdf"),
    true
  );
});

test("isAllowedWorkPdfUrl rejects arbitrary external URLs", () => {
  assert.equal(
    isAllowedWorkPdfUrl(posts, "https://evil.example.com/fake-login.pdf"),
    false
  );
});

test("isAllowedWorkPdfUrl rejects non-HTTPS URLs", () => {
  assert.equal(
    isAllowedWorkPdfUrl(posts, "http://blob.example.com/project.pdf"),
    false
  );
});
