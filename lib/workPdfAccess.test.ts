import assert from "node:assert/strict";
import test from "node:test";
import { getAllowedWorkPdfUrl, hasKvEnv } from "./workPdfAccess";

const storedPdfUrl = "https://files.example.com/work.pdf";

test("getAllowedWorkPdfUrl returns stored HTTPS PDF URLs", () => {
  assert.equal(
    getAllowedWorkPdfUrl(storedPdfUrl, [{ pdfUrls: [storedPdfUrl] }]),
    storedPdfUrl
  );
});

test("getAllowedWorkPdfUrl rejects URLs not stored on a work post", () => {
  assert.equal(
    getAllowedWorkPdfUrl("https://evil.example.com/phish.pdf", [
      { pdfUrls: [storedPdfUrl] },
    ]),
    null
  );
});

test("getAllowedWorkPdfUrl rejects non-HTTPS URLs even when stored", () => {
  const httpUrl = "http://files.example.com/work.pdf";

  assert.equal(getAllowedWorkPdfUrl(httpUrl, [{ pdfUrls: [httpUrl] }]), null);
});

test("getAllowedWorkPdfUrl rejects malformed post data", () => {
  assert.equal(getAllowedWorkPdfUrl(storedPdfUrl, null), null);
  assert.equal(getAllowedWorkPdfUrl(storedPdfUrl, [{ pdfUrls: storedPdfUrl }]), null);
});

test("hasKvEnv requires both Vercel KV credentials", () => {
  assert.equal(hasKvEnv({ KV_REST_API_URL: "https://kv.example.com" }), false);
  assert.equal(hasKvEnv({ KV_REST_API_TOKEN: "token" }), false);
  assert.equal(
    hasKvEnv({
      KV_REST_API_URL: "https://kv.example.com",
      KV_REST_API_TOKEN: "token",
    }),
    true
  );
});
