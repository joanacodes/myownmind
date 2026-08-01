"use client";

import { useActionState, useEffect, useRef, useState } from "react";
import { saveImage, type SaveResult } from "@/app/actions";

export function AddImage() {
  const [open, setOpen] = useState(false);
  const form = useRef<HTMLFormElement>(null);
  const pick = useRef<HTMLInputElement>(null);
  const shoot = useRef<HTMLInputElement>(null);

  const [result, formAction, pending] = useActionState<SaveResult | null, FormData>(
    saveImage,
    null
  );

  useEffect(() => {
    if (result?.ok) setOpen(false);
  }, [result]);

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        aria-label="Add an image"
        className="rounded-lg border border-hair bg-surface px-2.5 py-2 text-sm
                   text-muted hover:text-ink"
      >
        ＋
      </button>

      <form ref={form} action={formAction} className="hidden">
        <input
          ref={pick}
          type="file"
          name="file"
          accept="image/*"
          onChange={() => form.current?.requestSubmit()}
        />
      </form>

      {/* A second input: `capture` opens the camera directly rather than the
          photo library. Same form field name, so the action is unchanged. */}
      <form action={formAction} className="hidden">
        <input
          ref={shoot}
          type="file"
          name="file"
          accept="image/*"
          capture="environment"
          onChange={(e) => e.currentTarget.form?.requestSubmit()}
        />
      </form>

      {open && (
        <div
          onClick={() => setOpen(false)}
          className="fixed inset-0 z-50 flex items-end justify-center bg-ink/40
                     p-4 backdrop-blur-sm sm:items-center"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            role="dialog"
            aria-modal="true"
            aria-label="Add an image"
            className="w-full max-w-xs rounded-2xl border border-hair bg-surface p-4"
          >
            <p className="text-[13px] text-muted">
              {pending ? "Uploading…" : "Add an image"}
            </p>

            <div className="mt-3 flex flex-col gap-2">
              <button
                disabled={pending}
                onClick={() => shoot.current?.click()}
                className="rounded-lg bg-ink px-3 py-2.5 text-sm text-white
                           hover:bg-accent disabled:opacity-60"
              >
                Take a photo
              </button>
              <button
                disabled={pending}
                onClick={() => pick.current?.click()}
                className="rounded-lg border border-hair px-3 py-2.5 text-sm
                           hover:border-ink disabled:opacity-60"
              >
                Choose from library
              </button>
            </div>

            {result && !result.ok && (
              <p role="alert" className="mt-3 text-[13px] text-accent">
                {result.message}
              </p>
            )}

            <button
              onClick={() => setOpen(false)}
              className="mt-3 w-full text-[13px] text-muted hover:text-ink"
            >
              Cancel
            </button>
          </div>
        </div>
      )}
    </>
  );
}
