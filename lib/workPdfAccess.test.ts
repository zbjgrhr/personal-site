import assert from "node:assert/strict";
import test from "node:test";
import { getAllowedWorkPdfUrl } from "./workPdfAccess";

const storedPosts = [
  {
    id: "post-1",
    pdfUrls: [
      "https://assets.example.com/work/spec.pdf",
      "https://assets.example.com/work/notes.pdf",
    ],
  },
  {
    id: "post-2",
    pdfUrls: ["https://assets.example.com/other.pdf"],
  },
];

test("allows an exact HTTPS PDF URL stored on a work post", () => {
  assert.equal(
    getAllowedWorkPdfUrl("https://assets.example.com/work/spec.pdf", storedPosts),
    "https://assets.example.com/work/spec.pdf"
  );
});

test("rejects an HTTPS URL that is not stored on a work post", () => {
  assert.equal(
    getAllowedWorkPdfUrl("https://evil.example/phishing.pdf", storedPosts),
    null
  );
});

test("rejects non-HTTPS URLs even if they are present in stored data", () => {
  assert.equal(
    getAllowedWorkPdfUrl("http://assets.example.com/work/spec.pdf", [
      { pdfUrls: ["http://assets.example.com/work/spec.pdf"] },
    ]),
    null
  );
});

test("rejects malformed or missing collection data", () => {
  assert.equal(getAllowedWorkPdfUrl("not-a-url", storedPosts), null);
  assert.equal(
    getAllowedWorkPdfUrl("https://assets.example.com/work/spec.pdf", null),
    null
  );
  assert.equal(
    getAllowedWorkPdfUrl("https://assets.example.com/work/spec.pdf", [
      { pdfUrls: [42, null] },
    ]),
    null
  );
});
