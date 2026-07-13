import assert from "node:assert/strict";
import test from "node:test";
import { getAllowedWorkPdfUrls, isAllowedWorkPdfUrl } from "./workPdfAccess";

const savedPdf = "https://blob.example.com/work.pdf";

test("getAllowedWorkPdfUrls collects saved https PDF URLs", () => {
  const urls = getAllowedWorkPdfUrls([
    { pdfUrls: [savedPdf, "http://blob.example.com/insecure.pdf", 42] },
    { pdfUrls: ["https://blob.example.com/second.pdf"] },
    { pdfUrls: "https://blob.example.com/not-an-array.pdf" },
  ]);

  assert.deepEqual([...urls].sort(), [
    "https://blob.example.com/second.pdf",
    savedPdf,
  ]);
});

test("isAllowedWorkPdfUrl rejects unsaved, insecure, and invalid URLs", () => {
  const data = [{ pdfUrls: [savedPdf] }];

  assert.equal(isAllowedWorkPdfUrl(savedPdf, data), true);
  assert.equal(
    isAllowedWorkPdfUrl("https://evil.example.com/fake.pdf", data),
    false
  );
  assert.equal(isAllowedWorkPdfUrl("http://blob.example.com/work.pdf", data), false);
  assert.equal(isAllowedWorkPdfUrl("not a url", data), false);
  assert.equal(isAllowedWorkPdfUrl(null, data), false);
});
