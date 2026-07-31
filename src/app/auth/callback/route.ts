import { NextResponse, type NextRequest } from "next/server";
import { supabaseServer } from "@/lib/supabase/server";

export async function GET(request: NextRequest) {
  const code = request.nextUrl.searchParams.get("code");
  // Password-reset links carry ?next=/account so they land on the form
  // instead of the grid. Relative paths only — never redirect off-site.
  const next = request.nextUrl.searchParams.get("next");
  const target = next?.startsWith("/") ? next : "/";

  if (code) {
    const db = await supabaseServer();
    await db.auth.exchangeCodeForSession(code);
  }

  return NextResponse.redirect(new URL(target, request.url));
}
