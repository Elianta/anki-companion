# Backend API

Small Express server that proxies OpenAI chat requests for the monorepo.

## Setup

- Copy `.env.example` to `.env` and set at least one of `OPENAI_API_KEY` or `GEMINI_API_KEY`. Default provider/model: `googleai` / `gemini-3.5-flash-lite`.
- (Optional) Enable rate limiting with Upstash Redis: set `UPSTASH_REDIS_REST_URL`, `UPSTASH_REDIS_REST_TOKEN`, and `RATE_LIMIT_ENABLED=true` (forced off when `NODE_ENV=development`).
- LLM provider/model are selected per-request from the frontend; the server falls back to the defaults above when a provider/model is not supplied or not configured.
- From repo root, install dependencies (already in workspace): `npm install`.

## Run

- Dev (auto-reload TS): `npm run dev:local --workspace backend`
- Build: `npm run build --workspace backend`
- Production (after build): `npm run start --workspace backend`
- Tests: `npm test --workspace backend`

Server defaults to `PORT=3001`. Configure CORS origins via `ALLOWED_ORIGINS` (comma-separated).

## Vercel deployment (serverless)

- Root directory: `backend` (no `vercel.json` needed). Vercel mounts the Express app via the catch-all handler in `api/[...all].ts`. Vercel catches only first level routes.
- Install command: `npm install` (workspace install). No separate build command is required for the serverless function.
- Requests are served under `/api/*` (e.g. `/api/health`, `/api/translations`, `/api/cards-generate`).
- Env vars: `OPENAI_API_KEY` or `GEMINI_API_KEY` (at least one), optional `ALLOWED_ORIGINS`, `RATE_LIMIT_ENABLED`, `UPSTASH_REDIS_REST_URL`, `UPSTASH_REDIS_REST_TOKEN`.

## Endpoints

- `GET /api/health` — simple status.
- `POST /api/translations` — returns a translation entry for a term.
  - Body: `{ "rawInput": "zamek [do drzwi]", "sourceLanguage": "pl" }`
- `POST /api/cards-generate` — builds an Anki card payload for a draft.
  - Body: `{ "draft": { "term": "...", "language": "PL", "noteType": "PL: Default", "sense": { ... } } }`

## Rate limiting

- A global Express middleware enforces a sliding window limit of 20 requests per minute per client IP when `RATE_LIMIT_ENABLED=true` and Upstash Redis credentials are provided.
- Rate limiting is always disabled when `NODE_ENV=development`.
- Responses include standard `Retry-After` and `X-RateLimit-*` headers. A `429` JSON error includes `retryAfterSeconds` for frontend messaging.
