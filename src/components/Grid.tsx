"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabaseBrowser } from "@/lib/supabase/client";
import { Card } from "./Card";
import { ItemDetail } from "./ItemDetail";
import type { Item } from "@/lib/types";

function columnsFor(width: number) {
  if (width >= 1024) return 4;
  if (width >= 640) return 3;
  return 2;
}

export function Grid({ items }: { items: Item[] }) {
  const [selectedId, setSelectedId] = useState<string | null>(null);
  // Items are dealt into columns in JS, so the count has to match what CSS
  // renders — otherwise mobile shows four stacked columns in shuffled order.
  const [cols, setCols] = useState(4);
  const router = useRouter();

  useEffect(() => {
    const measure = () => setCols(columnsFor(window.innerWidth));
    measure();
    window.addEventListener("resize", measure);
    return () => window.removeEventListener("resize", measure);
  }, []);

  // Enrichment finishes after the response was already sent, so the server
  // has no way to push it. Listening for the row update is what makes cards
  // fill in without a manual refresh.
  useEffect(() => {
    const db = supabaseBrowser();
    const channel = db
      .channel("items-feed")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "items" },
        () => router.refresh()
      )
      .subscribe();

    return () => { db.removeChannel(channel); };
  }, [router]);

  // Read the open item out of the live list rather than snapshotting it, so
  // the panel updates when enrichment lands while it is open.
  const selected = items.find((i) => i.id === selectedId) ?? null;

  const buckets: Item[][] = Array.from({ length: cols }, () => []);
  items.forEach((it, i) => buckets[i % cols].push(it));

  return (
    <>
      <div
        className="grid gap-3 sm:gap-4"
        style={{ gridTemplateColumns: `repeat(${cols}, minmax(0, 1fr))` }}
      >
        {buckets.map((bucket, i) => (
          <div key={i}>
            {bucket.map((item) => (
              <Card key={item.id} item={item} onOpen={() => setSelectedId(item.id)} />
            ))}
          </div>
        ))}
      </div>

      {selected && (
        <ItemDetail item={selected} onClose={() => setSelectedId(null)} />
      )}
    </>
  );
}
