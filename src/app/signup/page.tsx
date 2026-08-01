"use client";

import { useActionState, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { signUpWithCode, signIn, type SaveResult } from "@/app/actions";
import { supabaseBrowser } from "@/lib/supabase/client";

export default function SignUp() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [signingIn, setSigningIn] = useState(false);
  const router = useRouter();

  const [result, formAction, pending] = useActionState<SaveResult | null, FormData>(
    signUpWithCode,
    null
  );

  // The account exists but the browser has no session yet, so sign in with
  // the credentials already on screen rather than asking for them twice.
  useEffect(() => {
    if (!result?.ok) return;
    setSigningIn(true);
    const fd = new FormData();
    fd.set("email", email.trim().toLowerCase());
    fd.set("password", password);
    signIn(null, fd).then(async (r) => {
      if (!r.ok) {
        router.push("/login");
        return;
      }
      const { data } = await supabaseBrowser().auth.getSession();
      if (data.session) {
        localStorage.setItem("mind.refresh_token", data.session.refresh_token);
      }
      router.push("/");
      router.refresh();
    });
  }, [result, email, password, router]);

  const field =
    "w-full rounded-lg border border-hair bg-surface px-3 py-2 text-sm placeholder:text-muted";

  return (
    <main className="mx-auto flex min-h-screen max-w-sm flex-col justify-center px-6">
      <h1 className="font-serif text-3xl italic">mind</h1>
      <p className="mt-1.5 text-[13px] text-muted">Create an account.</p>

      <form action={formAction} className="mt-6 flex flex-col gap-3">
        <input
          name="email"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="you@example.com"
          autoComplete="username"
          className={field}
        />
        <input
          name="password"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="Password, at least 8 characters"
          autoComplete="new-password"
          className={field}
        />
        <input
          name="code"
          type="text"
          placeholder="Invite code"
          autoComplete="off"
          className={field}
        />

        {result && !result.ok && (
          <p role="alert" className="text-[13px] leading-relaxed text-accent">
            {result.message}
          </p>
        )}

        <button
          type="submit"
          disabled={pending || signingIn}
          className="rounded-lg bg-ink px-3 py-2 text-sm text-white hover:bg-accent
                     disabled:opacity-60"
        >
          {pending || signingIn ? "…" : "Create account"}
        </button>

        <button
          type="button"
          onClick={() => router.push("/login")}
          className="text-[13px] text-muted underline underline-offset-2 hover:text-ink"
        >
          I already have an account
        </button>
      </form>
    </main>
  );
}
