# Backend API

Small Express server that proxies OpenAI chat requests for the monorepo.

## Setup
- Copy `.env.example` to `.env` and set `OPENAI_API_KEY`.
- From repo root, install dependencies (already in workspace): `npm install`.

## Run
- Dev (auto-reload TS): `npm run dev --workspace backend`
- Build: `npm run build --workspace backend`
- Production (after build): `npm run start --workspace backend`
- Tests: `npm test --workspace backend`

Server defaults to `PORT=3001`. Configure CORS origins via `ALLOWED_ORIGINS` (comma-separated).

## Netlify deployment (serverless)
- Base directory: `backend`
- Build command: `npm install && npm run build`
- Functions directory: `netlify/functions`
- Publish directory: `dist` (unused, required by Netlify)
- Redirects (already in `netlify.toml`): `/api/*` → `/.netlify/functions/api/:splat`, `/health` → `/.netlify/functions/api/health`
Set `OPENAI_API_KEY` and optional `ALLOWED_ORIGINS` in the Netlify site environment. The API is exposed via the `/.netlify/functions/api` function wrapped with `serverless-http`.

## Endpoints
- `GET /health` — simple status.
- `POST /api/translations` — returns a translation entry for a term.
  - Body: `{ "rawInput": "zamek [do drzwi]", "sourceLanguage": "pl" }`
- `POST /api/cards/generate` — builds an Anki card payload for a draft.
  - Body: `{ "draft": { "term": "...", "language": "PL", "noteType": "PL: Default", "sense": { ... } } }`
