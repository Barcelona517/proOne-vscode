import fs from "fs/promises";
import path from "path";
import { buildRecordPayload } from "./helpers.js";

export class JsonStore {
  constructor(filePath) {
    this.filePath = filePath;
  }

  async init() {
    await fs.mkdir(path.dirname(this.filePath), { recursive: true });
    try {
      await fs.access(this.filePath);
    } catch (_) {
      await fs.writeFile(this.filePath, "[]", "utf8");
    }
  }

  async #readAll() {
    const raw = await fs.readFile(this.filePath, "utf8");
    const parsed = JSON.parse(raw || "[]");
    return Array.isArray(parsed) ? parsed : [];
  }

  async #writeAll(records) {
    await fs.writeFile(this.filePath, JSON.stringify(records, null, 2), "utf8");
  }

  async list() {
    const records = await this.#readAll();
    return records.sort((a, b) => String(b.createdAt).localeCompare(String(a.createdAt)));
  }

  async create(input) {
    const records = await this.#readAll();
    const used = new Set(records.map((it) => it.codepoint));
    const record = buildRecordPayload(input, used);
    records.unshift(record);
    await this.#writeAll(records);
    return record;
  }

  async remove(id) {
    const records = await this.#readAll();
    const next = records.filter((it) => it.id !== id);
    const deleted = next.length !== records.length;
    if (deleted) await this.#writeAll(next);
    return deleted;
  }

  async replaceAll(records) {
    const list = Array.isArray(records) ? records : [];
    await this.#writeAll(list);
    return list.length;
  }
}
