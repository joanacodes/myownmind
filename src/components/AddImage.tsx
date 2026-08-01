"use client";

import { useActionState, useEffect, useRef, useState } from "react";
import { saveImage, type SaveResult } from "@/app/actions";

export function AddImage() {
  const [open, setOpen] = useState(false);
  const pickForm = useRef<HTMLFormElement>(null);
  const shootForm = useRef<HTMLFormElement>(null);
  const pick = useRef<HTMLInputElement>(null);
  const shoot = useRef<HTMLInputElement>(null);

  const [result, formAction, pending] = useActionState<SaveResult | null, FormData>(
    saveImage,
    null
  );

  useEffect(() => {
    if (result?.ok) setOpen(false);
  }, [result]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  return (
    <>
      {/* Two separate forms: `capture` on the second opens the camera
          directly instead of the photo library. Same field name either way. */}
      <form ref={pickForm} action={formAction} className="hidden">
        <input
          ref={pick}
          type="file"
          name="file"
          accept="image/*"
          onChange={() => pickForm.current?.requestSubmit()}
        />
      </form>
      <form ref={shootForm} action={formAction} className="hidden">
        <input
          ref={shoot}
          type="file"
          name="file"
          accept="image/*"
          capture="environment"
          onChange={() => shootForm.current?.requestSubmit()}
        />
      </form>

      <button
        onClick={() => setOpen(true)}
        disabled={pending}
        aria-label="Add an image"
        // Sits clear of the iOS home indicator via the safe-area inset.
        className="fixed right-5 z-40 flex h-14 w-14 items-center justify-center
                   rounded-full bg-ink text-2xl leading-none text-white shadow-lg
                   transition-transform hover:scale-105 active:scale-95
                   disabled:opacity-60"
        style={{ bottom: "calc(1.25rem + env(safe-area-inset-bottom))" }}
      >
        {pending ? (
          <span className="h-5 w-5 animate-spin rounded-full border-2 border-white/30 border-t-white" />
        ) : (
          <span className="-mt-0.5">+</span>
        )}
      </button>

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
            style={{ marginBottom: "env(safe-area-inset-bottom)" }}
          >
            <p className="text-center font-serif text-lg italic">Add an image</p>

            <div className="mt-4 flex flex-col gap-2">
              <button
                disabled={pending}
                onClick={() => shoot.current?.click()}
                className="rounded-xl bg-ink px-3 py-3 text-sm text-white
                           hover:bg-accent disabled:opacity-60"
              >
                Take a picture
              </button>
              <button
                disabled={pending}
                onClick={() => pick.current?.click()}
                className="rounded-xl border border-hair px-3 py-3 text-sm
                           hover:border-ink disabled:opacity-60"
              >
                Add a photo
              </button>
            </div>

            {result && !result.ok && (
              <p role="alert" className="mt-3 text-center text-[13px] text-accent">
                {result.message}
              </p>
            )}

            <button
              onClick={() => setOpen(false)}
              className="mt-3 w-full py-1 text-[13px] text-muted hover:text-ink"
            >
              Cancel
            </button>
          </div>
        </div>
      )}
    </>
  );
}
