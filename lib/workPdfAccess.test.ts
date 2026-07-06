import assert from "node:assert/strict";
import test from "node:test";
import { findAuthorizedPdfUrl } from "./workPdfAccess";

test("authorizes an HTTPS PDF URL saved on a work post", () => {
  const savedUrl = "https://example.public.blob.vercel-storage.com/work.pdf";

  assert.equal(
    findAuthorizedPdfUrl(savedUrl, [{ pdfUrls: [savedUrl] }]),
    savedUrl
  );
});

test("rejects arbitrary HTTPS URLs that are not saved on a work post", () => {
  assert.equal(
    findAuthorizedPdfUrl("https://attacker.example/phish.pdf", [
      { pdfUrls: ["https://example.public.blob.vercel-storage.com/work.pdf"] },
    ]),
    null
  );
});

test("rejects non-HTTPS URLs even if they are saved", () => {
  assert.equal(
    findAuthorizedPdfUrl("http://example.com/work.pdf", [
      { pdfUrls: ["http://example.com/work.pdf"] },
    ]),
    null
  );
});

test("ignores malformed work post data while checking saved PDFs", () => {
  const savedUrl = "https://example.public.blob.vercel-storage.com/work.pdf";

  assert.equal(
    findAuthorizedPdfUrl(savedUrl, [
      null,
      { pdfUrls: [123, savedUrl] },
      { pdfUrls: "https://attacker.example/phish.pdf" },
    ]),
    savedUrl
  );
});
