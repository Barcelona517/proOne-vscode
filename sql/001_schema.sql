-- PostgreSQL schema for rare-character (glyph) management
-- Includes: core tables, IDS validation, PUA slot allocation, and audit logs.

begin;

create table if not exists radical (
  radical_id smallserial primary key,
  kangxi_no smallint not null unique check (kangxi_no between 1 and 214),
  radical_char text not null,
  name_zh text not null
);

create table if not exists unicode_official_index (
  ucode_hex varchar(8) primary key,
  char_glyph text,
  normalized_key text,
  source text not null default 'unicode'
);
create index if not exists idx_unicode_official_normalized_key on unicode_official_index(normalized_key);

create table if not exists pua_block (
  block_id bigserial primary key,
  radical_id smallint not null references radical(radical_id),
  plane smallint not null check (plane in (0, 15, 16)),
  start_cp integer not null,
  end_cp integer not null,
  reserve_ratio numeric(4,3) not null default 0.150 check (reserve_ratio >= 0 and reserve_ratio <= 0.500),
  unique (radical_id, plane),
  check (end_cp > start_cp)
);

create table if not exists pua_slot (
  slot_id bigserial primary key,
  block_id bigint not null references pua_block(block_id) on delete cascade,
  cp_int integer not null unique,
  slot_status varchar(12) not null check (slot_status in ('free','used','reserved')),
  sort_bucket integer not null default 0,
  unique (block_id, cp_int)
);
create index if not exists idx_pua_slot_block_status_bucket on pua_slot(block_id, slot_status, sort_bucket, cp_int);

create table if not exists glyph (
  glyph_id bigserial primary key,
  codepoint varchar(12) not null unique,
  codepoint_int integer not null unique,
  codepoint_type varchar(20) not null check (codepoint_type in ('pua','unicode-official')),
  radical_id smallint not null references radical(radical_id),
  residual_strokes smallint not null check (residual_strokes >= 0),
  stroke_order_key varchar(64) not null,
  ids text not null,
  pronunciation text,
  gloss text,
  source_page varchar(64),
  confidence_score numeric(4,3) check (confidence_score between 0 and 1),
  review_status varchar(20) not null default 'draft',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists idx_glyph_radical_sort on glyph(radical_id, residual_strokes, stroke_order_key);
create index if not exists idx_glyph_ids on glyph(ids);

create table if not exists glyph_image (
  image_id bigserial primary key,
  glyph_id bigint not null references glyph(glyph_id) on delete cascade,
  image_path text not null,
  source_image_path text,
  crop_x integer,
  crop_y integer,
  crop_w integer,
  crop_h integer,
  version_no integer not null default 1,
  is_primary boolean not null default false,
  created_at timestamptz not null default now()
);

create table if not exists glyph_mapping (
  mapping_id bigserial primary key,
  glyph_id bigint not null references glyph(glyph_id) on delete cascade,
  from_codepoint varchar(12) not null,
  to_codepoint varchar(12) not null,
  mapping_type varchar(20) not null default 'upgrade',
  mapped_at timestamptz not null default now(),
  note text
);

create table if not exists pua_allocation_log (
  alloc_id bigserial primary key,
  glyph_id bigint references glyph(glyph_id),
  radical_id smallint not null references radical(radical_id),
  residual_strokes smallint not null,
  stroke_order_key varchar(64) not null,
  allocated_cp_int integer not null,
  allocated_cp varchar(12) not null,
  strategy varchar(40) not null,
  created_at timestamptz not null default now()
);

-- Convert U+XXXX to integer codepoint.
create or replace function fn_cp_to_int(p_cp text)
returns integer
language plpgsql
immutable
as $$
declare
  v_hex text;
begin
  if p_cp is null then
    return null;
  end if;

  v_hex := upper(replace(trim(p_cp), 'U+', ''));
  if v_hex !~ '^[0-9A-F]{4,8}$' then
    raise exception 'Invalid codepoint format: %', p_cp;
  end if;

  return ('x' || v_hex)::bit(32)::int;
end;
$$;

-- Convert integer to U+XXXX (or longer for supplementary planes).
create or replace function fn_int_to_cp(p_int integer)
returns text
language sql
immutable
as $$
  select 'U+' || upper(lpad(to_hex(p_int), 4, '0'));
$$;

-- IDS operators and arity.
create or replace function fn_ids_operator_arity(p_ch text)
returns smallint
language sql
immutable
as $$
  select case p_ch
    when '⿰' then 2
    when '⿱' then 2
    when '⿲' then 3
    when '⿳' then 3
    when '⿴' then 2
    when '⿵' then 2
    when '⿶' then 2
    when '⿷' then 2
    when '⿸' then 2
    when '⿹' then 2
    when '⿺' then 2
    when '⿻' then 2
    else 0
  end;
$$;

-- Character-level IDS validation.
create or replace function fn_ids_chars_valid(p_ids text)
returns boolean
language plpgsql
immutable
as $$
declare
  i integer;
  ch text;
  cp integer;
  arity smallint;
begin
  if p_ids is null or length(trim(p_ids)) = 0 then
    return false;
  end if;

  for i in 1..char_length(p_ids) loop
    ch := substr(p_ids, i, 1);
    arity := fn_ids_operator_arity(ch);
    if arity > 0 then
      continue;
    end if;

    cp := ascii(ch);

    -- Allowed ranges:
    -- Kangxi radicals/U+2E80-2EFF
    -- CJK unified and compatibility
    -- Extension A-I + SIP/TIP ranges
    -- PUA BMP + Plane 15/16
    if not (
      (cp between 11904 and 12255) or
      (cp between 13312 and 19903) or
      (cp between 19968 and 40959) or
      (cp between 63744 and 64255) or
      (cp between 131072 and 173791) or
      (cp between 173824 and 177977) or
      (cp between 177984 and 178205) or
      (cp between 178208 and 183983) or
      (cp between 183984 and 191471) or
      (cp between 196608 and 201551) or
      (cp between 201552 and 205743) or
      (cp between 57344 and 63743) or
      (cp between 983040 and 1048573) or
      (cp between 1048576 and 1114109)
    ) then
      return false;
    end if;
  end loop;

  return true;
end;
$$;

-- Structure-level IDS validation using reverse scan stack reduction.
create or replace function fn_ids_structure_valid(p_ids text)
returns boolean
language plpgsql
immutable
as $$
declare
  i integer;
  ch text;
  arity smallint;
  stack_count integer := 0;
begin
  if p_ids is null or length(trim(p_ids)) = 0 then
    return false;
  end if;

  for i in reverse char_length(p_ids)..1 loop
    ch := substr(p_ids, i, 1);
    arity := fn_ids_operator_arity(ch);

    if arity > 0 then
      if stack_count < arity then
        return false;
      end if;
      stack_count := stack_count - arity + 1;
    else
      stack_count := stack_count + 1;
    end if;
  end loop;

  return stack_count = 1;
end;
$$;

create or replace function fn_ids_valid(p_ids text)
returns boolean
language sql
immutable
as $$
  select fn_ids_chars_valid(p_ids) and fn_ids_structure_valid(p_ids);
$$;

create or replace function trg_glyph_validate()
returns trigger
language plpgsql
as $$
begin
  if not fn_ids_valid(new.ids) then
    raise exception 'Invalid IDS string: %', new.ids;
  end if;

  new.updated_at := now();
  return new;
end;
$$;

drop trigger if exists tg_glyph_validate on glyph;
create trigger tg_glyph_validate
before insert or update on glyph
for each row execute function trg_glyph_validate();

-- Build slot pool for a block.
create or replace function fn_build_pua_slots(p_block_id bigint)
returns void
language plpgsql
as $$
declare
  v_start integer;
  v_end integer;
  v_reserve_ratio numeric(4,3);
  v_total integer;
  v_reserve_count integer;
  v_i integer;
begin
  select start_cp, end_cp, reserve_ratio
    into v_start, v_end, v_reserve_ratio
  from pua_block
  where block_id = p_block_id;

  if not found then
    raise exception 'pua_block not found: %', p_block_id;
  end if;

  delete from pua_slot where block_id = p_block_id;

  v_total := v_end - v_start + 1;
  v_reserve_count := greatest(0, floor(v_total * v_reserve_ratio));

  -- Reserve every Nth slot from tail to keep insertion space.
  for v_i in 0..(v_total - 1) loop
    insert into pua_slot (block_id, cp_int, slot_status, sort_bucket)
    values (
      p_block_id,
      v_start + v_i,
      case
        when v_reserve_count > 0 and v_i >= (v_total - v_reserve_count) then 'reserved'
        else 'free'
      end,
      0
    );
  end loop;
end;
$$;

-- Main allocation function.
-- Strategy:
-- 1) check official index by normalized key
-- 2) else allocate one free slot in the radical block with SKIP LOCKED
create or replace function fn_allocate_glyph(
  p_radical_id smallint,
  p_residual_strokes smallint,
  p_stroke_order_key varchar,
  p_ids text,
  p_normalized_key text default null,
  p_pronunciation text default null,
  p_gloss text default null,
  p_source_page varchar default null,
  p_confidence_score numeric default null
)
returns table (
  glyph_id bigint,
  codepoint text,
  codepoint_type varchar,
  allocated_from varchar
)
language plpgsql
as $$
declare
  v_official_hex varchar(8);
  v_cp_int integer;
  v_cp text;
  v_slot_id bigint;
  v_block_id bigint;
  v_glyph_id bigint;
begin
  if p_radical_id is null then
    raise exception 'radical_id is required';
  end if;

  if not fn_ids_valid(p_ids) then
    raise exception 'Invalid IDS string: %', p_ids;
  end if;

  -- Step 1: official Unicode lookup
  if p_normalized_key is not null then
    select ucode_hex into v_official_hex
    from unicode_official_index
    where normalized_key = p_normalized_key
    limit 1;
  end if;

  if v_official_hex is not null then
    v_cp := 'U+' || upper(v_official_hex);
    v_cp_int := fn_cp_to_int(v_cp);

    insert into glyph (
      codepoint, codepoint_int, codepoint_type,
      radical_id, residual_strokes, stroke_order_key,
      ids, pronunciation, gloss, source_page, confidence_score, review_status
    ) values (
      v_cp, v_cp_int, 'unicode-official',
      p_radical_id, p_residual_strokes, p_stroke_order_key,
      p_ids, p_pronunciation, p_gloss, p_source_page, p_confidence_score, 'draft'
    ) returning glyph.glyph_id into v_glyph_id;

    return query
    select v_glyph_id, v_cp, 'unicode-official'::varchar, 'official-index'::varchar;

    return;
  end if;

  -- Step 2: PUA allocation
  select block_id into v_block_id
  from pua_block
  where radical_id = p_radical_id and plane = 0
  limit 1;

  if v_block_id is null then
    raise exception 'No BMP PUA block configured for radical_id=%', p_radical_id;
  end if;

  select slot_id, cp_int
    into v_slot_id, v_cp_int
  from pua_slot
  where block_id = v_block_id
    and slot_status = 'free'
  order by sort_bucket asc, cp_int asc
  for update skip locked
  limit 1;

  if v_slot_id is null then
    raise exception 'No free PUA slot in block_id=%', v_block_id;
  end if;

  update pua_slot
  set slot_status = 'used'
  where slot_id = v_slot_id;

  v_cp := fn_int_to_cp(v_cp_int);

  insert into glyph (
    codepoint, codepoint_int, codepoint_type,
    radical_id, residual_strokes, stroke_order_key,
    ids, pronunciation, gloss, source_page, confidence_score, review_status
  ) values (
    v_cp, v_cp_int, 'pua',
    p_radical_id, p_residual_strokes, p_stroke_order_key,
    p_ids, p_pronunciation, p_gloss, p_source_page, p_confidence_score, 'draft'
  ) returning glyph.glyph_id into v_glyph_id;

  insert into pua_allocation_log (
    glyph_id, radical_id, residual_strokes, stroke_order_key,
    allocated_cp_int, allocated_cp, strategy
  ) values (
    v_glyph_id, p_radical_id, p_residual_strokes, p_stroke_order_key,
    v_cp_int, v_cp, 'radical-stroke-gap'
  );

  return query
  select v_glyph_id, v_cp, 'pua'::varchar, 'pua-slot'::varchar;
end;
$$;

commit;
