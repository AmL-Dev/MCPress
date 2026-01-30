# Deploying MCPress on Vercel

This repo is a **monorepo**: the Next.js app lives in `frontend/`. Vercel must use that folder as the project root, otherwise you get a **404: NOT_FOUND**.

## 1. Set the Root Directory (required)

1. Open your project on [Vercel](https://vercel.com).
2. Go to **Settings** → **General**.
3. Under **Root Directory**, click **Edit**.
4. Set it to **`frontend`** (no leading slash).
5. Save.

## 2. Environment variables

In **Settings** → **Environment Variables**, add the variables from `frontend/.env.example`. For production, set at least:

| Variable | Production example |
|----------|---------------------|
| `NEXT_PUBLIC_APP_URL` | `https://mc-press.vercel.app` (your Vercel URL) |
| `NEXT_PUBLIC_API_URL` | Your backend API URL (e.g. a deployed backend or Supabase) |
| `OPENAI_API_KEY` | Your OpenAI API key (if using chat) |

Add any others you use (e.g. `MCP_SERVER_URL`, `NEXT_PUBLIC_USE_MOCK`).

## 3. Redeploy

After changing the Root Directory and env vars:

- **Deployments** → open the **⋯** on the latest deployment → **Redeploy**, or
- Push a new commit to trigger a new deployment.

The app should then be available at your Vercel URL (e.g. `https://mc-press.vercel.app`).

## Note on the backend

The **backend** (Python/FastAPI in `backend/`) is not run on Vercel. Deploy it elsewhere (e.g. Railway, Render, Fly.io) and set `NEXT_PUBLIC_API_URL` to that URL. For local-only or mock mode, you can set `NEXT_PUBLIC_USE_MOCK=true`.
