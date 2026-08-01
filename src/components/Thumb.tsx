"use client";

import { useEffect, useRef, useState } from "react";

/**
 * mShots answers the first request for a URL with a grey placeholder while it
 * generates the real screenshot, so there is no error to listen for. Instead:
 * hold a shimmer until the image decodes, and quietly re-request a few times
 * on a backoff so the placeholder gets replaced once the real shot is ready.
 */
export function Thumb({ src, pending }: { src: string; pending: boolean }) {
  const [loaded, setLoaded] = useState(false);
  const [failed, setFailed] = useState(false);
  const [attempt, setAttempt] = useState(0);
  const img = useRef<HTMLImageElement>(null);

  const isShot = src.includes("mshots");

  // Cached images can finish decoding before React attaches onLoad.
  useEffect(() => {
    if (img.current?.complete && img.current.naturalWidth > 0) setLoaded(true);
  }, []);

  useEffect(() => {
    if (!isShot || !pending || attempt >= 3) return;
    const t = setTimeout(() => setAttempt((n) => n + 1), 4000 * (attempt + 1));
    return () => clearTimeout(t);
  }, [isShot, pending, attempt]);

  if (failed) return null;

  return (
    <div className="relative overflow-hidden bg-page">
      {!loaded && (
        <div className="shimmer aspect-[16/10] w-full" aria-hidden="true" />
      )}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        ref={img}
        src={attempt ? `${src}&r=${attempt}` : src}
        alt=""
        loading="lazy"
        onLoad={(e) => {
          // A zero-width decode means a broken image, not a real one.
          if (e.currentTarget.naturalWidth > 0) setLoaded(true);
        }}
        onError={() => setFailed(true)}
        className={`w-full object-cover transition-opacity duration-500 ${
          loaded ? "opacity-100" : "absolute inset-0 opacity-0"
        }`}
      />
    </div>
  );
}
