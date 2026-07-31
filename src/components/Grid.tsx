"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabaseBrowser } from "@/lib/supabase/client";
import { Card } from "./Card";
import { ItemDetail } from "./ItemDetail";
import type { Item } from "@/lib/types";

export function Grid({ items }: { items: Item[] }) {
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const router = useRouter();

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

  const cols = 4;
  const buckets: Item[][] = Array.from({ length: cols }, () => []);
  items.forEach((it, i) => buckets[i % cols].push(it));

  return (
    <>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
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
