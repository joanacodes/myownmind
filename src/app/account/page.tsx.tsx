"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { supabaseBrowser } from "@/lib/supabase/client";

export default function Account() {
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);
  const [busy, setBusy] = useState(false);
  const router = useRouter();

  async function save(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (password.length < 8) {
      setError("Use at least 8 characters.");
      return;
    }
    if (password !== confirm) {
      setError("The two passwords do not match.");
      return;
    }

    setBusy(true);
    const { error } = await supabaseBrowser().auth.updateUser({ password });
    setBusy(false);

    if (error) setError(error.message);
    else {
      setDone(true);
      setPassword("");
      setConfirm("");
    }
  }

  const field =
    "w-full rounded-lg border border-hair bg-surface px-3 py-2 text-sm placeholder:text-muted";

  return (
    <main className="mx-auto max-w-sm px-6 py-10">
      <button
        onClick={() => router.push("/")}
        className="text-[13px] text-muted hover:text-ink"
      >
        ← Back
      </button>

      <h1 className="mt-6 font-serif text-2xl italic">Your password</h1>
      <p className="mt-1.5 text-[13px] leading-relaxed text-muted">
        Set one and you can sign in without waiting for an email.
      </p>

      <form onSubmit={save} className="mt-6 flex flex-col gap-3">
        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="New password"
          autoComplete="new-password"
          className={field}
        />
        <input
          type="password"
          value={confirm}
          onChange={(e) => setConfirm(e.target.value)}
          placeholder="Repeat it"
          autoComplete="new-password"
          className={field}
        />

        {error && (
          <p role="alert" className="text-[13px] leading-relaxed text-accent">
            {error}
          </p>
        )}
        {done && <p className="text-[13px] text-muted">Password saved.</p>}

        <button
          type="submit"
          disabled={busy}
          className="rounded-lg bg-ink px-3 py-2 text-sm text-white hover:bg-accent
                     disabled:opacity-60"
        >
          {busy ? "…" : "Save password"}
        </button>
      </form>
    </main>
  );
}
