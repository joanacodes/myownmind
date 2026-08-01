"use client";

import { deleteItem } from "@/app/actions";
import { Thumb } from "./Thumb";
import type { Item } from "@/lib/types";

export function Card({ item, onOpen }: { item: Item; onOpen: () => void }) {
  const pending = item.status === "pending";

  return (
    <article className="rise group relative mb-4 break-inside-avoid overflow-hidden rounded-xl border border-hair bg-surface">
      <div className="absolute right-2 top-2 z-10 flex gap-1 opacity-0 transition-opacity focus-within:opacity-100 group-hover:opacity-100 max-sm:opacity-100">
        <a
          href={item.url ?? "#"}
          target="_blank"
          rel="noreferrer"
          onClick={(e) => e.stopPropagation()}
          aria-label="Open the original page"
          className="flex h-7 w-7 items-center justify-center rounded-full bg-ink/70 text-xs
                     text-white backdrop-blur hover:bg-ink"
        >
          ↗
        </a>
        <button
          onClick={(e) => { e.stopPropagation(); deleteItem(item.id); }}
          aria-label={`Remove ${item.title ?? "item"}`}
          className="h-7 w-7 rounded-full bg-ink/70 text-sm text-white backdrop-blur hover:bg-ink"
        >
          ×
        </button>
      </div>

      <button onClick={onOpen} className="block w-full cursor-pointer text-left">
        {item.image_url && <Thumb src={item.image_url} pending={pending} />}

        <div className="p-3 sm:p-3.5">
          <div className={`flex items-center gap-1.5 text-[11px] text-muted ${pending ? "breathe" : ""}`}>
            {item.favicon_url && (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={item.favicon_url} alt="" className="h-3.5 w-3.5 rounded-sm" />
            )}
            <span className="truncate">
              {pending ? "Reading the page…" : item.site_name}
            </span>
            {item.note && (
              <span
                title="Has a note"
                aria-label="Has a note"
                className="ml-auto h-1.5 w-1.5 shrink-0 rounded-full bg-accent"
              />
            )}
          </div>

          <h2 className="mt-1.5 line-clamp-3 text-sm font-medium leading-snug sm:text-[15px]">
            {item.title}
          </h2>

          {/* Description lives in the detail panel — keeping the grid scannable. */}

          {item.tags.length > 0 && (
            <ul className="mt-2 flex flex-wrap gap-1">
              {item.tags.slice(0, 3).map((t) => (
                <li key={t} className="rounded-md bg-page px-1.5 py-0.5 text-[11px] text-muted">
                  {t}
                </li>
              ))}
            </ul>
          )}

          {item.status === "failed" && (
            <p className="mt-2 text-[11px] text-muted">
              Could not read this page. The link still works.
            </p>
          )}
        </div>
      </button>
    </article>
  );
}
