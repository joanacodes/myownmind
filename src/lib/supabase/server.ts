import { createServerClient, type CookieOptions } from "@supabase/ssr";
import { cookies } from "next/headers";

type CookieList = { name: string; value: string; options: CookieOptions }[];

// A cookie with no maxAge is a session cookie, and iOS discards those when a
// home-screen app is killed. An explicit lifetime makes it persistent.
const YEAR = 60 * 60 * 24 * 365;

export async function supabaseServer() {
  const store = await cookies();
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll: () => store.getAll(),
        setAll: (list: CookieList) => {
          try {
            list.forEach(({ name, value, options }) =>
              store.set(name, value, {
                ...options,
                maxAge: options.maxAge ?? YEAR,
                sameSite: "lax",
                secure: process.env.NODE_ENV === "production",
                path: "/",
              })
            );
          } catch {
            // Called from a Server Component; middleware refreshes instead.
          }
        },
      },
    }
  );
}
