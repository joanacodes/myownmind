"use client";

import { useEffect, useState } from "react";
import { updateItem } from "@/app/actions";
import { Thumb } from "./Thumb";
import type { Item } from "@/lib/types";

export function ItemDetail({ item, onClose }: { item: Item; onClose: () => void }) {
  const [note, setNote] = useState(item.note ?? "");
  const [tagText, setTagText] = useState(item.tags.join(", "));
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  async function save() {
    setSaving(true);
    setError(null);
    const tags = tagText
      .split(",")
      .map((t) => t.trim().toLowerCase())
      .filter(Boolean);

    const result = await updateItem(item.id, note, [...new Set(tags)]);
    setSaving(false);
    if (result.ok) onClose();
    else setError(result.message ?? "Could not save.");
  }

  return (
    <div
      onClick={onClose}
      className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto
                 bg-ink/40 p-4 backdrop-blur-sm sm:p-10"
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-label={item.title ?? "Saved item"}
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-xl overflow-hidden rounded-2xl border border-hair bg-surface"
      >
        {item.image_url && (
          <div className="max-h-64 overflow-hidden">
            <Thumb src={item.image_url} pending={item.status === "pending"} />
          </div>
        )}

        <div className="p-5">
          <div className="flex items-center gap-1.5 text-[11px] text-muted">
            {item.favicon_url && (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={item.favicon_url} alt="" className="h-3.5 w-3.5 rounded-sm" />
            )}
            <span>{item.site_name}</span>
          </div>

          <h2 className="mt-1.5 text-lg font-medium leading-snug">{item.title}</h2>

          {item.description && (
            <p className="mt-1.5 text-[13px] leading-relaxed text-muted">{item.description}</p>
          )}

          <a
            href={item.url ?? "#"}
            target="_blank"
            rel="noreferrer"
            className="mt-2 inline-block text-[13px] text-accent underline underline-offset-2"
          >
            Open the original page ↗
          </a>

          <label className="mt-5 block text-[11px] font-medium uppercase tracking-wide text-muted">
            Note
          </label>
          <textarea
            value={note}
            onChange={(e) => setNote(e.target.value)}
            rows={4}
            placeholder="Why did you keep this?"
            className="mt-1.5 w-full resize-y rounded-lg border border-hair bg-page px-3 py-2
                       text-sm leading-relaxed placeholder:text-muted"
          />

          <label className="mt-4 block text-[11px] font-medium uppercase tracking-wide text-muted">
            Tags
          </label>
          <input
            value={tagText}
            onChange={(e) => setTagText(e.target.value)}
            placeholder="typography, portfolio, inspiration"
            className="mt-1.5 w-full rounded-lg border border-hair bg-page px-3 py-2 text-sm
                       placeholder:text-muted"
          />
          <p className="mt-1 text-[11px] text-muted">Separate tags with commas.</p>

          {error && <p role="alert" className="mt-3 text-[13px] text-accent">{error}</p>}

          <div className="mt-5 flex justify-end gap-2">
            <button
              onClick={onClose}
              className="rounded-lg px-3 py-2 text-sm text-muted hover:text-ink"
            >
              Cancel
            </button>
            <button
              onClick={save}
              disabled={saving}
              className="rounded-lg bg-ink px-4 py-2 text-sm text-white hover:bg-accent
                         disabled:opacity-60"
            >
              {saving ? "Saving…" : "Save"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
