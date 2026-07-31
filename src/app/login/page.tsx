"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { supabaseBrowser } from "@/lib/supabase/client";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [sent, setSent] = useState(false);
  const [busy, setBusy] = useState(false);
  const router = useRouter();

  async function signIn(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);

    const { error } = await supabaseBrowser().auth.signInWithPassword({
      email: email.trim(),
      password,
    });

    setBusy(false);
    if (error) {
      setError(
        error.message === "Invalid login credentials"
          ? "That email and password do not match. If you have never set a password, use the link below."
          : error.message
      );
      return;
    }
    router.push("/");
    router.refresh();
  }

  async function sendReset() {
    if (!email.trim()) {
      setError("Enter your email first.");
      return;
    }
    setBusy(true);
    setError(null);

    const { error } = await supabaseBrowser().auth.resetPasswordForEmail(email.trim(), {
      redirectTo: `${location.origin}/auth/callback?next=/account`,
    });

    setBusy(false);
    if (error) setError(error.message);
    else setSent(true);
  }

  const field =
    "w-full rounded-lg border border-hair bg-surface px-3 py-2 text-sm placeholder:text-muted";

  return (
    <main className="mx-auto flex min-h-screen max-w-sm flex-col justify-center px-6">
      <h1 className="font-serif text-3xl italic">mind</h1>

      {sent ? (
        <p className="mt-6 text-sm leading-relaxed text-muted">
          Check {email} for a link. Opening it lets you choose a password.
        </p>
      ) : (
        <form onSubmit={signIn} className="mt-6 flex flex-col gap-3">
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@example.com"
            autoComplete="username"
            className={field}
          />
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Password"
            autoComplete="current-password"
            className={field}
          />

          {error && (
            <p role="alert" className="text-[13px] leading-relaxed text-accent">
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={busy}
            className="rounded-lg bg-ink px-3 py-2 text-sm text-white hover:bg-accent
                       disabled:opacity-60"
          >
            {busy ? "…" : "Sign in"}
          </button>

          <button
            type="button"
            onClick={sendReset}
            disabled={busy}
            className="text-[13px] text-muted underline underline-offset-2 hover:text-ink"
          >
            Set or reset your password by email
          </button>
        </form>
      )}
    </main>
  );
}
