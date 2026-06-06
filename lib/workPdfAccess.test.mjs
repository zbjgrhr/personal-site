import test from "node:test";
import assert from "node:assert/strict";
import { findAllowedPdfUrl } from "./workPdfAccess.ts";

const posts = [
  {
    id: "work-1",
    pdfUrls: [
      "https://assets.example.com/docs/allowed.pdf",
      "not-a-url",
      42,
    ],
  },
  {
    id: "work-2",
    pdfUrls: ["http://assets.example.com/docs/insecure.pdf"],
  },
  {
    id: "work-3",
    pdfUrls: "https://assets.example.com/docs/not-an-array.pdf",
  },
];

test("allows HTTPS PDF URLs that are saved on work posts", () => {
  assert.equal(
    findAllowedPdfUrl("https://assets.example.com/docs/allowed.pdf", posts),
    "https://assets.example.com/docs/allowed.pdf"
  );
});

test("rejects arbitrary HTTPS URLs that are not saved on work posts", () => {
  assert.equal(
    findAllowedPdfUrl("https://attacker.example/phishing.pdf", posts),
    null
  );
});

test("rejects HTTP URLs even when they are present in stored data", () => {
  assert.equal(
    findAllowedPdfUrl("http://assets.example.com/docs/insecure.pdf", posts),
    null
  );
});

test("rejects malformed inputs and malformed stored data", () => {
  assert.equal(findAllowedPdfUrl("not-a-url", posts), null);
  assert.equal(findAllowedPdfUrl(null, posts), null);
  assert.equal(findAllowedPdfUrl("https://assets.example.com/docs/allowed.pdf", {}), null);
});
