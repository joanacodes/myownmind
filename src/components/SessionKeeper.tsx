"use client";

import { useEffect } from "react";
import { supabaseBrowser } from "@/lib/supabase/client";

const KEY = "mind.refresh_token";

/**
 * iOS clears cookies for standalone home-screen apps when the app is
 * terminated, but leaves localStorage intact. Keep a copy of the refresh
 * token there and rebuild the session on launch when the cookie is gone.
 *
 * The refresh token is single-use and rotates on every exchange, so a stale
 * copy is worthless to anyone who reads it.
 */
export function SessionKeeper() {
  useEffect(() => {
    const db = supabaseBrowser();
    let cancelled = false;

    async function restore() {
      const { data } = await db.auth.getSession();
      if (data.session) {
        localStorage.setItem(KEY, data.session.refresh_token);
        return;
      }

      const saved = localStorage.getItem(KEY);
      if (!saved || cancelled) return;

      const { data: fresh, error } = await db.auth.refreshSession({
        refresh_token: saved,
      });

      if (error || !fresh.session) {
        localStorage.removeItem(KEY);
        return;
      }

      localStorage.setItem(KEY, fresh.session.refresh_token);
      // The server rendered this page as signed-out; reload so it re-renders
      // with the restored session rather than showing an empty grid.
      window.location.reload();
    }

    restore();

    const { data: sub } = db.auth.onAuthStateChange((event, session) => {
      if (event === "SIGNED_OUT") localStorage.removeItem(KEY);
      else if (session?.refresh_token) {
        localStorage.setItem(KEY, session.refresh_token);
      }
    });

    // Returning from the background is when iOS is most likely to have
    // dropped the cookie.
    const onVisible = () => {
      if (document.visibilityState === "visible") restore();
    };
    document.addEventListener("visibilitychange", onVisible);

    return () => {
      cancelled = true;
      sub.subscription.unsubscribe();
      document.removeEventListener("visibilitychange", onVisible);
    };
  }, []);

  return null;
}
