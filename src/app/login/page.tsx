"use client";

import { useActionState, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { signIn, type SaveResult } from "@/app/actions";
import { supabaseBrowser } from "@/lib/supabase/client";

export default function Login() {
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);
  const [resetError, setResetError] = useState<string | null>(null);
  const router = useRouter();

  const [result, formAction, pending] = useActionState<SaveResult | null, FormData>(
    signIn,
    null
  );

  useEffect(() => {
    if (!result?.ok) return;
    // The server set the cookie; sync the browser client so SessionKeeper
    // can stash the refresh token for iOS.
    supabaseBrowser()
      .auth.getSession()
      .then(({ data }) => {
        if (data.session) {
          localStorage.setItem("mind.refresh_token", data.session.refresh_token);
        }
        router.push("/");
        router.refresh();
      });
  }, [result, router]);

  async function sendReset() {
    if (!email.trim()) {
      setResetError("Enter your email first.");
      return;
    }
    const { error } = await supabaseBrowser().auth.resetPasswordForEmail(email.trim(), {
      redirectTo: `${location.origin}/auth/callback?next=/account`,
    });
    if (error) setResetError(error.message);
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
            placeholder="Password"
            autoComplete="current-password"
            className={field}
          />

          {(result && !result.ok) || resetError ? (
            <p role="alert" className="text-[13px] leading-relaxed text-accent">
              {resetError ?? result?.message}
            </p>
          ) : null}

          <button
            type="submit"
            disabled={pending}
            className="rounded-lg bg-ink px-3 py-2 text-sm text-white hover:bg-accent
                       disabled:opacity-60"
          >
            {pending ? "…" : "Sign in"}
          </button>

          <button
            type="button"
            onClick={() => router.push("/signup")}
            className="text-[13px] text-muted underline underline-offset-2 hover:text-ink"
          >
            Create an account
          </button>

          <button
            type="button"
            onClick={sendReset}
            className="text-[13px] text-muted underline underline-offset-2 hover:text-ink"
          >
            Set or reset your password by email
          </button>
        </form>
      )}
    </main>
  );
}
