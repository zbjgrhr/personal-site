import { kv } from "@vercel/kv";
import { PhotographsGrid, type MediaItem } from "./PhotographsGrid";

const BLOG_KEY = "blog:posts";
const MUSIC_KEY = "music:posts";
const ABOUT_PHOTO_KEY = "about:photo_url";

type BlogPost = {
  id: string;
  slug: string;
  title: string;
  content: string;
  imageUrls: string[];
  createdAt: string;
};

type MusicPost = {
  id: string;
  slug: string;
  title: string;
  content: string;
  imageUrls: string[];
  videoUrls: string[];
  createdAt: string;
};

function parseBlogPosts(data: unknown): BlogPost[] {
  if (!Array.isArray(data)) return [];
  return data.filter(
    (p): p is BlogPost =>
      p &&
      typeof p === "object" &&
      typeof (p as BlogPost).id === "string" &&
      typeof (p as BlogPost).slug === "string" &&
      typeof (p as BlogPost).title === "string" &&
      typeof (p as BlogPost).content === "string" &&
      Array.isArray((p as BlogPost).imageUrls) &&
      typeof (p as BlogPost).createdAt === "string"
  );
}

function parseMusicPosts(data: unknown): MusicPost[] {
  if (!Array.isArray(data)) return [];
  return data
    .filter(
      (p): p is MusicPost =>
        p &&
        typeof p === "object" &&
        typeof (p as MusicPost).id === "string" &&
        typeof (p as MusicPost).slug === "string" &&
        typeof (p as MusicPost).title === "string" &&
        typeof (p as MusicPost).content === "string" &&
        Array.isArray((p as MusicPost).imageUrls) &&
        typeof (p as MusicPost).createdAt === "string"
    )
    .map((p) => ({
      ...p,
      videoUrls: Array.isArray((p as MusicPost).videoUrls)
        ? (p as MusicPost).videoUrls.filter((u): u is string => typeof u === "string")
        : [],
    }));
}

async function getAllMedia(): Promise<MediaItem[]> {
  const [blogData, musicData, aboutUrl] = await Promise.all([
    kv.get<unknown>(BLOG_KEY),
    kv.get<unknown>(MUSIC_KEY),
    kv.get<string>(ABOUT_PHOTO_KEY),
  ]);

  const items: MediaItem[] = [];
  const now = new Date().toISOString();

  const blogPosts = parseBlogPosts(blogData ?? []);
  for (const post of blogPosts) {
    const urls = post.imageUrls ?? [];
    for (let i = 0; i < urls.length; i++) {
      if (typeof urls[i] !== "string") continue;
      items.push({
        id: `blog-${post.id}-${i}`,
        type: "image",
        url: urls[i],
        source: "blog",
        createdAt: post.createdAt ?? now,
        title: post.title,
        link: `/blog/${post.slug}`,
      });
    }
  }

  const musicPosts = parseMusicPosts(musicData ?? []);
  for (const post of musicPosts) {
    const imageUrls = post.imageUrls ?? [];
    const videoUrls = post.videoUrls ?? [];
    for (let i = 0; i < imageUrls.length; i++) {
      if (typeof imageUrls[i] !== "string") continue;
      items.push({
        id: `music-${post.id}-img-${i}`,
        type: "image",
        url: imageUrls[i],
        source: "music",
        createdAt: post.createdAt ?? now,
        title: post.title,
        link: `/music/${post.slug}`,
      });
    }
    for (let i = 0; i < videoUrls.length; i++) {
      if (typeof videoUrls[i] !== "string") continue;
      items.push({
        id: `music-${post.id}-vid-${i}`,
        type: "video",
        url: videoUrls[i],
        source: "music",
        createdAt: post.createdAt ?? now,
        title: post.title,
        link: `/music/${post.slug}`,
      });
    }
  }

  if (aboutUrl && typeof aboutUrl === "string") {
    items.push({
      id: "about-photo",
      type: "image",
      url: aboutUrl,
      source: "about",
      createdAt: now,
      title: "About",
      link: "/about",
    });
  }

  items.sort((a, b) => (b.createdAt > a.createdAt ? 1 : -1));
  return items;
}

export default async function PhotographsPage() {
  const allMedia = await getAllMedia();

  return (
    <article className="space-y-8">
      <header className="space-y-2">
        <h1 className="text-3xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-50">
          Photographs
        </h1>
        <p className="text-lg leading-relaxed text-zinc-700 dark:text-zinc-300">
          Photos and videos from across the site — blog, music, about, and more.
        </p>
      </header>
      <PhotographsGrid items={allMedia} />
    </article>
  );
}
