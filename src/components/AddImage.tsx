"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { registerImage } from "@/app/actions";
import { supabaseBrowser } from "@/lib/supabase/client";
import { resizeImage } from "@/lib/resize";

export function AddImage() {
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const pick = useRef<HTMLInputElement>(null);
  const shoot = useRef<HTMLInputElement>(null);
  const router = useRouter();

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  async function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = ""; // let the same file be picked again after an error
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      setError("That is not an image.");
      return;
    }

    setBusy(true);
    setError(null);

    try {
      const db = supabaseBrowser();
      const { data: { user } } = await db.auth.getUser();
      if (!user) {
        setError("Session expired. Sign in again.");
        return;
      }

      const blob = await resizeImage(file);
      const path = `${user.id}/${crypto.randomUUID()}.jpg`;

      // Straight to Storage: a server action would cap the body at 1 MB.
      const { error: uploadError } = await db.storage
        .from("media")
        .upload(path, blob, { contentType: blob.type || "image/jpeg", upsert: false });

      if (uploadError) {
        setError(uploadError.message);
        return;
      }

      const result = await registerImage(
        path,
        file.name.replace(/\.[^.]+$/, "")
      );

      if (!result.ok) {
        setError(result.message ?? "Could not save that image.");
        return;
      }

      setOpen(false);
      router.refresh();
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <>
      <input
        ref={pick}
        type="file"
        accept="image/*"
        onChange={handleFile}
        className="hidden"
      />
      {/* `capture` opens the camera directly rather than the photo library. */}
      <input
        ref={shoot}
        type="file"
        accept="image/*"
        capture="environment"
        onChange={handleFile}
        className="hidden"
      />

      <button
        onClick={() => setOpen(true)}
        disabled={busy}
        aria-label="Add an image"
        // Sits clear of the iOS home indicator via the safe-area inset.
        className="fixed right-5 z-40 flex h-14 w-14 items-center justify-center
                   rounded-full bg-ink text-2xl leading-none text-white shadow-lg
                   transition-transform hover:scale-105 active:scale-95
                   disabled:opacity-60"
        style={{ bottom: "calc(1.25rem + env(safe-area-inset-bottom))" }}
      >
        {busy ? (
          <span className="h-5 w-5 animate-spin rounded-full border-2 border-white/30 border-t-white" />
        ) : (
          <span className="-mt-0.5">+</span>
        )}
      </button>

      {open && (
        <div
          onClick={() => !busy && setOpen(false)}
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
            <p className="text-center font-serif text-lg italic">
              {busy ? "Uploading…" : "Add an image"}
            </p>

            <div className="mt-4 flex flex-col gap-2">
              <button
                disabled={busy}
                onClick={() => shoot.current?.click()}
                className="rounded-xl bg-ink px-3 py-3 text-sm text-white
                           hover:bg-accent disabled:opacity-60"
              >
                Take a picture
              </button>
              <button
                disabled={busy}
                onClick={() => pick.current?.click()}
                className="rounded-xl border border-hair px-3 py-3 text-sm
                           hover:border-ink disabled:opacity-60"
              >
                Add a photo
              </button>
            </div>

            {error && (
              <p role="alert" className="mt-3 text-center text-[13px] text-accent">
                {error}
              </p>
            )}

            <button
              onClick={() => setOpen(false)}
              disabled={busy}
              className="mt-3 w-full py-1 text-[13px] text-muted hover:text-ink
                         disabled:opacity-60"
            >
              Cancel
            </button>
          </div>
        </div>
      )}
    </>
  );
}
