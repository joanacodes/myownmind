"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { getPalette } from "colorthief";
import { saveColors } from "@/app/actions";
import { isPlaceholderPalette } from "@/lib/palette";

/**
 * mShots answers the first request for a URL with a grey placeholder while it
 * generates the real screenshot, so there is no error to listen for. Instead:
 * hold a shimmer until the image decodes, and quietly re-request a few times
 * on a backoff so the placeholder gets replaced once the real shot is ready.
 *
 * Once decoded, extract a palette if the item has none. The image is served
 * from our own proxy, which is what makes the canvas readable at all.
 */
export function Thumb({
  src,
  pending,
  itemId,
  hasColors,
}: {
  src: string;
  pending: boolean;
  itemId?: string;
  hasColors?: boolean;
}) {
  const [loaded, setLoaded] = useState(false);
  const [failed, setFailed] = useState(false);
  const [attempt, setAttempt] = useState(0);
  const img = useRef<HTMLImageElement>(null);
  const extracted = useRef(false);

  const isShot = src.includes("mshots");

  const extract = useCallback(async () => {
    if (!itemId || hasColors || extracted.current || !img.current) return;
    try {
      const palette = await getPalette(img.current, { colorCount: 12 });
      if (!palette?.length) return;

      const hexes = palette.map((c) => c.hex());
      // A grey placeholder is not a palette. Leave `extracted` unset so the
      // next retry, once the real screenshot lands, tries again.
      if (isPlaceholderPalette(hexes)) return;

      extracted.current = true;
      await saveColors(itemId, hexes);
    } catch {
      // Tainted canvas or a decode failure — colours are a bonus, not a
      // reason to break the card.
    }
  }, [itemId, hasColors]);

  const onReady = useCallback(() => {
    if (!img.current || img.current.naturalWidth === 0) return;
    setLoaded(true);
    extract();
  }, [extract]);

  // Cached images can finish decoding before React attaches onLoad.
  useEffect(() => {
    if (img.current?.complete) onReady();
  }, [onReady]);

  // Keep re-requesting while the shot is still generating. `pending` covers
  // enrichment; `!hasColors && !extracted` covers a screenshot that arrived
  // as a placeholder and has not yielded real colours yet.
  const wantsRetry = pending || (!hasColors && !extracted.current);

  useEffect(() => {
    if (!isShot || !wantsRetry || attempt >= 4) return;
    const t = setTimeout(() => {
      setAttempt((n) => n + 1);
      setLoaded(false);
    }, 5000 * (attempt + 1));
    return () => clearTimeout(t);
  }, [isShot, wantsRetry, attempt]);

  if (failed) return null;

  return (
    <div className="relative overflow-hidden bg-page">
      {!loaded && <div className="shimmer aspect-[16/10] w-full" aria-hidden="true" />}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        ref={img}
        src={attempt ? `${src}&r=${attempt}` : src}
        alt=""
        loading="lazy"
        onLoad={onReady}
        onError={() => setFailed(true)}
        className={`w-full object-cover transition-opacity duration-500 ${
          loaded ? "opacity-100" : "absolute inset-0 opacity-0"
        }`}
      />
    </div>
  );
}
