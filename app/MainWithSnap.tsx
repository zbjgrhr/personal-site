"use client";

import { usePathname } from "next/navigation";

export default function MainWithSnap({
  children,
}: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isHome = pathname === "/";

  return (
    <main
      className={
        isHome
          ? "mx-auto max-w-3xl px-4 h-screen overflow-y-auto snap-y snap-mandatory"
          : "mx-auto max-w-3xl px-4 py-8"
      }
    >
      {children}
    </main>
  );
}
