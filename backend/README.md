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

## Endpoints
- `GET /health` — simple status.
- `POST /api/chat` — forwards chat messages to OpenAI.
  - Body:
    ```json
    {
      "model": "gpt-4o-mini",
      "messages": [
        { "role": "system", "content": "You format CSV rows." },
        { "role": "user", "content": "Build entries for..." }
      ],
      "temperature": 0.2
    }
    ```
  - Response includes the chosen message plus model/usage metadata.
