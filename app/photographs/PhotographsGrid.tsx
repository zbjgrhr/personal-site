"use client";

import { useRef } from "react";
import Image from "next/image";
import Link from "next/link";

export type MediaItem = {
  id: string;
  type: "image" | "video";
  url: string;
  source: "blog" | "music" | "about" | "work";
  createdAt: string;
  title?: string;
  link?: string;
};

const SOURCE_LABELS: Record<MediaItem["source"], string> = {
  blog: "Blog",
  music: "Music",
  about: "About",
  work: "Work",
};

function MediaCard({ item }: { item: MediaItem }) {
  const videoRef = useRef<HTMLVideoElement>(null);

  const content =
    item.type === "video" ? (
      <div
        className="relative aspect-square w-full overflow-hidden rounded-lg bg-zinc-100 dark:bg-zinc-800"
        onMouseEnter={() => videoRef.current?.play()}
        onMouseLeave={() => {
          const v = videoRef.current;
          if (v) {
            v.pause();
            v.currentTime = 0;
          }
        }}
      >
        <video
          ref={videoRef}
          src={item.url}
          className="h-full w-full object-cover"
          muted
          loop
          playsInline
          preload="metadata"
        />
      </div>
    ) : (
      <div className="relative aspect-square w-full overflow-hidden rounded-lg bg-zinc-100 dark:bg-zinc-800">
        <Image
          src={item.url}
          alt=""
          fill
          className="object-cover"
          sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
          unoptimized
        />
      </div>
    );

  const badge = (
    <span className="rounded bg-zinc-900/80 px-2 py-0.5 text-xs font-medium text-white dark:bg-zinc-100 dark:text-zinc-900">
      {SOURCE_LABELS[item.source]}
    </span>
  );

  const card = (
    <div className="group relative">
      {content}
      <div className="absolute right-2 top-2">{badge}</div>
      {item.title && (
        <div className="absolute bottom-0 left-0 right-0 p-3 opacity-0 transition group-hover:opacity-100">
          <span className="line-clamp-2 rounded bg-zinc-900/80 px-2 py-1 text-sm text-white dark:bg-zinc-100 dark:text-zinc-900">
            {item.title}
          </span>
        </div>
      )}
    </div>
  );

  if (item.link) {
    return (
      <Link
        href={item.link}
        className="block focus:outline-none focus:ring-2 focus:ring-zinc-400 dark:focus:ring-zinc-500"
      >
        {card}
      </Link>
    );
  }

  return card;
}

export function PhotographsGrid({ items }: { items: MediaItem[] }) {
  if (items.length === 0) {
    return (
      <p className="text-zinc-600 dark:text-zinc-400">
        No photos or videos yet. Add some in Blog, Music, or About.
      </p>
    );
  }

  return (
    <div className="grid grid-cols-2 gap-4 sm:gap-5 md:grid-cols-3 lg:grid-cols-4">
      {items.map((item) => (
        <MediaCard key={item.id} item={item} />
      ))}
    </div>
  );
}
