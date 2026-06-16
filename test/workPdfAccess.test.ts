import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { isAllowedWorkPdfUrl } from "../lib/workPdfAccess";

describe("isAllowedWorkPdfUrl", () => {
  const allowedUrl = "https://files.public.blob.vercel-storage.com/work.pdf";

  it("allows an HTTPS URL saved on a work post", () => {
    assert.equal(
      isAllowedWorkPdfUrl(allowedUrl, [{ pdfUrls: [allowedUrl] }]),
      true
    );
  });

  it("rejects arbitrary external URLs that are not saved on a work post", () => {
    assert.equal(
      isAllowedWorkPdfUrl("https://example.com/fake-login.pdf", [
        { pdfUrls: [allowedUrl] },
      ]),
      false
    );
  });

  it("rejects saved non-HTTPS URLs", () => {
    const insecureUrl = "http://files.example.com/work.pdf";

    assert.equal(
      isAllowedWorkPdfUrl(insecureUrl, [{ pdfUrls: [insecureUrl] }]),
      false
    );
  });
});
