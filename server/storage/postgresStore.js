import { Pool } from "pg";
import { buildRecordPayload } from "./helpers.js";

function rowToRecord(row) {
  return {
    id: row.id,
    charGlyph: row.char_glyph || "",
    codepoint: row.codepoint,
    codepointType: row.codepoint_type,
    ids: row.ids || "",
    note: row.note || "",
    imageDataUrl: row.image_data_url || "",
    createdAt: row.created_at instanceof Date ? row.created_at.toISOString() : String(row.created_at)
  };
}

export class PostgresStore {
  constructor(connectionString) {
    this.pool = new Pool({ connectionString });
  }

  async init() {
    await this.pool.query(`
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
    `);
  }

  async list() {
    const result = await this.pool.query(
      "select id, char_glyph, codepoint, codepoint_type, ids, note, image_data_url, created_at from glyph_records order by created_at desc"
    );
    return result.rows.map(rowToRecord);
  }

  async create(input) {
    const client = await this.pool.connect();
    try {
      await client.query("begin");
      await client.query("select pg_advisory_xact_lock(1008611)");

      const existing = await client.query("select codepoint from glyph_records");
      const used = new Set(existing.rows.map((r) => r.codepoint));
      const record = buildRecordPayload(input, used);

      await client.query(
        `insert into glyph_records (id, char_glyph, codepoint, codepoint_type, ids, note, image_data_url, created_at)
         values ($1,$2,$3,$4,$5,$6,$7,$8)`,
        [
          record.id,
          record.charGlyph,
          record.codepoint,
          record.codepointType,
          record.ids,
          record.note,
          record.imageDataUrl,
          record.createdAt
        ]
      );

      await client.query("commit");
      return record;
    } catch (err) {
      await client.query("rollback");
      throw err;
    } finally {
      client.release();
    }
  }

  async remove(id) {
    const result = await this.pool.query("delete from glyph_records where id = $1", [id]);
    return result.rowCount > 0;
  }

  async replaceAll(records) {
    const list = Array.isArray(records) ? records : [];
    const client = await this.pool.connect();
    try {
      await client.query("begin");
      await client.query("truncate table glyph_records");
      for (const item of list) {
        await client.query(
          `insert into glyph_records (id, char_glyph, codepoint, codepoint_type, ids, note, image_data_url, created_at)
           values ($1,$2,$3,$4,$5,$6,$7,$8)`,
          [
            item.id,
            item.charGlyph || "",
            item.codepoint,
            item.codepointType || "pua",
            item.ids || "",
            item.note || "",
            item.imageDataUrl || "",
            item.createdAt || new Date().toISOString()
          ]
        );
      }
      await client.query("commit");
      return list.length;
    } catch (err) {
      await client.query("rollback");
      throw err;
    } finally {
      client.release();
    }
  }
}
