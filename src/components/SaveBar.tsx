"use client";

import { useActionState, useEffect, useRef } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { saveUrl, type SaveResult } from "@/app/actions";

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

  return (
    <div className="sticky top-0 z-20 border-b border-hair bg-page/85 backdrop-blur">
      <div className="mx-auto flex max-w-6xl items-center gap-4 px-5 py-3.5">
        <span className="font-serif text-xl italic">mind</span>

        <form ref={form} action={formAction} className="flex-1">
          <input
            name="url"
            type="text"
            disabled={pending}
            placeholder={pending ? "Saving…" : "Paste a link"}
            autoComplete="off"
            className="w-full rounded-lg border border-hair bg-surface px-3 py-2 text-sm
                       placeholder:text-muted disabled:opacity-60"
          />
        </form>

        <input
          type="search"
          defaultValue={params.get("q") ?? ""}
          placeholder="Search"
          aria-label="Search everything you have saved"
          onChange={(e) => {
            const q = e.target.value;
            router.replace(q ? `/?q=${encodeURIComponent(q)}` : "/");
          }}
          className="w-44 rounded-lg border border-transparent bg-surface px-3 py-2 text-sm
                     placeholder:text-muted focus:border-hair"
        />
      </div>

      {result && !result.ok && (
        <p role="alert" className="mx-auto max-w-6xl px-5 pb-2.5 text-[13px] text-accent">
          {result.message}
        </p>
      )}
    </div>
  );
}
