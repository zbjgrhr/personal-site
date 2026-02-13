"use client";

import { useRef, useState } from "react";
import Image from "next/image";

type Props =
  | { type: "video"; url: string }
  | { type: "image"; url: string };

export function HoverPlayMedia(props: Props) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [imageLoaded, setImageLoaded] = useState(false);

  if (props.type === "video") {
    return (
      <div
        className="relative aspect-video w-full overflow-hidden rounded-lg bg-zinc-100 dark:bg-zinc-800"
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
          src={props.url}
          className="h-full w-full object-cover"
          muted
          loop
          playsInline
          preload="metadata"
        />
      </div>
    );
  }

  // Image: load and show on hover, hide (stop) on leave so GIFs stop when cursor leaves
  return (
    <div
      className="relative aspect-video w-full overflow-hidden rounded-lg bg-zinc-100 dark:bg-zinc-800"
      onMouseEnter={() => setImageLoaded(true)}
      onMouseLeave={() => setImageLoaded(false)}
    >
      {imageLoaded ? (
        <Image
          src={props.url}
          alt=""
          fill
          className="object-cover"
          sizes="(max-width: 768px) 100vw, 42rem"
          unoptimized
        />
      ) : (
        <div className="flex h-full w-full items-center justify-center text-sm text-zinc-500 dark:text-zinc-500">
          Hover to load
        </div>
      )}
    </div>
  );
}
