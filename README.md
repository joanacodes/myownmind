# mind

A private archive for links worth keeping. Runs entirely on free tiers.

## Setup

1. **Supabase** — create a project at supabase.com (free tier).
   Run `supabase/migrations/0001_init.sql` in the SQL editor.

2. **Env** — copy `.env.example` to `.env.local` and fill it in.
   URL and anon key: Project settings → API.
   Service role key: same page, keep it server-side only.

3. **Lock it to you** — Authentication → Providers → Email, turn off
   "Allow new users to sign up" after your first sign-in. That is the whole
   access control story for a single-user app.

4. `npm install && npm run dev`

## Deploy

Push to GitHub, import on Vercel, paste the same env vars. Hobby tier is free.
Add your Vercel URL to Supabase → Authentication → URL Configuration.

## How saving works

`saveUrl` inserts a row with `status: 'pending'` and returns immediately, so the
card appears instantly. `after()` then runs `enrichItem` once the response has
been sent: fetch the HTML, read the `og:` tags, pull an excerpt, ask Gemini for
tags, flip the row to `ready`.

The page is `force-dynamic`, so a refresh shows the filled-in card. To make it
update without a refresh, subscribe to Postgres changes on the client — see
"Next steps".

## Known limits

- **No screenshots.** Sites without an `og:image` render as a text card. Adding
  screenshots means running a headless browser, which is the first thing that
  will cost money.
- **Hotlinked images.** If the source deletes the image, the card loses it.
  `onError` hides broken images. Caching to Supabase Storage is the fix.
- **Vercel free tier caps function duration.** A very slow site can time out
  mid-enrichment and land in `failed`. Re-saving retries.
- **Keyword search only.** It matches words that literally appear in the page.

## Next steps, roughly in order of payoff

1. Browser extension (WXT) — this is what makes it a daily habit.
2. Realtime: `supabase.channel().on('postgres_changes', ...)` so pending cards
   fill in live instead of on refresh.
3. Notes and highlights: `type` and `note` columns already exist.
4. Semantic search: `create extension vector`, add an `embedding` column,
   generate with Gemini's free embedding endpoint, fuse with the existing FTS.
5. Screenshots, once you are willing to spend ~$5/mo.
