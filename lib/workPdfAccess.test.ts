import assert from "node:assert/strict";
import test from "node:test";
import { getAllowedWorkPdfUrls } from "./workPdfAccess";

test("collects only HTTPS PDF URLs saved on work posts", () => {
  const allowed = getAllowedWorkPdfUrls([
    {
      id: "post-1",
      pdfUrls: [
        "https://blob.example.com/file.pdf",
        "http://blob.example.com/insecure.pdf",
        "javascript:alert(1)",
        "",
        42,
      ],
    },
    {
      id: "post-2",
      pdfUrls: ["https://cdn.example.com/another.pdf?download=1"],
    },
    {
      id: "post-3",
      pdfUrls: "https://cdn.example.com/not-an-array.pdf",
    },
  ]);

  assert.deepEqual([...allowed].sort(), [
    "https://blob.example.com/file.pdf",
    "https://cdn.example.com/another.pdf?download=1",
  ]);
});

test("ignores malformed post collections", () => {
  assert.equal(getAllowedWorkPdfUrls(null).size, 0);
  assert.equal(getAllowedWorkPdfUrls({ pdfUrls: ["https://example.com/a.pdf"] }).size, 0);
});
