import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { getAuthorizedWorkPdfUrl } from "./workPdfAccess";

const storedPdfUrl = "https://blob.vercel-storage.com/portfolio.pdf";

describe("getAuthorizedWorkPdfUrl", () => {
  it("allows an exact HTTPS PDF URL stored on a work post", () => {
    const posts = [
      {
        id: "work-1",
        pdfUrls: [storedPdfUrl],
      },
    ];

    assert.equal(getAuthorizedWorkPdfUrl(storedPdfUrl, posts), storedPdfUrl);
  });

  it("blocks arbitrary HTTPS URLs that are not stored work PDFs", () => {
    const posts = [
      {
        id: "work-1",
        pdfUrls: [storedPdfUrl],
      },
    ];

    assert.equal(
      getAuthorizedWorkPdfUrl("https://attacker.example/phishing.pdf", posts),
      null
    );
  });

  it("requires stored PDF URLs to be HTTPS", () => {
    const httpUrl = "http://example.com/insecure.pdf";
    const posts = [
      {
        id: "work-1",
        pdfUrls: [httpUrl],
      },
    ];

    assert.equal(getAuthorizedWorkPdfUrl(httpUrl, posts), null);
  });

  it("fails closed for malformed or missing work post data", () => {
    assert.equal(getAuthorizedWorkPdfUrl(storedPdfUrl, null), null);
    assert.equal(getAuthorizedWorkPdfUrl(storedPdfUrl, [{ pdfUrls: [42] }]), null);
    assert.equal(getAuthorizedWorkPdfUrl("not a url", [{ pdfUrls: ["not a url"] }]), null);
  });
});
