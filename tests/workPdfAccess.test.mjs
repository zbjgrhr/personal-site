import assert from "node:assert/strict";
import test from "node:test";

import { findAllowedWorkPdfUrl } from "../lib/workPdfAccess.ts";

const storedPdfUrl =
  "https://example.public.blob.vercel-storage.com/projects/case-study.pdf";

test("allows a HTTPS PDF URL already saved on a work post", () => {
  const posts = [
    {
      title: "Case study",
      pdfUrls: [storedPdfUrl],
    },
  ];

  assert.equal(findAllowedWorkPdfUrl(posts, storedPdfUrl), storedPdfUrl);
});

test("rejects arbitrary external HTTPS URLs not saved on a work post", () => {
  const posts = [
    {
      title: "Case study",
      pdfUrls: [storedPdfUrl],
    },
  ];

  assert.equal(
    findAllowedWorkPdfUrl(posts, "https://example.com/fake-login"),
    null
  );
});

test("rejects non-HTTPS saved URLs", () => {
  const httpUrl = "http://example.com/case-study.pdf";
  const posts = [
    {
      title: "Case study",
      pdfUrls: [httpUrl],
    },
  ];

  assert.equal(findAllowedWorkPdfUrl(posts, httpUrl), null);
});

test("ignores malformed post data while checking saved URLs", () => {
  const posts = [
    null,
    { title: "No PDFs" },
    { title: "Malformed PDFs", pdfUrls: ["not a url", 123] },
    { title: "Case study", pdfUrls: [storedPdfUrl] },
  ];

  assert.equal(findAllowedWorkPdfUrl(posts, storedPdfUrl), storedPdfUrl);
});
