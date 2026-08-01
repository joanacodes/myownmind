"use client";

import { useState } from "react";

export function Palette({
  colors,
  limit,
  size = "sm",
}: {
  colors: string[];
  limit: number;
  size?: "sm" | "lg";
}) {
  const [copied, setCopied] = useState<string | null>(null);
  if (!colors.length) return null;

  const shown = colors.slice(0, limit);

  if (size === "sm") {
    // A single continuous bar reads as one object rather than five dots.
    return (
      <div className="mt-2 flex h-1.5 overflow-hidden rounded-full" aria-hidden="true">
        {shown.map((c, i) => (
          <div key={`${c}-${i}`} className="flex-1" style={{ background: c }} />
        ))}
      </div>
    );
  }

  return (
    <ul className="mt-2 grid grid-cols-4 gap-1.5 sm:grid-cols-6">
      {shown.map((c, i) => (
        <li key={`${c}-${i}`}>
          <button
            onClick={() => {
              navigator.clipboard?.writeText(c);
              setCopied(c);
              setTimeout(() => setCopied(null), 1200);
            }}
            className="w-full rounded-lg border border-hair p-1 text-left hover:border-ink"
            title={`Copy ${c}`}
          >
            <span className="block h-8 w-full rounded" style={{ background: c }} />
            <span className="mt-1 block truncate text-[10px] text-muted">
              {copied === c ? "copied" : c}
            </span>
          </button>
        </li>
      ))}
    </ul>
  );
}
