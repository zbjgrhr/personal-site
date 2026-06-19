import assert from "node:assert/strict";
import test from "node:test";
import { getAllowedWorkPdfUrlFromPosts } from "./workPdfAccess";

const storedPdfUrl = "https://blob.vercel-storage.com/work/spec.pdf";

test("allows an HTTPS PDF URL stored on a work post", () => {
  assert.equal(
    getAllowedWorkPdfUrlFromPosts(storedPdfUrl, [
      {
        title: "Stored work",
        pdfUrls: [storedPdfUrl],
      },
    ]),
    storedPdfUrl
  );
});

test("rejects an arbitrary HTTPS URL that is not stored on a work post", () => {
  assert.equal(
    getAllowedWorkPdfUrlFromPosts("https://attacker.example/phish.pdf", [
      {
        title: "Stored work",
        pdfUrls: [storedPdfUrl],
      },
    ]),
    null
  );
});

test("rejects stored non-HTTPS PDF URLs", () => {
  assert.equal(
    getAllowedWorkPdfUrlFromPosts("http://example.com/file.pdf", [
      {
        title: "Stored work",
        pdfUrls: ["http://example.com/file.pdf"],
      },
    ]),
    null
  );
});
