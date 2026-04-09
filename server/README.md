# Glyph API (json + postgres)

This backend serves both static pages and glyph APIs.

## 1) Install

```bash
cd server
npm install
```

## 2) Run in JSON mode (easy start)

```bash
# Windows PowerShell
$env:STORAGE_MODE="json"
npm run dev
```

Data file: `server/data/glyph-records.json`

## 3) Run in PostgreSQL mode (real backend)

```bash
# Windows PowerShell
$env:STORAGE_MODE="postgres"
$env:DATABASE_URL="postgres://username:password@localhost:5432/your_db"
npm run dev
```

The service will auto-create table `glyph_records`.

## API

- `GET /api/health`
- `GET /api/glyphs`
- `POST /api/glyphs`
- `DELETE /api/glyphs/:id`
- `POST /api/glyphs/import`

## Open pages

- `http://localhost:3000/index.html`
- `http://localhost:3000/glyph-maker.html`
