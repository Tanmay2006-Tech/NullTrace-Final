# Deploying NullTrace

## Option 1 — Vercel (Frontend) + Railway (Backend)

This is the recommended setup for a full production deployment.

### Backend on Railway

1. Go to [railway.app](https://railway.app) → New Project → Deploy from GitHub
2. Select this repo, set the root directory to `artifacts/api-server`
3. Add these environment variables in Railway:
   ```
   DATABASE_URL=postgresql://...   ← Railway Postgres or Neon
   GROQ_API_KEY=gsk_...
   SESSION_SECRET=...
   PORT=8080
   ```
4. Railway will auto-detect the `package.json` and deploy. Note your Railway URL (e.g. `https://nulltrace-api.railway.app`).

### Frontend on Vercel

1. Go to [vercel.com](https://vercel.com) → New Project → Import from GitHub
2. Set these in Vercel project settings → Environment Variables:
   ```
   VITE_API_URL=https://nulltrace-api.railway.app
   BASE_PATH=/
   NODE_ENV=production
   ```
3. Build settings (auto-detected from `vercel.json`):
   - Build Command: `pnpm --filter @workspace/nulltrace run build`
   - Output Directory: `artifacts/nulltrace/dist/public`
   - Install Command: `pnpm install`

---

## Option 2 — Vercel (Fullstack with Serverless API)

> Coming soon — requires wrapping Express routes as Vercel serverless functions.

---

## Option 3 — Replit Deployments (Easiest)

Click **Deploy** in the Replit header. Replit handles everything:
- TLS / HTTPS
- Auto-scaling
- Environment secrets already configured
- Custom domain support

---

## Database Setup

After deploying, run the schema migration once:

```bash
# From local dev or Railway shell
pnpm --filter @workspace/db run push
```

This creates all tables. The app auto-seeds demo data on first run.

---

## Environment Variables Reference

| Variable        | Required | Description                                      |
|-----------------|----------|--------------------------------------------------|
| `DATABASE_URL`  | ✅        | PostgreSQL connection string                     |
| `GROQ_API_KEY`  | ✅        | Groq API key for LLM (llama-3.3-70b)            |
| `SESSION_SECRET`| ✅        | Secret for session signing                        |
| `PORT`          | ✅        | Server port (default: 8080)                      |
| `BASE_PATH`     | ✅        | Frontend base path (default: /)                  |
| `NODE_ENV`      | ✅        | `development` or `production`                    |
