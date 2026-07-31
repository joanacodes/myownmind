-- Personal bookmark archive: schema, RLS, search.

create table if not exists items (
  id            uuid primary key default gen_random_uuid(),
  user_id       uuid not null references auth.users on delete cascade,
  type          text not null default 'link',   -- link | note | image
  url           text,
  canonical_url text,
  title         text,
  description   text,
  site_name     text,
  favicon_url   text,
  image_url     text,
  content_text  text,
  note          text,
  tags          text[] not null default '{}',
  status        text not null default 'pending', -- pending | ready | failed
  error         text,
  created_at    timestamptz not null default now(),
  deleted_at    timestamptz,

  -- 'simple' config on purpose: no stemming, so mixed FR/EN content
  -- behaves predictably instead of being stemmed with the wrong rules.
  fts tsvector generated always as (
    to_tsvector('simple',
      coalesce(title, '')        || ' ' ||
      coalesce(description, '')  || ' ' ||
      coalesce(note, '')         || ' ' ||
      coalesce(site_name, '')    || ' ' ||
      coalesce(array_to_string(tags, ' '), '') || ' ' ||
      coalesce(content_text, '')
    )
  ) stored
);

create index if not exists items_fts_idx    on items using gin (fts);
create index if not exists items_tags_idx   on items using gin (tags);
create index if not exists items_recent_idx on items (user_id, created_at desc)
  where deleted_at is null;

-- Dedupe: saving the same link twice updates instead of duplicating.
create unique index if not exists items_dedupe_idx
  on items (user_id, canonical_url) where deleted_at is null;

alter table items enable row level security;

create policy "own items: select" on items for select using (auth.uid() = user_id);
create policy "own items: insert" on items for insert with check (auth.uid() = user_id);
create policy "own items: update" on items for update using (auth.uid() = user_id);
create policy "own items: delete" on items for delete using (auth.uid() = user_id);
