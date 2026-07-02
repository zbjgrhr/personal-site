import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  collectAllowedWorkPdfUrls,
  normalizeHttpsUrlForWorkPdf,
} from "./workPdfAccess";

describe("normalizeHttpsUrlForWorkPdf", () => {
  it("accepts only valid HTTPS URLs", () => {
    assert.equal(
      normalizeHttpsUrlForWorkPdf("https://files.example.com/doc.pdf"),
      "https://files.example.com/doc.pdf"
    );
    assert.equal(normalizeHttpsUrlForWorkPdf("http://files.example.com/doc.pdf"), null);
    assert.equal(normalizeHttpsUrlForWorkPdf("javascript:alert(1)"), null);
    assert.equal(normalizeHttpsUrlForWorkPdf("not a url"), null);
    assert.equal(normalizeHttpsUrlForWorkPdf(null), null);
  });
});

describe("collectAllowedWorkPdfUrls", () => {
  it("collects only HTTPS PDF URLs stored on work posts", () => {
    const allowed = collectAllowedWorkPdfUrls([
      {
        title: "Work",
        pdfUrls: [
          "https://blob.example.com/allowed.pdf",
          "http://blob.example.com/insecure.pdf",
          "not a url",
          42,
        ],
      },
      { pdfUrls: "https://blob.example.com/not-array.pdf" },
      null,
    ]);

    assert.deepEqual([...allowed], ["https://blob.example.com/allowed.pdf"]);
  });
});
