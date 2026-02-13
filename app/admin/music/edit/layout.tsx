import { Suspense } from "react";

export default function EditMusicLayout({
  children,
}: { children: React.ReactNode }) {
  return (
    <Suspense fallback={<div className="text-zinc-600 dark:text-zinc-400">Loading…</div>}>
      {children}
    </Suspense>
  );
}
