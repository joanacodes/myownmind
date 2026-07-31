"use client";

import { useState } from "react";
import { supabaseBrowser } from "@/lib/supabase/client";

export default function Login() {
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);

  async function send() {
    await supabaseBrowser().auth.signInWithOtp({
      email,
      options: { emailRedirectTo: `${location.origin}/auth/callback` },
    });
    setSent(true);
  }

  return (
    <main className="mx-auto flex min-h-screen max-w-sm flex-col justify-center px-6">
      <h1 className="font-serif text-3xl italic">mind</h1>
      {sent ? (
        <p className="mt-6 text-sm text-muted">
          Check {email} for a sign-in link.
        </p>
      ) : (
        <>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@example.com"
            className="mt-6 rounded-lg border border-hair bg-surface px-3 py-2 text-sm"
          />
          <button
            onClick={send}
            className="mt-3 rounded-lg bg-ink px-3 py-2 text-sm text-white hover:bg-accent"
          >
            Email me a link
          </button>
        </>
      )}
    </main>
  );
}
