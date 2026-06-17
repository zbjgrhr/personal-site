import assert from "node:assert/strict";
import test from "node:test";
import { findAuthorizedWorkPdfUrl } from "./workPdfAccess";

const savedPdfUrl = "https://files.public.blob.vercel-storage.com/saved.pdf";

test("authorizes only saved HTTPS work PDF URLs", () => {
  const postsData = [
    {
      id: "post-1",
      pdfUrls: [savedPdfUrl],
    },
  ];

  assert.equal(findAuthorizedWorkPdfUrl(postsData, savedPdfUrl), savedPdfUrl);
  assert.equal(
    findAuthorizedWorkPdfUrl(postsData, "https://attacker.example/fake.pdf"),
    null
  );
  assert.equal(
    findAuthorizedWorkPdfUrl([{ id: "post-2", pdfUrls: ["http://example.com/file.pdf"] }], "http://example.com/file.pdf"),
    null
  );
});
