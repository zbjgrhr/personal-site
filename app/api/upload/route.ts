import { NextRequest, NextResponse } from "next/server";
import { put } from "@vercel/blob";
import { isAdmin } from "@/lib/auth";

export async function POST(request: NextRequest) {
  const admin = await isAdmin();
  if (!admin) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  if (!process.env.BLOB_READ_WRITE_TOKEN) {
    return NextResponse.json(
      {
        error:
          "Blob storage is not configured. Please set BLOB_READ_WRITE_TOKEN (see docs/env.md).",
      },
      { status: 503 }
    );
  }
  const formData = await request.formData();
  const file = formData.get("file");
  if (!file || !(file instanceof Blob)) {
    return NextResponse.json({ error: "Missing file" }, { status: 400 });
  }
  const name = (file as File).name || `upload-${Date.now()}`;
  try {
    const blob = await put(name, file, {
      access: "public",
      token: process.env.BLOB_READ_WRITE_TOKEN,
    });
    return NextResponse.json({ url: blob.url });
  } catch (err) {
    console.error("Upload error:", err);
    return NextResponse.json(
      { error: "Upload failed" },
      { status: 500 }
    );
  }
}
