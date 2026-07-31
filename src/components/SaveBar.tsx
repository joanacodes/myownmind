"use client";

import { useRef } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { saveUrl } from "@/app/actions";

export function SaveBar() {
  const form = useRef<HTMLFormElement>(null);
  const router = useRouter();
  const params = useSearchParams();

  return (
    <div className="sticky top-0 z-20 border-b border-hair bg-page/85 backdrop-blur">
      <div className="mx-auto flex max-w-6xl items-center gap-4 px-5 py-3.5">
        <span className="font-serif text-xl italic">mind</span>

        <form
          ref={form}
          action={async (fd) => { form.current?.reset(); await saveUrl(fd); }}
          className="flex-1"
        >
          <input
            name="url"
            type="text"
            placeholder="Paste a link"
            autoComplete="off"
            className="w-full rounded-lg border border-hair bg-surface px-3 py-2 text-sm
                       placeholder:text-muted"
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
    </div>
  );
}
