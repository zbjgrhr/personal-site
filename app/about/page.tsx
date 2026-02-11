import Image from "next/image";
import Link from "next/link";
import { isAdmin } from "@/lib/auth";
import { kv } from "@vercel/kv";

async function getPhotoUrl(): Promise<string | null> {
  try {
    const url = await kv.get<string>("about:photo_url");
    return url ?? null;
  } catch {
    return null;
  }
}

export default async function AboutPage() {
  const photoUrl = await getPhotoUrl();
  const admin = await isAdmin();

  return (
    <article className="flex flex-col space-y-12 pb-16">
      <header className="space-y-8">
        <h1 className="text-4xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-50 md:text-5xl">
          About me
        </h1>
        {photoUrl && (
          <div className="relative aspect-[4/3] w-full max-w-md overflow-hidden rounded-lg bg-zinc-100 dark:bg-zinc-800">
            <Image
              src={photoUrl}
              alt="HuaXin Zhang"
              fill
              className="object-cover"
              sizes="(max-width: 768px) 100vw, 28rem"
              unoptimized
            />
          </div>
        )}
      </header>

      <section className="space-y-4">
        <h2 className="text-xl font-medium text-zinc-900 dark:text-zinc-50">
          Work & interests
        </h2>
        <p className="max-w-prose text-lg leading-relaxed text-zinc-700 dark:text-zinc-300">
          I’m HuaXin Zhang. I work on projects and experiments across AI,
          interactive systems, games, and translation tools, and I’m currently
          based in China. At the core, I’m interested in one thing: how ideas are
          built into real systems and eventually become experiences people can
          interact with.
        </p>
        <p className="max-w-prose text-lg leading-relaxed text-zinc-700 dark:text-zinc-300">
          Recently, I’ve been developing Pixel Seed — an AI-driven game project
          that turns text into playable worlds — and DingDing!, a web chatbot
          designed to help people communicate better, build relationships, and
          navigate complex social situations.
        </p>
      </section>

      <section className="space-y-4">
        <h2 className="text-xl font-medium text-zinc-900 dark:text-zinc-50">
          Background
        </h2>
        <p className="max-w-prose text-lg leading-relaxed text-zinc-700 dark:text-zinc-300">
          I hold an MSc in Artificial Intelligence and Computer Science from
          the University of Birmingham. My work and creative practice revolve
          around AI systems, web interaction, game experiences, and generative
          content.
        </p>
      </section>

      <section className="space-y-4">
        <h2 className="text-xl font-medium text-zinc-900 dark:text-zinc-50">
          Beyond coding
        </h2>
        <p className="max-w-prose text-lg leading-relaxed text-zinc-700 dark:text-zinc-300">
          Outside of coding, I play games, go to parties, and capture ideas.
          Sometimes I hike, explore outfits, sing, and listen to music.
        </p>
        <p className="max-w-prose text-lg leading-relaxed text-zinc-700 dark:text-zinc-300">
          This space brings together the things I’ve built, experiments still in
          progress, and fragments of everyday life.
        </p>
      </section>

      <section className="space-y-4 border-t border-zinc-200 pt-8 dark:border-zinc-800">
        <h2 className="text-xl font-medium text-zinc-900 dark:text-zinc-50">
          Contact
        </h2>
        <p className="whitespace-pre-line text-base leading-relaxed text-zinc-600 dark:text-zinc-400">
          Gmail: zbjgrhr@gmail.com
          {"\n"}
          LinkedIn:{" "}
          <a
            href="https://www.linkedin.com/in/huaxin-zhang-91697b3ab"
            target="_blank"
            rel="noopener noreferrer"
            className="text-zinc-900 underline hover:no-underline dark:text-zinc-50"
          >
            https://www.linkedin.com/in/huaxin-zhang-91697b3ab
          </a>
          {"\n"}
          GitHub:{" "}
          <a
            href="https://github.com/zbjgrhr"
            target="_blank"
            rel="noopener noreferrer"
            className="text-zinc-900 underline hover:no-underline dark:text-zinc-50"
          >
            https://github.com/zbjgrhr
          </a>
          {"\n"}
          Instagram: wdmywtfwdmwdllmheihei
          {"\n"}
          WeChat: louiyuelaiyuehao
          {"\n"}
          RedBook: 945417255
        </p>
      </section>

      {admin && (
        <p className="text-sm text-zinc-500 dark:text-zinc-400">
          <Link
            href="/admin/about"
            className="underline hover:no-underline"
          >
            Edit profile photo
          </Link>
        </p>
      )}
    </article>
  );
}
