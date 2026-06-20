import assert from "node:assert/strict";
import test from "node:test";
import { getAllowedWorkPdfUrl } from "./workPdfAccess";

const allowedPdf = "https://files.example.com/work/demo.pdf";

test("allows an HTTPS PDF URL that is stored on a work post", () => {
  assert.equal(
    getAllowedWorkPdfUrl(allowedPdf, [{ id: "1", pdfUrls: [allowedPdf] }]),
    allowedPdf
  );
});

test("rejects HTTPS URLs that are not stored on a work post", () => {
  assert.equal(
    getAllowedWorkPdfUrl("https://evil.example/phish.pdf", [
      { id: "1", pdfUrls: [allowedPdf] },
    ]),
    null
  );
});

test("rejects non-HTTPS stored PDF URLs", () => {
  const httpPdf = "http://files.example.com/work/demo.pdf";

  assert.equal(
    getAllowedWorkPdfUrl(httpPdf, [{ id: "1", pdfUrls: [httpPdf] }]),
    null
  );
});

test("rejects malformed or missing requested URLs", () => {
  assert.equal(
    getAllowedWorkPdfUrl("not a url", [{ id: "1", pdfUrls: [allowedPdf] }]),
    null
  );
  assert.equal(
    getAllowedWorkPdfUrl(null, [{ id: "1", pdfUrls: [allowedPdf] }]),
    null
  );
});

test("rejects requests when work posts data is unavailable", () => {
  assert.equal(getAllowedWorkPdfUrl(allowedPdf, null), null);
});
