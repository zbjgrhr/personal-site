export default function CVPage() {
  return (
    <article className="space-y-6">
      <h1 className="text-3xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-50">
        Curriculum Vitae
      </h1>
      <div className="min-h-[80vh] w-full overflow-hidden rounded-lg border border-zinc-200 bg-zinc-50 dark:border-zinc-800 dark:bg-zinc-900/50">
        <iframe
          src="/Huaxin_CV.pdf"
          title="Huaxin Zhang CV"
          className="h-[85vh] w-full min-h-[600px]"
        />
      </div>
      <p className="text-sm text-zinc-500 dark:text-zinc-500">
        Can&apos;t view the PDF?{" "}
        <a
          href="/Huaxin_CV.pdf"
          target="_blank"
          rel="noopener noreferrer"
          className="text-zinc-700 underline hover:no-underline dark:text-zinc-300"
        >
          Open in new tab
        </a>
      </p>
    </article>
  );
}
