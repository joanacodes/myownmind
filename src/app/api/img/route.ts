import { NextResponse, type NextRequest } from "next/server";
import { supabaseServer } from "@/lib/supabase/server";

/**
 * Streams a remote image through our own origin. Two reasons:
 *  - ColorThief reads canvas pixels, which browsers forbid for cross-origin
 *    images. Same-origin bytes make extraction possible at all.
 *  - Signed Supabase Storage URLs stay server-side.
 *
 * Requires a session, so this cannot be used as an open proxy.
 */
export async function GET(request: NextRequest) {
  const db = await supabaseServer();
  const { data: { user } } = await db.auth.getUser();
  if (!user) return new NextResponse("Unauthorized", { status: 401 });

  const raw = request.nextUrl.searchParams.get("url");
  const path = request.nextUrl.searchParams.get("path");

  // Uploaded image: hand back the bytes from private storage.
  if (path) {
    if (!path.startsWith(`${user.id}/`)) {
      return new NextResponse("Forbidden", { status: 403 });
    }
    const { data, error } = await db.storage.from("media").download(path);
    if (error || !data) return new NextResponse("Not found", { status: 404 });
    return new NextResponse(data, {
      headers: {
        "content-type": data.type || "image/jpeg",
        "cache-control": "private, max-age=31536000, immutable",
      },
    });
  }

  if (!raw) return new NextResponse("Missing url", { status: 400 });

  let target: URL;
  try {
    target = new URL(raw);
  } catch {
    return new NextResponse("Bad url", { status: 400 });
  }
  if (target.protocol !== "https:") {
    return new NextResponse("Only https", { status: 400 });
  }

  try {
    const upstream = await fetch(target, {
      headers: { accept: "image/*" },
      signal: AbortSignal.timeout(12_000),
    });
    if (!upstream.ok) return new NextResponse("Upstream failed", { status: 502 });

    const type = upstream.headers.get("content-type") ?? "";
    if (!type.startsWith("image/")) {
      return new NextResponse("Not an image", { status: 415 });
    }

    return new NextResponse(upstream.body, {
      headers: {
        "content-type": type,
        "cache-control": "private, max-age=86400",
      },
    });
  } catch {
    return new NextResponse("Fetch error", { status: 502 });
  }
}
