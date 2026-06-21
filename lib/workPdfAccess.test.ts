import assert from "node:assert/strict";
import { test } from "node:test";
import { isAllowedWorkPdfUrl } from "./workPdfAccess";

const savedPdfUrl = "https://assets.public.blob.vercel-storage.com/doc.pdf";

test("allows exact HTTPS PDF URLs saved on work posts", () => {
  const posts = [
    {
      id: "post-1",
      pdfUrls: [savedPdfUrl],
    },
  ];

  assert.equal(isAllowedWorkPdfUrl(posts, savedPdfUrl), true);
});

test("rejects arbitrary HTTPS URLs that are not saved work PDFs", () => {
  const posts = [
    {
      id: "post-1",
      pdfUrls: [savedPdfUrl],
    },
  ];

  assert.equal(
    isAllowedWorkPdfUrl(posts, "https://attacker.example/phishing.pdf"),
    false
  );
});

test("rejects saved non-HTTPS URLs", () => {
  const httpPdfUrl = "http://assets.example/doc.pdf";
  const posts = [
    {
      id: "post-1",
      pdfUrls: [httpPdfUrl],
    },
  ];

  assert.equal(isAllowedWorkPdfUrl(posts, httpPdfUrl), false);
});

test("rejects malformed stored data", () => {
  assert.equal(isAllowedWorkPdfUrl({ pdfUrls: [savedPdfUrl] }, savedPdfUrl), false);
});
