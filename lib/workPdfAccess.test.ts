import assert from "node:assert/strict";
import test from "node:test";
import { isSavedWorkPdfUrl } from "./workPdfAccess";

const posts = [
  {
    title: "Project",
    pdfUrls: [
      "https://example.com/files/project.pdf",
      "https://blob.vercel-storage.com/encoded%20file.pdf",
    ],
  },
];

test("accepts an HTTPS PDF URL that is saved on a work post", () => {
  assert.equal(
    isSavedWorkPdfUrl("https://example.com/files/project.pdf", posts),
    true
  );
});

test("rejects arbitrary HTTPS URLs that are not saved on a work post", () => {
  assert.equal(
    isSavedWorkPdfUrl("https://attacker.example/fake-login.pdf", posts),
    false
  );
});

test("rejects non-HTTPS URLs even when the string appears in persisted data", () => {
  assert.equal(
    isSavedWorkPdfUrl("http://example.com/insecure.pdf", [
      { pdfUrls: ["http://example.com/insecure.pdf"] },
    ]),
    false
  );
});

test("matches equivalent encoded HTTPS URLs after URL normalization", () => {
  assert.equal(
    isSavedWorkPdfUrl(
      "https://blob.vercel-storage.com/encoded%20file.pdf",
      posts
    ),
    true
  );
});
