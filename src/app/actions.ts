"use server";

import { after } from "next/server";
import { revalidatePath } from "next/cache";
import { supabaseServer } from "@/lib/supabase/server";
import { canonicalize, enrichItem } from "@/lib/enrich";

export async function saveUrl(formData: FormData) {
  const raw = String(formData.get("url") ?? "").trim();
  if (!raw) return;

  let url: string;
  try {
    url = canonicalize(raw.startsWith("http") ? raw : `https://${raw}`);
  } catch {
    return;
  }

  const db = await supabaseServer();
  const { data: { user } } = await db.auth.getUser();
  if (!user) return;

  // Insert immediately so the card shows up before we know anything about it.
  const { data, error } = await db
    .from("items")
    .upsert(
      {
        user_id: user.id,
        url: raw,
        canonical_url: url,
        title: new URL(url).hostname,
        status: "pending",
      },
      { onConflict: "user_id,canonical_url" }
    )
    .select("id")
    .single();

  if (error || !data) return;
  revalidatePath("/");

  // Response is already on its way to the browser at this point.
  after(async () => { await enrichItem(data.id, url); });
}

export async function deleteItem(id: string) {
  const db = await supabaseServer();
  await db.from("items").update({ deleted_at: new Date().toISOString() }).eq("id", id);
  revalidatePath("/");
}
