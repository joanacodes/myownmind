"use server";

import { after } from "next/server";
import { revalidatePath } from "next/cache";
import { supabaseServer } from "@/lib/supabase/server";
import { createClient } from "@supabase/supabase-js";
import { canonicalize, enrichItem, previewUrl } from "@/lib/enrich";

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
    const host = new URL(url).hostname;
    const { data, error } = await db
      .from("items")
      .insert({
        user_id: user.id,
        url: raw,
        canonical_url: url,
        title: host,
        site_name: host,
        favicon_url: `https://www.google.com/s2/favicons?domain=${host}&sz=64`,
        image_url: previewUrl(url),
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
  // Realtime pushes the finished row to the browser; no refresh needed.
  after(async () => { await enrichItem(id, url); });
  return { ok: true };
}

export async function updateItem(
  id: string,
  note: string,
  tags: string[]
): Promise<SaveResult> {
  const db = await supabaseServer();
  const { error } = await db
    .from("items")
    .update({ note: note.trim() || null, tags })
    .eq("id", id);

  if (error) return { ok: false, message: error.message };
  revalidatePath("/");
  return { ok: true };
}

export async function deleteItem(id: string) {
  const db = await supabaseServer();
  await db.from("items").update({ deleted_at: new Date().toISOString() }).eq("id", id);
  revalidatePath("/");
}

/**
 * Creates an account behind a shared invite code. Uses the admin API, so
 * Supabase's "allow new users to sign up" can stay off — this action is the
 * only way in. `email_confirm: true` skips the confirmation email, which
 * matters because the built-in mailer allows only two messages an hour.
 */
export async function signUpWithCode(
  _prev: SaveResult | null,
  formData: FormData
): Promise<SaveResult> {
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  const password = String(formData.get("password") ?? "");
  const code = String(formData.get("code") ?? "").trim();

  if (!email || !password) return { ok: false, message: "Email and password are required." };
  if (password.length < 8) return { ok: false, message: "Use at least 8 characters." };

  // Closed by default: a missing secret must never mean "let anyone in".
  const expected = process.env.SIGNUP_CODE;
  if (!expected) return { ok: false, message: "Sign-ups are closed." };
  if (code !== expected) return { ok: false, message: "That invite code is not right." };

  const admin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false } }
  );

  const { error } = await admin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
  });

  if (error) {
    const taken = /already|exists|registered/i.test(error.message);
    return { ok: false, message: taken ? "That email already has an account." : error.message };
  }
  return { ok: true };
}

/**
 * Signing in on the server means the cookie arrives as a Set-Cookie header
 * rather than being written by JavaScript. iOS treats script-written cookies
 * as disposable in home-screen apps and clears them when the app is killed;
 * server-set ones survive.
 */
export async function signIn(
  _prev: SaveResult | null,
  formData: FormData
): Promise<SaveResult> {
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  const password = String(formData.get("password") ?? "");

  if (!email || !password) return { ok: false, message: "Enter your email and password." };

  const db = await supabaseServer();
  const { error } = await db.auth.signInWithPassword({ email, password });

  if (error) {
    return {
      ok: false,
      message:
        error.message === "Invalid login credentials"
          ? "That email and password do not match."
          : error.message,
    };
  }
  return { ok: true };
}

export async function signOut() {
  const db = await supabaseServer();
  await db.auth.signOut();
}
