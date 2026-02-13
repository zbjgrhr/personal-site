"use client";

import { useRef, useCallback, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";

export type BlogPostSummary = {
  id: string;
  slug: string;
  title: string;
  content: string;
  imageUrls: string[];
  createdAt: string;
};

export type MusicPostSummary = {
  id: string;
  slug: string;
  title: string;
  content: string;
  imageUrls: string[];
  videoUrls: string[];
  createdAt: string;
};

type Props = {
  aboutPhotoUrl: string | null;
  blogPosts: BlogPostSummary[];
  musicPosts: MusicPostSummary[];
};

function formatDate(iso: string): string {
  try {
    return new Date(iso).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  } catch {
    return iso;
  }
}

export function HomeSections({
  aboutPhotoUrl,
  blogPosts,
  musicPosts,
}: Props) {
  const sectionRefs = useRef<(HTMLElement | null)[]>([]);
  const currentIndexRef = useRef(0);
  const tickingRef = useRef(false);

  const scrollToIndex = useCallback((index: number) => {
    const el = sectionRefs.current[index];
    if (el) {
      el.scrollIntoView({ behavior: "smooth", block: "start" });
      currentIndexRef.current = index;
    }
  }, []);

  const handleWheel = useCallback(
    (e: React.WheelEvent) => {
      if (e.deltaY === 0) return;
      if (tickingRef.current) {
        e.preventDefault();
        return;
      }
      tickingRef.current = true;
      e.preventDefault();
      const next =
        e.deltaY > 0
          ? Math.min(currentIndexRef.current + 1, 3)
          : Math.max(currentIndexRef.current - 1, 0);
      scrollToIndex(next);
      setTimeout(() => {
        tickingRef.current = false;
      }, 600);
    },
    [scrollToIndex]
  );

  const setRef = useCallback((index: number, el: HTMLElement | null) => {
    sectionRefs.current[index] = el;
  }, []);

  const containerRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const container = containerRef.current?.parentElement;
    if (!container) return;
    const onScroll = () => {
      const refs = sectionRefs.current;
      const containerTop = container.scrollTop;
      const containerMid = containerTop + container.clientHeight / 2;
      for (let i = refs.length - 1; i >= 0; i--) {
        const el = refs[i];
        if (el && el.offsetTop <= containerMid) {
          currentIndexRef.current = i;
          break;
        }
      }
    };
    container.addEventListener("scroll", onScroll, { passive: true });
    return () => container.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <div ref={containerRef} onWheel={handleWheel} className="relative">
      {/* About me */}
      <section
        ref={(el) => setRef(0, el)}
        className="flex min-h-screen snap-start flex-col justify-center py-12"
      >
        <article className="flex flex-col space-y-8">
          <h1 className="text-4xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-50 md:text-5xl">
            About me
          </h1>
          {aboutPhotoUrl && (
            <div className="relative aspect-[4/3] w-full max-w-md overflow-hidden rounded-lg bg-zinc-100 dark:bg-zinc-800">
              <Image
                src={aboutPhotoUrl}
                alt="HuaXin Zhang"
                fill
                className="object-cover"
                sizes="(max-width: 768px) 100vw, 28rem"
                unoptimized
              />
            </div>
          )}
          <p className="max-w-prose text-lg leading-relaxed text-zinc-700 dark:text-zinc-300">
            I’m HuaXin Zhang. I work on projects and experiments across AI,
            interactive systems, games, and translation tools, and I’m currently
            based in China.
          </p>
          <p className="max-w-prose text-lg leading-relaxed text-zinc-700 dark:text-zinc-300">
            This space brings together the things I’ve built, experiments still
            in progress, and fragments of everyday life.
          </p>
          <Link
            href="/about"
            className="text-zinc-600 underline hover:no-underline dark:text-zinc-400"
          >
            Read more →
          </Link>
        </article>
      </section>

      {/* Works */}
      <section
        ref={(el) => setRef(1, el)}
        className="flex min-h-screen snap-start flex-col justify-center py-12"
      >
        <article className="space-y-6">
          <h1 className="text-3xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-50">
            Works
          </h1>
          <p className="text-lg leading-relaxed text-zinc-700 dark:text-zinc-300">
            This page will collect selected projects, experiments, and
            collaborations.
          </p>
          <p className="text-lg leading-relaxed text-zinc-700 dark:text-zinc-300">
            You can later replace this text with a list of works, case studies,
            or anything else you want to highlight.
          </p>
          <Link
            href="/work"
            className="text-zinc-600 underline hover:no-underline dark:text-zinc-400"
          >
            View Works →
          </Link>
        </article>
      </section>

      {/* Blog */}
      <section
        ref={(el) => setRef(2, el)}
        className="flex min-h-screen snap-start flex-col justify-center py-12"
      >
        <div className="space-y-6">
          <div className="flex items-center justify-between gap-4">
            <h1 className="text-3xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-50">
              Blog
            </h1>
            <Link
              href="/blog"
              className="text-zinc-600 underline hover:no-underline dark:text-zinc-400"
            >
              All posts →
            </Link>
          </div>
          {blogPosts.length === 0 ? (
            <p className="text-zinc-600 dark:text-zinc-400">No posts yet.</p>
          ) : (
            <ul className="space-y-4">
              {blogPosts.slice(0, 5).map((post) => (
                <li key={post.id}>
                  <Link
                    href={`/blog/${post.slug}`}
                    className="group block overflow-hidden rounded-lg border border-zinc-200 bg-white transition hover:border-zinc-300 dark:border-zinc-800 dark:bg-zinc-900/50 dark:hover:border-zinc-700"
                  >
                    {post.imageUrls[0] && (
                      <div className="relative aspect-video w-full overflow-hidden bg-zinc-100 dark:bg-zinc-800">
                        <Image
                          src={post.imageUrls[0]}
                          alt=""
                          fill
                          className="object-cover transition group-hover:scale-[1.02]"
                          sizes="(max-width: 768px) 100vw, 42rem"
                          unoptimized
                        />
                      </div>
                    )}
                    <div className="p-4">
                      <h2 className="font-semibold text-zinc-900 group-hover:underline dark:text-zinc-50">
                        {post.title}
                      </h2>
                      <p className="mt-1 line-clamp-2 text-sm text-zinc-600 dark:text-zinc-400">
                        {post.content.slice(0, 160)}
                        {post.content.length > 160 ? "…" : ""}
                      </p>
                      <time
                        dateTime={post.createdAt}
                        className="mt-2 block text-xs text-zinc-500 dark:text-zinc-500"
                      >
                        {formatDate(post.createdAt)}
                      </time>
                    </div>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </div>
      </section>

      {/* Music */}
      <section
        ref={(el) => setRef(3, el)}
        className="flex min-h-screen snap-start flex-col justify-center py-12"
      >
        <div className="space-y-6">
          <div className="flex items-center justify-between gap-4">
            <h1 className="text-3xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-50">
              Music
            </h1>
            <Link
              href="/music"
              className="text-zinc-600 underline hover:no-underline dark:text-zinc-400"
            >
              All posts →
            </Link>
          </div>
          <p className="text-lg leading-relaxed text-zinc-700 dark:text-zinc-300">
            A place for playlists, tracks you love, or anything you&apos;re
            listening to on repeat.
          </p>
          {musicPosts.length === 0 ? (
            <p className="text-zinc-600 dark:text-zinc-400">No posts yet.</p>
          ) : (
            <ul className="space-y-4">
              {musicPosts.slice(0, 5).map((post) => (
                <li key={post.id}>
                  <Link
                    href={`/music/${post.slug}`}
                    className="group block overflow-hidden rounded-lg border border-zinc-200 bg-white transition hover:border-zinc-300 dark:border-zinc-800 dark:bg-zinc-900/50 dark:hover:border-zinc-700"
                  >
                    {(post.imageUrls[0] || post.videoUrls[0]) && (
                      <div className="relative aspect-video w-full overflow-hidden bg-zinc-100 dark:bg-zinc-800">
                        {post.imageUrls[0] ? (
                          <Image
                            src={post.imageUrls[0]}
                            alt=""
                            fill
                            className="object-cover transition group-hover:scale-[1.02]"
                            sizes="(max-width: 768px) 100vw, 42rem"
                            unoptimized
                          />
                        ) : (
                          <video
                            src={post.videoUrls[0]}
                            className="h-full w-full object-cover transition group-hover:scale-[1.02]"
                            muted
                            preload="metadata"
                            playsInline
                          />
                        )}
                      </div>
                    )}
                    <div className="p-4">
                      <h2 className="font-semibold text-zinc-900 group-hover:underline dark:text-zinc-50">
                        {post.title}
                      </h2>
                      <p className="mt-1 line-clamp-2 text-sm text-zinc-600 dark:text-zinc-400">
                        {post.content.slice(0, 160)}
                        {post.content.length > 160 ? "…" : ""}
                      </p>
                      <time
                        dateTime={post.createdAt}
                        className="mt-2 block text-xs text-zinc-500 dark:text-zinc-500"
                      >
                        {formatDate(post.createdAt)}
                      </time>
                    </div>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </div>
      </section>
    </div>
  );
}
