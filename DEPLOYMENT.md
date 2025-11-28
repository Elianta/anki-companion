# Vercel deployment (monorepo with two projects)

## Projects
- Frontend project: root directory `frontend`, config `frontend/vercel.json`. Uses static build (Vite) with SPA fallback to `index.html`.
- Backend project: root directory `backend`, config `backend/vercel.json`. Serves the Express app as a serverless function via `api/[[...path]].ts`; `/health` is forwarded to `/api/health`.

## Environment variables
Set in each Vercel project (Production, Preview, Development).

Backend project:
- `OPENAI_API_KEY` (required): API key for translation and card-generation routes.
- `ALLOWED_ORIGINS` (optional): Comma-separated list of allowed origins for CORS, e.g. `https://anki-pwa.vercel.app,https://anki-api.vercel.app`.
- `PORT` (local only): Port for `npm run dev --workspace backend` (defaults to `3001`).

Frontend project:
- `VITE_API_BASE_URL`: Base URL for API calls. Set to the backend project’s deployed URL (e.g. `https://anki-api.vercel.app`) or a custom API domain. For local development use `http://localhost:3001`.

## Local development
1) Install dependencies at the repo root: `npm install`.
2) Start backend API: `npm run dev --workspace backend` (requires `OPENAI_API_KEY` in `backend/.env`).
3) Start frontend: `npm run dev --workspace frontend` with `VITE_API_BASE_URL=http://localhost:3001` in `frontend/.env` (or export in shell).

## Deploying on Vercel (per project)
1) Create two Vercel projects pointing at the same repo:
   - Frontend: Root Directory `frontend` (uses `frontend/vercel.json`).
   - Backend/API: Root Directory `backend` (uses `backend/vercel.json`).
2) Add the environment variables above to each project. Set the backend project’s Node.js version to 20 in Vercel settings.
3) Deploy. Frontend builds with `npm run build` in `frontend`, backend serves via `api/[[...path]].ts`. SPA routes are rewritten to `index.html` in the frontend project; `/health` is forwarded to `/api/health` in the backend project.
