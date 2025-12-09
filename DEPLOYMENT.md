# Deployments

## Vercel (frontend + backend)

### Backend API (serverless)
- Root Directory: `backend` (no `vercel.json` needed). Vercel mounts the Express app through the catch-all handler in `backend/api/[...all].ts`.
- Install Command: `npm install` (workspace install). Build Command: none required for the function—Vercel compiles the TypeScript handler.
- Routes: served under `/api/*` (e.g. `/api/health`, `/api/translations`, `/api/cards-generate`).
- Environment: `OPENAI_API_KEY` or `GEMINI_API_KEY` (at least one), optional `ALLOWED_ORIGINS`, `RATE_LIMIT_ENABLED`, `UPSTASH_REDIS_REST_URL`, `UPSTASH_REDIS_REST_TOKEN`. `PORT` is local-only.
- Node runtime: project engines expect modern Node (>=24); pick the newest runtime available in Vercel.

### Frontend app
- Root Directory: `frontend` (uses `frontend/vercel.json` for static build + SPA fallback).
- Build Command: `npm install && npm run build`.
- Output: `dist`.
- Environment: `VITE_API_BASE_URL` pointing to the backend base URL (e.g. `https://<backend-project>.vercel.app` or `http://localhost:3001` for local dev).

### Local development
1) Install dependencies at the repo root: `npm install`.
2) Start backend API: `npm run dev:local --workspace backend` (requires `backend/.env` with an LLM API key).
3) Start frontend: `npm run dev --workspace frontend` with `VITE_API_BASE_URL=http://localhost:3001`.
4) API routes are available at `http://localhost:3001/api/*` (health, translations, card generation).
