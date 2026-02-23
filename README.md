# Pitchdeck NC

Refactored into a multi-file app with:

- Viewer: `http://localhost:3000/`
- Admin: `http://localhost:3000/admin`
- Env-based admin login (`.env`)

## Setup

1. Copy `.env.example` to `.env`
2. Set `ADMIN_USERNAME`, `ADMIN_PASSWORD`, `SESSION_SECRET`
3. Run `npm run dev`

## Structure

- `server.js`: static server + auth + deck API
- `public/viewer.html`: read-only slide viewer
- `public/admin.html`: login + deck editor
- `public/assets/css/*`: tokens/base/components/page styles
- `public/assets/js/*`: shared API/utils + viewer/admin scripts
- `data/deck.json`: persisted deck data

