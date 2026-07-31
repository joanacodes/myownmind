import { supabaseServer } from "@/lib/supabase/server";
import { SaveBar } from "@/components/SaveBar";
import { Grid } from "@/components/Grid";
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

  const { data, error } = await query;
  const items = (data ?? []) as Item[];

  return (
    <>
      <SaveBar />
      <main className="mx-auto max-w-6xl px-5 py-6">
        {error ? (
          <p role="alert" className="mt-32 text-center text-sm text-accent">
            {error.message}
          </p>
        ) : items.length === 0 ? (
          <p className="mt-32 text-center font-serif text-2xl italic text-muted">
            {q ? "Nothing matches that." : "Paste a link to begin."}
          </p>
        ) : (
          <Grid items={items} />
        )}
      </main>
    </>
  );
}
