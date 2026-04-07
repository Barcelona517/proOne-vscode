-- Seed data and smoke tests for rare-character schema

begin;

-- Minimal radicals for demo
insert into radical (kangxi_no, radical_char, name_zh)
values
  (30, '口', 'kou'),
  (85, '水', 'shui'),
  (149, '言', 'yan')
on conflict (kangxi_no) do nothing;

-- Demo official index rows (normalized_key is project-defined)
insert into unicode_official_index (ucode_hex, char_glyph, normalized_key, source)
values
  ('6F22', '漢', 'han-trad', 'unicode')
on conflict (ucode_hex) do nothing;

-- Create one BMP PUA block per radical if missing
insert into pua_block (radical_id, plane, start_cp, end_cp, reserve_ratio)
select r.radical_id, 0,
       case r.kangxi_no
         when 30 then 57344  -- U+E000
         when 85 then 57500
         when 149 then 57650
       end as start_cp,
       case r.kangxi_no
         when 30 then 57499
         when 85 then 57649
         when 149 then 57799
       end as end_cp,
       0.150
from radical r
where r.kangxi_no in (30, 85, 149)
on conflict (radical_id, plane) do nothing;

-- Build slots for blocks that have no slots yet
with empty_blocks as (
  select pb.block_id
  from pua_block pb
  left join pua_slot ps on ps.block_id = pb.block_id
  group by pb.block_id
  having count(ps.slot_id) = 0
)
select fn_build_pua_slots(block_id) from empty_blocks;

commit;

-- =========================
-- Smoke tests
-- =========================

-- 1) IDS validators
select fn_ids_valid('⿰口合') as ids_ok_should_true;
select fn_ids_valid('⿲口') as ids_bad_should_false;

-- 2) Allocate using official mapping (normalized key hit)
-- select * from fn_allocate_glyph(
--   p_radical_id := (select radical_id from radical where kangxi_no = 30),
--   p_residual_strokes := 10,
--   p_stroke_order_key := 'HSPDZ',
--   p_ids := '⿰氵漢',
--   p_normalized_key := 'han-trad',
--   p_pronunciation := 'han',
--   p_gloss := 'han test',
--   p_source_page := 'p12',
--   p_confidence_score := 0.95
-- );

-- 3) Allocate from PUA slot
-- select * from fn_allocate_glyph(
--   p_radical_id := (select radical_id from radical where kangxi_no = 30),
--   p_residual_strokes := 5,
--   p_stroke_order_key := 'HSP',
--   p_ids := '⿰口合',
--   p_normalized_key := null,
--   p_pronunciation := 'he',
--   p_gloss := 'test glyph',
--   p_source_page := 'p20',
--   p_confidence_score := 0.87
-- );

-- 4) Check allocation log
-- select * from pua_allocation_log order by alloc_id desc limit 10;

-- 5) Concurrency test hint:
-- Open two sessions and run the same fn_allocate_glyph call concurrently.
-- Because of FOR UPDATE SKIP LOCKED, each session should get a different free slot.
