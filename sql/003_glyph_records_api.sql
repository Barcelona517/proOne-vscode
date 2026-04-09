-- Optional lightweight table for glyph-maker API postgres mode.
-- Run this file only if you want to precreate the table manually.

begin;

create table if not exists glyph_records (
  id text primary key,
  char_glyph text,
  codepoint text not null unique,
  codepoint_type text not null,
  ids text,
  note text,
  image_data_url text,
  created_at timestamptz not null default now()
);

commit;
