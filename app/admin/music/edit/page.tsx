"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useState, useRef, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { MUSIC_TAGS } from "@/lib/musicTags";

type Post = {
  id: string;
  slug: string;
  title: string;
  content: string;
  imageUrls: string[];
  videoUrls: string[];
  tag?: string;
  createdAt: string;
};

export default function EditMusicPostPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const id = searchParams.get("id");

  const [post, setPost] = useState<Post | null>(null);
  const [loading, setLoading] = useState(true);
  const [title, setTitle] = useState("");
  const [tag, setTag] = useState<"Voc." | "Wr." | "Aud.">("Voc.");
  const [content, setContent] = useState("");
  const [imageUrls, setImageUrls] = useState<string[]>([]);
  const [videoUrls, setVideoUrls] = useState<string[]>([]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const imageInputRef = useRef<HTMLInputElement>(null);
  const videoInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!id) {
      setLoading(false);
      return;
    }
    fetch("/api/music/posts")
      .then((res) => res.json())
      .then((data: { posts: Post[] }) => {
        const p = data.posts?.find((x) => x.id === id) ?? null;
        setPost(p);
        if (p) {
          setTitle(p.title);
          setContent(p.content);
          setTag(
            p.tag === "Wr." || p.tag === "Aud." ? p.tag : "Voc."
          );
          setImageUrls(p.imageUrls ?? []);
          setVideoUrls(p.videoUrls ?? []);
        }
      })
      .catch(() => setPost(null))
      .finally(() => setLoading(false));
  }, [id]);

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

  function removeImage(index: number) {
    setImageUrls((prev) => prev.filter((_, i) => i !== index));
  }

  function removeVideo(index: number) {
    setVideoUrls((prev) => prev.filter((_, i) => i !== index));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!id || !post) return;
    if (!title.trim()) {
      setError("Title is required.");
      return;
    }
    setSaving(true);
    setError("");
    try {
      const res = await fetch(`/api/music/posts?id=${encodeURIComponent(id)}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: title.trim(),
          tag,
          content,
          imageUrls,
          videoUrls,
        }),
      });
      if (!res.ok) {
        const d = await res.json().catch(() => ({}));
        throw new Error(d.error || "Failed to save");
      }
      router.push("/admin/music");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <div className="text-zinc-600 dark:text-zinc-400">Loading…</div>
    );
  }
  if (!id || !post) {
    return (
      <div className="space-y-4">
        <p className="text-zinc-600 dark:text-zinc-400">Post not found.</p>
        <Link href="/admin/music" className="text-sm underline hover:no-underline">
          ← Music posts
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-2xl space-y-6">
      <Link
        href="/admin/music"
        className="text-sm text-zinc-600 hover:underline dark:text-zinc-400"
      >
        ← Music posts
      </Link>
      <h1 className="text-xl font-semibold text-zinc-900 dark:text-zinc-50">
        Edit post
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
          <span className="block text-sm font-medium text-zinc-700 dark:text-zinc-300">
            Tag
          </span>
          <div className="mt-2 flex gap-4">
            {MUSIC_TAGS.map((t) => (
              <label key={t} className="flex items-center gap-2">
                <input
                  type="radio"
                  name="tag"
                  value={t}
                  checked={tag === t}
                  onChange={() => setTag(t)}
                  className="rounded-full border-zinc-300 text-zinc-900 focus:ring-zinc-500 dark:border-zinc-600 dark:bg-zinc-800 dark:text-zinc-50"
                />
                <span className="text-sm text-zinc-700 dark:text-zinc-300">{t}</span>
              </label>
            ))}
          </div>
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
        {error && (
          <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
        )}
        <button
          type="submit"
          disabled={saving}
          className="rounded bg-zinc-900 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-800 disabled:opacity-50 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-200"
        >
          {saving ? "Saving…" : "Save"}
        </button>
      </form>
    </div>
  );
}
