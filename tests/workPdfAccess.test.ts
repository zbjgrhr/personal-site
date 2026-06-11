import assert from "node:assert/strict";
import test from "node:test";
import { getAllowedWorkPdfUrl } from "../lib/workPdfAccess";

const savedPdfUrl = "https://blob.vercel-storage.com/saved.pdf";

const client = {
  async get<T = unknown>(_key: string): Promise<T | null> {
    return [
      {
        pdfUrls: [savedPdfUrl],
      },
    ] as T;
  },
};

test("getAllowedWorkPdfUrl allows PDFs saved on work posts", async () => {
  assert.equal(await getAllowedWorkPdfUrl(savedPdfUrl, client), savedPdfUrl);
});

test("getAllowedWorkPdfUrl rejects arbitrary and non-HTTPS URLs", async () => {
  assert.equal(
    await getAllowedWorkPdfUrl("https://attacker.example/fake.pdf", client),
    null
  );
  assert.equal(
    await getAllowedWorkPdfUrl("http://blob.vercel-storage.com/saved.pdf", client),
    null
  );
});
