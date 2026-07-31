"use client";

import { deleteItem } from "@/app/actions";
import type { Item } from "@/lib/types";

export function Card({ item }: { item: Item }) {
  const pending = item.status === "pending";

  return (
    <article className="rise group relative mb-4 break-inside-avoid overflow-hidden rounded-xl border border-hair bg-surface">
      <button
        onClick={() => deleteItem(item.id)}
        aria-label={`Remove ${item.title ?? "item"}`}
        className="absolute right-2 top-2 z-10 hidden h-7 w-7 rounded-full bg-ink/70 text-sm
                   text-white backdrop-blur group-hover:block hover:bg-ink"
      >
        ×
      </button>

      {item.image_url && (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={item.image_url}
          alt=""
          loading="lazy"
          className="w-full object-cover"
          onError={(e) => { e.currentTarget.style.display = "none"; }}
        />
      )}

      <a
        href={item.url ?? "#"}
        target="_blank"
        rel="noreferrer"
        className="block p-3.5"
      >
        <div className={`flex items-center gap-1.5 text-[11px] text-muted ${pending ? "breathe" : ""}`}>
          {item.favicon_url && (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={item.favicon_url} alt="" className="h-3.5 w-3.5 rounded-sm" />
          )}
          <span className="truncate">
            {pending ? "Reading the page…" : item.site_name}
          </span>
        </div>

        <h2 className="mt-1.5 text-[15px] font-medium leading-snug">
          {item.title}
        </h2>

        {item.description && (
          <p className="mt-1 line-clamp-3 text-[13px] leading-relaxed text-muted">
            {item.description}
          </p>
        )}

        {item.tags.length > 0 && (
          <ul className="mt-2.5 flex flex-wrap gap-1">
            {item.tags.map((t) => (
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
      </a>
    </article>
  );
}
