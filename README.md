# Creme Bakery · Scope of Work

A small website that shows the client what is being worked on for the Creme Bakery website: what's done, in progress, waiting, planned, and under research. Visitors can only view and comment; the owner logs in to add and edit data. The interface is in Bahasa Indonesia.

**Stack:** Next.js 16 (App Router, Server Actions) · TypeScript · Tailwind CSS 4 · Drizzle ORM · Postgres on Supabase · hosted on Vercel.

## Pages

| Path | What it shows |
|---|---|
| `/` Ringkasan | Counts, this month's scope progress, in-progress and waiting tasks (with "waiting for N days"), recently done, latest comments |
| `/linimasa` Linimasa | Gantt-style timeline per month or week, grouped by monthly scope, with a "today" line |
| `/tugas` Tugas | All tasks with filters (status, type, scope, month, search) |
| `/tugas/[id]` | Task detail: description, waiting info, research question/finding, impact note, hours, screenshots, comments, status history |
| `/lingkup` Lingkup | Monthly scope items and their progress |
| `/jam` Jam kerja | Hours per month, per task, per type and per day |
| `/catatan` Catatan | Decision log / notes |
| `/masuk` | Owner login (not linked in the menu on purpose) |

Status history is recorded automatically every time a task's status changes. That's where "waiting for N days" and the history list come from.

---

## 1. Create the database (Supabase)

1. Go to [supabase.com](https://supabase.com), create a free project. Pick the **Singapore** region (closest to Indonesia).
2. Open **Project Settings → Database → Connection string**, choose **Transaction pooler** (port `6543`) and copy it. Replace `[YOUR-PASSWORD]` with your database password. This is your `DATABASE_URL`.
3. *(Optional, for screenshots)* Open **Storage → New bucket**, name it `lampiran`, and tick **Public bucket**. Then copy the **Project URL** and the **service_role** key from **Project Settings → API**. Keep the service_role key secret; it only ever lives in environment variables.

## 2. Run it locally

You need Node.js 20.9 or newer.

```bash
npm install
cp .env.example .env.local     # on Windows: copy .env.example .env.local
```

Fill in `.env.local`:

| Variable | Value |
|---|---|
| `DATABASE_URL` | Supabase transaction pooler URL from step 1 |
| `OWNER_USERNAME` | Your login name |
| `OWNER_PASSWORD` | A strong password |
| `SESSION_SECRET` | 32+ random characters. Generate with `node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"` |
| `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, `SUPABASE_BUCKET` | Optional. Leave empty to hide screenshot uploads |

Create the tables, then start the dev server:

```bash
npm run db:migrate
npm run dev
```

Open http://localhost:3000, then go to http://localhost:3000/masuk to log in.

## 3. Deploy to Vercel

1. Push this folder to a GitHub repository (`.env.local` is git-ignored, so your secrets stay local).
2. In Vercel: **Add New → Project**, import the repository. The framework is detected automatically.
3. Under **Environment Variables**, add the same variables as in `.env.local`.
4. Click **Deploy**.

Migrations are not run during the Vercel build. Run `npm run db:migrate` from your computer whenever the schema changes (it reads `DATABASE_URL` from `.env.local`).

Share the Vercel URL with your client. Pages are public but marked `noindex`, so they won't show up on Google.

## Everyday use

- **New monthly goals:** Lingkup → pick the month → *Tambah lingkup*.
- **New task:** *+ Tugas baru*. Give it a start date and/or due date so it appears on the timeline.
- **Blocked on someone:** set status to *Menunggu* and fill in who and what. The overview shows how many days it's been waiting.
- **Log hours:** on the task page, under *Jam kerja* (decimal comma works, e.g. `1,5`).
- **Comments:** visitors type their name and comment. As owner you can hide or delete any comment, and your replies are marked *Pengembang*.

## Security notes

- The owner login is checked against `OWNER_USERNAME` / `OWNER_PASSWORD`. A successful login sets a signed, httpOnly cookie that lasts 30 days.
- To log out everywhere (e.g. after sharing your laptop), change `SESSION_SECRET` in Vercel and redeploy.
- Every create/edit/delete server action checks the owner cookie on the server, so visitors can't call them directly.
- Comment spam protection: a hidden "website" field that bots fill in (those comments are dropped silently), and a limit of 5 comments per visitor per 10 minutes. Visitor IPs are stored only as a salted hash.

## Changing the database

1. Edit `src/db/schema.ts`.
2. `npm run db:generate` creates a new SQL file in `drizzle/`.
3. `npm run db:migrate` applies it.

## Project structure

```
src/
  app/            pages (one folder per URL) and actions.ts (all data changes)
  components/     header, forms and small UI pieces
  db/             schema.ts (tables) and the database client
  lib/            auth, dates (WIB timezone), labels, queries, storage
drizzle/          generated SQL migrations
scripts/          migrate.ts
```
