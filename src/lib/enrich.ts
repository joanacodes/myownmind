import * as cheerio from "cheerio";
import { createClient } from "@supabase/supabase-js";

/** Strip tracking params so the same link always dedupes to one row. */
export function canonicalize(raw: string): string {
  const u = new URL(raw);
  const junk = /^(utm_|fbclid|gclid|mc_|ref_?$|igshid|si$)/i;
  [...u.searchParams.keys()].forEach((k) => junk.test(k) && u.searchParams.delete(k));
  u.hash = "";
  u.hostname = u.hostname.replace(/^www\./, "");
  return u.toString().replace(/\/$/, "");
}

/**
 * WordPress's free screenshot service. No key, no fetch — it is just a URL
 * pattern, so it can be set the instant a link is saved. The first request
 * for a given URL triggers generation and may return a grey placeholder;
 * it fills in once the shot is ready.
 */
export function previewUrl(url: string): string {
  return `https://s.wordpress.com/mshots/v1/${encodeURIComponent(url)}?w=800`;
}

/**
 * Font families a site actually uses. Reads three signals, cheapest first:
 * Google Fonts links, Adobe Fonts kits, and font-family declarations in
 * inline <style> blocks plus the first same-origin stylesheet.
 */
async function extractFonts(
  $: cheerio.CheerioAPI,
  pageUrl: string
): Promise<string[]> {
  const found = new Set<string>();
  const GENERIC =
    /^(inherit|initial|unset|revert|sans-serif|serif|monospace|cursive|fantasy|system-ui|ui-[a-z-]+|-apple-system|BlinkMacSystemFont|Segoe UI|Helvetica|Helvetica Neue|Arial|Roboto|Times|Times New Roman|Courier|Courier New|Georgia|Verdana|Tahoma|emoji|math|fangsong|var\(.*)$/i;

  const addFamily = (raw: string) => {
    raw
      .split(",")
      .map((f) => f.trim().replace(/^["']|["']$/g, ""))
      .filter((f) => f && f.length < 40 && !GENERIC.test(f))
      .forEach((f) => found.add(f));
  };

  $('link[href*="fonts.googleapis.com"]').each((_, el) => {
    const href = $(el).attr("href") ?? "";
    for (const m of href.matchAll(/family=([^&:]+)/g)) {
      addFamily(decodeURIComponent(m[1]).replace(/\+/g, " "));
    }
  });

  if ($('link[href*="use.typekit.net"], script[src*="use.typekit.net"]').length) {
    found.add("Adobe Fonts");
  }

  const cssBlocks: string[] = [];
  $("style").each((_, el) => {
    cssBlocks.push($(el).html() ?? "");
  });

  // One stylesheet only — enrichment runs inside a request and must stay quick.
  const sheet = $('link[rel="stylesheet"]').first().attr("href");
  if (sheet) {
    try {
      const res = await fetch(new URL(sheet, pageUrl), {
        signal: AbortSignal.timeout(6_000),
      });
      if (res.ok) cssBlocks.push((await res.text()).slice(0, 200_000));
    } catch {
      // A missing stylesheet is not worth failing the save over.
    }
  }

  for (const css of cssBlocks) {
    for (const m of css.matchAll(/font-family\s*:\s*([^;{}]+)/gi)) addFamily(m[1]);
  }

  return [...found].slice(0, 8);
}

type Meta = {
  fonts: string[];
  title: string | null;
  description: string | null;
  site_name: string | null;
  image_url: string | null;
  favicon_url: string | null;
  content_text: string | null;
};

async function scrape(url: string): Promise<Meta> {
  const res = await fetch(url, {
    headers: {
      // Some sites serve a stub to unknown agents. A real UA gets the og: tags.
      "user-agent":
        "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 " +
        "(KHTML, like Gecko) Chrome/126.0 Safari/537.36",
      accept: "text/html,application/xhtml+xml",
    },
    signal: AbortSignal.timeout(12_000),
  });
  if (!res.ok) throw new Error(`Fetch failed: ${res.status}`);

  const $ = cheerio.load(await res.text());
  const pick = (...sels: string[]) => {
    for (const s of sels) {
      const v = $(s).attr("content") ?? $(s).text();
      if (v?.trim()) return v.trim();
    }
    return null;
  };
  const abs = (v: string | null) => (v ? new URL(v, url).toString() : null);

  $("script, style, nav, footer, header, aside").remove();
  const body = $("article").text() || $("main").text() || $("body").text();

  const fonts = await extractFonts($, url);

  return {
    fonts,
    title: pick('meta[property="og:title"]', 'meta[name="twitter:title"]', "title"),
    description: pick(
      'meta[property="og:description"]',
      'meta[name="description"]',
      'meta[name="twitter:description"]'
    ),
    site_name: pick('meta[property="og:site_name"]') ?? new URL(url).hostname,
    // Prefer the site's own social image; fall back to a screenshot.
    image_url:
      abs(pick('meta[property="og:image"]', 'meta[name="twitter:image"]')) ??
      previewUrl(url),
    favicon_url: `https://www.google.com/s2/favicons?domain=${new URL(url).hostname}&sz=64`,
    content_text: body.replace(/\s+/g, " ").trim().slice(0, 4000) || null,
  };
}

/** Auto-tagging via Gemini's free tier. Returns [] if no key is set. */
async function autoTag(meta: Meta): Promise<string[]> {
  const key = process.env.GEMINI_API_KEY;
  if (!key) return [];

  const prompt =
    "Return 3-6 lowercase topical tags for this saved link as a JSON array of " +
    "strings. Single or two-word tags. No explanation.\n\n" +
    `Title: ${meta.title}\nSite: ${meta.site_name}\n` +
    `Description: ${meta.description}\nExcerpt: ${meta.content_text?.slice(0, 1200)}`;

  try {
    const res = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${key}`,
      {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: {
            responseMimeType: "application/json",
            responseSchema: { type: "ARRAY", items: { type: "STRING" } },
          },
        }),
        signal: AbortSignal.timeout(15_000),
      }
    );
    const json = await res.json();
    const text = json?.candidates?.[0]?.content?.parts?.[0]?.text;
    const tags = JSON.parse(text ?? "[]");
    return Array.isArray(tags) ? tags.slice(0, 6).map(String) : [];
  } catch {
    return []; // Tagging is a bonus — never fail the save because of it.
  }
}

/**
 * Runs after the response is sent. Uses the service role key because there is
 * no user session on this code path.
 */
export async function enrichItem(itemId: string, url: string) {
  const db = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false } }
  );

  try {
    const meta = await scrape(url);
    const tags = await autoTag(meta);
    await db.from("items").update({ ...meta, tags, status: "ready" }).eq("id", itemId);
  } catch (e) {
    await db
      .from("items")
      .update({ status: "failed", error: (e as Error).message })
      .eq("id", itemId);
  }
}
