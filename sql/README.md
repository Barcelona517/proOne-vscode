# Rare Glyph SQL Package

This folder provides a PostgreSQL implementation for:

- PUA-based rare character allocation
- IDS legality validation
- Official Unicode lookup before PUA assignment
- Audit logging for codepoint allocation

## Files

- `001_schema.sql`: Tables, constraints, functions, triggers
- `002_seed_and_tests.sql`: Seed data and smoke test queries

## Run Order

1. Run `001_schema.sql`
2. Run `002_seed_and_tests.sql`

## Important Notes

- Official Unicode codepoints cannot be invented by the system. The function first checks `unicode_official_index`.
- PUA assignment uses `FOR UPDATE SKIP LOCKED` to avoid collisions in concurrent sessions.
- IDS is validated by both character-range checks and expression-structure checks.

## Main Entry Function

`fn_allocate_glyph(...)`

This function inserts one `glyph` row and returns:

- `glyph_id`
- `codepoint`
- `codepoint_type`
- `allocated_from`

## XML Mapping Usage

You can export body references like:

`<char ref="U+E123"/>`

and define glyph metadata in a glyph library section using the same codepoint.
