# Daybook

A calm work log for people who get asked "what did you do today?"

Write a short report per project each day, keep your to-dos and notes next to it, and share any day, week or month as a ready-to-paste summary.

**English** · [Türkçe](README.tr.md)

## Features

- **Daily reports** — pick a day on the calendar and write what you did on each project, with the hours you spent.
- **To-dos** — per-project task lists with due dates. Mark a task as waiting on someone else. Completed tasks are added to that day's report.
- **Notes and plans** — free-form notes, attached to a project or general.
- **Time summary** — weekly and monthly totals by project and by day.
- **Share** — export a day, week, month or custom range as WhatsApp text, Markdown or PDF.
- **Accounts** — sign up with just a username and password, or continue with GitHub. Everyone sees only their own records.
- **GitHub import (optional)** — add your repositories as projects. Only the names are read.
- **Turkish and English**, light and dark theme.

## Stack

| Layer | Technology |
|---|---|
| Frontend | Next.js (App Router), React, Tailwind CSS, shadcn/ui |
| Backend | FastAPI (`api/index.py`) |
| Database and auth | Supabase (Postgres with row-level security) |
| Hosting | Vercel (the FastAPI app runs as a Python function in the same project) |

Sign-in happens in the browser through Supabase Auth. Reads and writes go through the FastAPI backend, which forwards the user's session token to Supabase. Row-level security therefore applies to every request and no secret key is needed anywhere.

## Run locally

Requirements: Node.js 20+ and Python 3.10+.

```bash
npm install
pip install -r requirements.txt
npm run dev
```

Open `http://localhost:3210`. `npm run dev` starts the web app (port 3210) and the FastAPI backend (port 8210) together.

With no configuration the app asks for no sign-in and stores everything in `data/gunluk.json` on your machine. Python is not needed in this mode.

## Accounts and cloud storage (Supabase)

1. Create a Supabase project.
2. In the SQL Editor, run `supabase/kurulum.sql`.
3. Under Authentication → Sign In / Providers → Email, turn off **Confirm email**. Username sign-up needs this, because no real email address is collected.
4. Copy `.env.example` to `.env.local` and fill in `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY`. Use the publishable (anon) key, never the secret key.
5. Under Authentication → URL Configuration, set the Site URL and add your app's address to Redirect URLs (`http://localhost:3210` and your deployed URL).

The app now asks for sign-in. Since no email is collected, a forgotten password can only be reset from the Supabase dashboard (Authentication → Users).

### Continue with GitHub

1. GitHub → Settings → Developer settings → OAuth Apps → New OAuth App.
   - Authorization callback URL: `https://<project-ref>.supabase.co/auth/v1/callback`
2. Supabase → Authentication → Sign In / Providers → GitHub: enable it and paste the Client ID and Client Secret.

## Deploy to Vercel

1. Import the repository in Vercel (framework: Next.js).
2. Add `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` as environment variables.
3. Deploy, then add the deployed URL to Supabase's Site URL and Redirect URLs.

`api/index.py` is deployed automatically as a Python function; no separate server is required. `https://<your-app>/api/py/health` should return `{"ok": true, "supabase": true}`.

## API

| Method | Path | Description |
|---|---|---|
| GET | `/api/py/health` | Health check |
| GET | `/api/py/state` | Records of the signed-in account |
| PUT | `/api/py/state` | Save the records of the signed-in account |

Both `state` endpoints expect `Authorization: Bearer <Supabase access token>`. Interactive docs are at `/api/py/docs`.

## Project layout

```
api/index.py          FastAPI backend
src/app/              Next.js pages and the local-file API routes
src/components/app/   Screens: reports, to-dos, notes, time summary, sign-in
src/components/ui/    shadcn/ui components
src/lib/              State store, i18n, dates, report export
supabase/kurulum.sql  Table and row-level security policies
```
