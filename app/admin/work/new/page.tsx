"use client";

import { useRouter } from "next/navigation";
import { useState, useRef } from "react";
import Image from "next/image";
import Link from "next/link";

export default function NewWorkPostPage() {
  const router = useRouter();
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [imageUrls, setImageUrls] = useState<string[]>([]);
  const [videoUrls, setVideoUrls] = useState<string[]>([]);
  const [audioUrls, setAudioUrls] = useState<string[]>([]);
  const [pdfUrls, setPdfUrls] = useState<string[]>([]);
  const [zipUrls, setZipUrls] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const imageInputRef = useRef<HTMLInputElement>(null);
  const videoInputRef = useRef<HTMLInputElement>(null);
  const audioInputRef = useRef<HTMLInputElement>(null);
  const pdfInputRef = useRef<HTMLInputElement>(null);
  const zipInputRef = useRef<HTMLInputElement>(null);

  async function uploadFile(file: File): Promise<string> {
    const formData = new FormData();
    formData.set("file", file);
    const res = await fetch("/api/upload", { method: "POST", body: formData });
    if (!res.ok) {
      const d = await res.json().catch(() => ({}));
      throw new Error(d.error || "Upload failed");
    }
    const { url } = await res.json();
    return url;
  }

  async function onImageFilesSelected(e: React.ChangeEvent<HTMLInputElement>) {
    const files = e.target.files;
    if (!files?.length) return;
    setError("");
    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      if (!file.type.startsWith("image/")) continue;
      try {
        const url = await uploadFile(file);
        setImageUrls((prev) => [...prev, url]);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Upload failed");
        break;
      }
    }
    e.target.value = "";
  }

  async function onVideoFilesSelected(e: React.ChangeEvent<HTMLInputElement>) {
    const files = e.target.files;
    if (!files?.length) return;
    setError("");
    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      if (!file.type.startsWith("video/")) continue;
      try {
        const url = await uploadFile(file);
        setVideoUrls((prev) => [...prev, url]);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Upload failed");
        break;
      }
    }
    e.target.value = "";
  }

  async function onAudioFilesSelected(e: React.ChangeEvent<HTMLInputElement>) {
    const files = e.target.files;
    if (!files?.length) return;
    setError("");
    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      if (!file.type.startsWith("audio/")) continue;
      try {
        const url = await uploadFile(file);
        setAudioUrls((prev) => [...prev, url]);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Upload failed");
        break;
      }
    }
    e.target.value = "";
  }

  function removeImage(index: number) {
    setImageUrls((prev) => prev.filter((_, i) => i !== index));
  }

  function removeVideo(index: number) {
    setVideoUrls((prev) => prev.filter((_, i) => i !== index));
  }

  function removeAudio(index: number) {
    setAudioUrls((prev) => prev.filter((_, i) => i !== index));
  }

  async function onPdfFilesSelected(e: React.ChangeEvent<HTMLInputElement>) {
    const files = e.target.files;
    if (!files?.length) return;
    setError("");
    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      if (file.type !== "application/pdf") continue;
      try {
        const url = await uploadFile(file);
        setPdfUrls((prev) => [...prev, url]);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Upload failed");
        break;
      }
    }
    e.target.value = "";
  }

  async function onZipFilesSelected(e: React.ChangeEvent<HTMLInputElement>) {
    const files = e.target.files;
    if (!files?.length) return;
    setError("");
    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      const isZip =
        file.type === "application/zip" ||
        file.type === "application/x-zip-compressed" ||
        file.name.toLowerCase().endsWith(".zip");
      if (!isZip) continue;
      try {
        const url = await uploadFile(file);
        setZipUrls((prev) => [...prev, url]);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Upload failed");
        break;
      }
    }
    e.target.value = "";
  }

  function removePdf(index: number) {
    setPdfUrls((prev) => prev.filter((_, i) => i !== index));
  }

  function removeZip(index: number) {
    setZipUrls((prev) => prev.filter((_, i) => i !== index));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim()) {
      setError("Title is required.");
      return;
    }
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/work/posts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: title.trim(),
          content,
          imageUrls,
          videoUrls,
          audioUrls,
          pdfUrls,
          zipUrls,
        }),
      });
      if (!res.ok) {
        const d = await res.json().catch(() => ({}));
        throw new Error(d.error || "Failed to save");
      }
      router.push("/admin/work");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="max-w-2xl space-y-6">
      <Link
        href="/admin/work"
        className="text-sm text-zinc-600 hover:underline dark:text-zinc-400"
      >
        ← Work posts
      </Link>
      <h1 className="text-xl font-semibold text-zinc-900 dark:text-zinc-50">
        New post
      </h1>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300">
            Title
          </label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="mt-1 w-full rounded border border-zinc-300 bg-white px-3 py-2 text-zinc-900 dark:border-zinc-600 dark:bg-zinc-800 dark:text-zinc-50"
            required
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300">
            Content (emoji supported)
          </label>
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            rows={8}
            className="mt-1 w-full rounded border border-zinc-300 bg-white px-3 py-2 text-zinc-900 dark:border-zinc-600 dark:bg-zinc-800 dark:text-zinc-50"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300">
            Images
          </label>
          <input
            ref={imageInputRef}
            type="file"
            accept="image/*"
            multiple
            onChange={onImageFilesSelected}
            className="sr-only"
          />
          <button
            type="button"
            onClick={() => imageInputRef.current?.click()}
            className="mt-1 rounded border border-zinc-300 bg-white px-4 py-2 text-sm text-zinc-700 hover:bg-zinc-50 dark:border-zinc-600 dark:bg-zinc-800 dark:text-zinc-300 dark:hover:bg-zinc-700"
          >
            Add images
          </button>
          {imageUrls.length > 0 && (
            <ul className="mt-3 flex flex-wrap gap-3">
              {imageUrls.map((url, i) => (
                <li key={i} className="relative">
                  <div className="relative h-24 w-24 overflow-hidden rounded border border-zinc-200 dark:border-zinc-700">
                    <Image
                      src={url}
                      alt=""
                      fill
                      className="object-cover"
                      unoptimized
                    />
                  </div>
                  <button
                    type="button"
                    onClick={() => removeImage(i)}
                    className="absolute -right-1 -top-1 rounded-full bg-red-500 px-1.5 py-0.5 text-xs text-white"
                  >
                    ×
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
        <div>
          <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300">
            Videos
          </label>
          <input
            ref={videoInputRef}
            type="file"
            accept="video/*"
            multiple
            onChange={onVideoFilesSelected}
            className="sr-only"
          />
          <button
            type="button"
            onClick={() => videoInputRef.current?.click()}
            className="mt-1 rounded border border-zinc-300 bg-white px-4 py-2 text-sm text-zinc-700 hover:bg-zinc-50 dark:border-zinc-600 dark:bg-zinc-800 dark:text-zinc-300 dark:hover:bg-zinc-700"
          >
            Add videos
          </button>
          {videoUrls.length > 0 && (
            <ul className="mt-3 flex flex-wrap gap-3">
              {videoUrls.map((url, i) => (
                <li key={i} className="relative">
                  <div className="relative h-24 w-32 overflow-hidden rounded border border-zinc-200 dark:border-zinc-700">
                    <video
                      src={url}
                      className="h-full w-full object-cover"
                      muted
                      preload="metadata"
                    />
                  </div>
                  <button
                    type="button"
                    onClick={() => removeVideo(i)}
                    className="absolute -right-1 -top-1 rounded-full bg-red-500 px-1.5 py-0.5 text-xs text-white"
                  >
                    ×
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
        <div>
          <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300">
            Audios
          </label>
          <input
            ref={audioInputRef}
            type="file"
            accept="audio/*"
            multiple
            onChange={onAudioFilesSelected}
            className="sr-only"
          />
          <button
            type="button"
            onClick={() => audioInputRef.current?.click()}
            className="mt-1 rounded border border-zinc-300 bg-white px-4 py-2 text-sm text-zinc-700 hover:bg-zinc-50 dark:border-zinc-600 dark:bg-zinc-800 dark:text-zinc-300 dark:hover:bg-zinc-700"
          >
            Add audios
          </button>
          {audioUrls.length > 0 && (
            <ul className="mt-3 space-y-2">
              {audioUrls.map((url, i) => (
                <li key={i} className="flex items-center gap-2">
                  <audio src={url} controls className="max-w-xs" />
                  <button
                    type="button"
                    onClick={() => removeAudio(i)}
                    className="rounded-full bg-red-500 px-2 py-0.5 text-xs text-white"
                  >
                    ×
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
        <div>
          <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300">
            PDFs
          </label>
          <input
            ref={pdfInputRef}
            type="file"
            accept="application/pdf"
            multiple
            onChange={onPdfFilesSelected}
            className="sr-only"
          />
          <button
            type="button"
            onClick={() => pdfInputRef.current?.click()}
            className="mt-1 rounded border border-zinc-300 bg-white px-4 py-2 text-sm text-zinc-700 hover:bg-zinc-50 dark:border-zinc-600 dark:bg-zinc-800 dark:text-zinc-300 dark:hover:bg-zinc-700"
          >
            Add PDFs
          </button>
          {pdfUrls.length > 0 && (
            <ul className="mt-3 space-y-2">
              {pdfUrls.map((url, i) => (
                <li key={i} className="flex items-center gap-2">
                  <span className="text-sm text-zinc-600 dark:text-zinc-400">
                    PDF {i + 1}
                  </span>
                  <a
                    href={url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm text-zinc-700 underline dark:text-zinc-300"
                  >
                    View
                  </a>
                  <button
                    type="button"
                    onClick={() => removePdf(i)}
                    className="rounded-full bg-red-500 px-2 py-0.5 text-xs text-white"
                  >
                    ×
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
        <div>
          <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300">
            Zips
          </label>
          <input
            ref={zipInputRef}
            type="file"
            accept=".zip,application/zip,application/x-zip-compressed"
            multiple
            onChange={onZipFilesSelected}
            className="sr-only"
          />
          <button
            type="button"
            onClick={() => zipInputRef.current?.click()}
            className="mt-1 rounded border border-zinc-300 bg-white px-4 py-2 text-sm text-zinc-700 hover:bg-zinc-50 dark:border-zinc-600 dark:bg-zinc-800 dark:text-zinc-300 dark:hover:bg-zinc-700"
          >
            Add zips
          </button>
          {zipUrls.length > 0 && (
            <ul className="mt-3 space-y-2">
              {zipUrls.map((url, i) => (
                <li key={i} className="flex items-center gap-2">
                  <span className="text-sm text-zinc-600 dark:text-zinc-400">
                    Zip {i + 1}
                  </span>
                  <button
                    type="button"
                    onClick={() => removeZip(i)}
                    className="rounded-full bg-red-500 px-2 py-0.5 text-xs text-white"
                  >
                    ×
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
        {error && (
          <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
        )}
        <button
          type="submit"
          disabled={loading}
          className="rounded bg-zinc-900 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-800 disabled:opacity-50 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-200"
        >
          {loading ? "Saving…" : "Publish"}
        </button>
      </form>
    </div>
  );
}
