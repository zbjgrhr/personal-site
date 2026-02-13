import { kv } from "@vercel/kv";
import {
  HomeSections,
  type BlogPostSummary,
  type MusicPostSummary,
  type WorkPostSummary,
} from "./HomeSections";

async function getAboutPhotoUrl(): Promise<string | null> {
  try {
    const url = await kv.get<string>("about:photo_url");
    return url ?? null;
  } catch {
    return null;
  }
}

function parseBlogPosts(data: unknown): BlogPostSummary[] {
  if (!Array.isArray(data)) return [];
  return data.filter(
    (p): p is BlogPostSummary =>
      p &&
      typeof p === "object" &&
      typeof (p as BlogPostSummary).id === "string" &&
      typeof (p as BlogPostSummary).slug === "string" &&
      typeof (p as BlogPostSummary).title === "string" &&
      typeof (p as BlogPostSummary).content === "string" &&
      Array.isArray((p as BlogPostSummary).imageUrls) &&
      typeof (p as BlogPostSummary).createdAt === "string"
  );
}

function parseMusicPosts(data: unknown): MusicPostSummary[] {
  if (!Array.isArray(data)) return [];
  return data
    .filter(
      (p): p is MusicPostSummary =>
        p &&
        typeof p === "object" &&
        typeof (p as MusicPostSummary).id === "string" &&
        typeof (p as MusicPostSummary).slug === "string" &&
        typeof (p as MusicPostSummary).title === "string" &&
        typeof (p as MusicPostSummary).content === "string" &&
        Array.isArray((p as MusicPostSummary).imageUrls) &&
        typeof (p as MusicPostSummary).createdAt === "string"
    )
    .map((p) => ({
      ...p,
      videoUrls: Array.isArray((p as MusicPostSummary).videoUrls)
        ? (p as MusicPostSummary).videoUrls.filter((u): u is string => typeof u === "string")
        : [],
    }));
}

function parseWorkPosts(data: unknown): WorkPostSummary[] {
  if (!Array.isArray(data)) return [];
  return data
    .filter(
      (p): p is WorkPostSummary =>
        p &&
        typeof p === "object" &&
        typeof (p as WorkPostSummary).id === "string" &&
        typeof (p as WorkPostSummary).slug === "string" &&
        typeof (p as WorkPostSummary).title === "string" &&
        typeof (p as WorkPostSummary).content === "string" &&
        Array.isArray((p as WorkPostSummary).imageUrls) &&
        typeof (p as WorkPostSummary).createdAt === "string"
    )
    .map((p) => {
      const raw = p as WorkPostSummary & { videoUrls?: unknown; audioUrls?: unknown };
      return {
        ...p,
        videoUrls: Array.isArray(raw.videoUrls)
          ? raw.videoUrls.filter((u): u is string => typeof u === "string")
          : [],
        audioUrls: Array.isArray(raw.audioUrls)
          ? raw.audioUrls.filter((u): u is string => typeof u === "string")
          : [],
      };
    });
}

async function getWorkPosts(): Promise<WorkPostSummary[]> {
  try {
    const data = await kv.get<unknown>("work:posts");
    const posts = parseWorkPosts(data ?? []);
    posts.sort((a, b) => (b.createdAt > a.createdAt ? 1 : -1));
    return posts;
  } catch {
    return [];
  }
}

async function getBlogPosts(): Promise<BlogPostSummary[]> {
  try {
    const data = await kv.get<unknown>("blog:posts");
    const posts = parseBlogPosts(data ?? []);
    posts.sort((a, b) => (b.createdAt > a.createdAt ? 1 : -1));
    return posts;
  } catch {
    return [];
  }
}

async function getMusicPosts(): Promise<MusicPostSummary[]> {
  try {
    const data = await kv.get<unknown>("music:posts");
    const posts = parseMusicPosts(data ?? []);
    posts.sort((a, b) => (b.createdAt > a.createdAt ? 1 : -1));
    return posts;
  } catch {
    return [];
  }
}

export default async function Home() {
  const [aboutPhotoUrl, blogPosts, musicPosts, workPosts] = await Promise.all([
    getAboutPhotoUrl(),
    getBlogPosts(),
    getMusicPosts(),
    getWorkPosts(),
  ]);

  return (
    <HomeSections
      aboutPhotoUrl={aboutPhotoUrl}
      blogPosts={blogPosts}
      musicPosts={musicPosts}
      workPosts={workPosts}
    />
  );
}
