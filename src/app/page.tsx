import { supabaseServer } from "@/lib/supabase/server";
import { SaveBar } from "@/components/SaveBar";
import { Card } from "@/components/Card";
import type { Item } from "@/lib/types";

export const dynamic = "force-dynamic";

export default async function Home({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const { q } = await searchParams;
  const db = await supabaseServer();

  let query = db
    .from("items")
    .select("*")
    .is("deleted_at", null)
    .order("created_at", { ascending: false })
    .limit(200);

  if (q) query = query.textSearch("fts", q, { type: "websearch", config: "simple" });

  const { data } = await query;
  const items = (data ?? []) as Item[];

  // Round-robin into columns. Cheap, dependency-free, and keeps the newest
  // items along the top row. Swap for `masonic` when you pass ~500 items.
  const cols = 4;
  const buckets: Item[][] = Array.from({ length: cols }, () => []);
  items.forEach((it, i) => buckets[i % cols].push(it));

  return (
    <>
      <SaveBar />
      <main className="mx-auto max-w-6xl px-5 py-6">
        {items.length === 0 ? (
          <p className="mt-32 text-center font-serif text-2xl italic text-muted">
            {q ? "Nothing matches that." : "Paste a link to begin."}
          </p>
        ) : (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {buckets.map((bucket, i) => (
              <div key={i}>
                {bucket.map((item) => <Card key={item.id} item={item} />)}
              </div>
            ))}
          </div>
        )}
      </main>
    </>
  );
}
