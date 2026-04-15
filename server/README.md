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

## Collaborative mode (PostgreSQL + WebSocket)

Set env vars before running:

```bash
# Windows PowerShell
$env:STORAGE_MODE="postgres"
$env:DATABASE_URL="postgres://username:password@localhost:5432/your_db"
$env:JWT_SECRET="replace-with-a-strong-random-string"
$env:JWT_EXPIRE="7d"
npm run dev
```

### Auth APIs

- `POST /api/auth/register` body: `{ email, password, displayName? }`
- `POST /api/auth/login` body: `{ email, password }`
- `GET /api/auth/me` header: `Authorization: Bearer <token>`

### Collaborative Book APIs

- `GET /api/collab/books`
- `POST /api/collab/books` body: `{ name, payload }`
- `GET /api/collab/books/:id`
- `PUT /api/collab/books/:id` body: `{ name?, payload, baseVersion? }`
- `POST /api/collab/books/:id/share` body: `{ email, role }` role=`viewer|editor`

All collab APIs require `Authorization: Bearer <token>`.

### WebSocket

Connect URL:

`ws://localhost:3000/ws?token=<jwt>`

Client messages:

- `{"type":"subscribe","bookId":"..."}`
- `{"type":"update_book","bookId":"...","payload":{...},"name":"...","baseVersion":1}`

Server events:

- `{"type":"subscribed","bookId":"...","book":{...}}`
- `{"type":"book_updated","bookId":"...","book":{...}}`
- `{"type":"error","message":"..."}`

## Open pages

- `http://localhost:3000/index.html`
- `http://localhost:3000/glyph-maker.html`
