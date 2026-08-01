"use client";

import { useActionState, useEffect, useRef } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { saveUrl, signOut, type SaveResult } from "@/app/actions";
import { AddImage } from "./AddImage";

export function SaveBar() {
  const form = useRef<HTMLFormElement>(null);
  const router = useRouter();
  const params = useSearchParams();

  const [result, formAction, pending] = useActionState<SaveResult | null, FormData>(
    saveUrl,
    null
  );

  // Clear the field only once the save actually succeeded, so a failed
  // attempt leaves the link in place to retry.
  useEffect(() => {
    if (result?.ok) form.current?.reset();
  }, [result]);

  async function handleSignOut() {
    // Sign-out runs on the server, so the browser client never fires
    // SIGNED_OUT — drop the stored token here or the next launch would
    // silently sign back in.
    localStorage.removeItem("mind.refresh_token");
    await signOut();
    router.push("/login");
    router.refresh();
  }

  const field =
    "w-full rounded-lg border border-hair bg-surface px-3 py-2 text-sm placeholder:text-muted";

  return (
    // Static on small screens: three stacked controls would eat too much of a
    // phone viewport if they stayed pinned.
    <div className="static border-b border-hair bg-page/85 backdrop-blur sm:sticky sm:top-0 sm:z-20">
      <div className="mx-auto flex max-w-6xl flex-wrap items-center gap-x-3 gap-y-2
                      px-4 py-3 sm:flex-nowrap sm:gap-4 sm:px-5">
        <span className="order-1 font-serif text-xl italic">mind</span>

        <div className="order-2 ml-auto flex items-center gap-1 sm:order-4 sm:ml-0">
          <button
            onClick={() => router.push("/account")}
            className="rounded-lg px-2.5 py-1.5 text-[13px] text-muted
                       hover:bg-surface hover:text-ink"
          >
            Account
          </button>
          <button
            onClick={handleSignOut}
            className="rounded-lg px-2.5 py-1.5 text-[13px] text-muted
                       hover:bg-surface hover:text-ink"
          >
            Sign out
          </button>
        </div>

        <div className="order-3 flex w-full gap-2 sm:order-2 sm:w-auto sm:flex-1">
          <AddImage />
          <form ref={form} action={formAction} className="flex-1">
          <input
            name="url"
            type="text"
            inputMode="url"
            disabled={pending}
            placeholder={pending ? "Saving…" : "Paste a link"}
            autoComplete="off"
            autoCapitalize="off"
            spellCheck={false}
              className={`${field} disabled:opacity-60`}
            />
          </form>
        </div>

        <input
          type="search"
          defaultValue={params.get("q") ?? ""}
          placeholder="Search"
          aria-label="Search everything you have saved"
          onChange={(e) => {
            const q = e.target.value;
            router.replace(q ? `/?q=${encodeURIComponent(q)}` : "/");
          }}
          className={`${field} order-4 border-transparent focus:border-hair
                      sm:order-3 sm:w-44`}
        />
      </div>

      {result && !result.ok && (
        <p role="alert" className="mx-auto max-w-6xl px-4 pb-2.5 text-[13px] text-accent sm:px-5">
          {result.message}
        </p>
      )}
    </div>
  );
}
