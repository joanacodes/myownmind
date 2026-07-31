"use server";

import { after } from "next/server";
import { revalidatePath } from "next/cache";
import { supabaseServer } from "@/lib/supabase/server";
import { canonicalize, enrichItem } from "@/lib/enrich";

export type SaveResult = { ok: boolean; message?: string };

export async function saveUrl(
  _prev: SaveResult | null,
  formData: FormData
): Promise<SaveResult> {
  const raw = String(formData.get("url") ?? "").trim();
  if (!raw) return { ok: false, message: "Enter a link first." };

  let url: string;
  try {
    url = canonicalize(raw.startsWith("http") ? raw : `https://${raw}`);
  } catch {
    return { ok: false, message: "That does not look like a link." };
  }

  const db = await supabaseServer();
  const { data: { user } } = await db.auth.getUser();
  if (!user) return { ok: false, message: "Session expired. Sign in again." };

  // The dedupe index is partial (`where deleted_at is null`), and Postgres
  // cannot infer a partial index as an ON CONFLICT target — so look the row
  // up explicitly instead of using upsert.
  const { data: existing, error: lookupError } = await db
    .from("items")
    .select("id")
    .eq("user_id", user.id)
    .eq("canonical_url", url)
    .is("deleted_at", null)
    .maybeSingle();

  if (lookupError) return { ok: false, message: lookupError.message };

  let id: string;

  if (existing) {
    id = existing.id;
    await db.from("items").update({ status: "pending", error: null }).eq("id", id);
  } else {
    const { data, error } = await db
      .from("items")
      .insert({
        user_id: user.id,
        url: raw,
        canonical_url: url,
        title: new URL(url).hostname,
        status: "pending",
      })
      .select("id")
      .single();

    if (error || !data) {
      return { ok: false, message: error?.message ?? "Could not save that link." };
    }
    id = data.id;
  }

  revalidatePath("/");
  after(async () => { await enrichItem(id, url); });
  return { ok: true };
}

export async function deleteItem(id: string) {
  const db = await supabaseServer();
  await db.from("items").update({ deleted_at: new Date().toISOString() }).eq("id", id);
  revalidatePath("/");
}
