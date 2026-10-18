# ExamHall — Online Test Platform

Timed multiple-choice tests with a question palette, mark-for-review, instant marking (practice mode),
automatic submission, a score report and a full answer review.
**180 real questions** (Management Accounting: chapter 1 + Ratio Analysis) were extracted from the supplied PDF, pages 1–50.

| Layer    | Tech                                                  |
|----------|-------------------------------------------------------|
| Frontend | React 18, Vite 6, Tailwind CSS 4, React Router 6, lucide-react |
| Backend  | Node.js (>= 18.18), Express 4, better-sqlite3, helmet, cors, dotenv |
| Database | **SQLite** (single file, created and seeded automatically) |

## Run locally

Two terminals.

```bash
# 1) Backend  ->  http://localhost:5000
cd backend
cp .env.example .env        # Windows: copy .env.example .env
npm install
npm run dev
```

```bash
# 2) Frontend  ->  http://localhost:5173
cd frontend
cp .env.example .env        # Windows: copy .env.example .env
npm install
npm run dev
```

On first start the backend creates `backend/data/examhall.db` and loads the 7 tests / 180 questions.
Open http://localhost:5173. Admin panel: http://localhost:5173/admin (use the `ADMIN_KEY` from `backend/.env`).

Reload the sample data any time: `cd backend && npm run seed:reset` (deletes all results).

Tests: `cd backend && npm test` (scoring logic) and `cd frontend && npm test` (palette/timer formatting).

## Environment variables

`backend/.env`

| Name | Example | Purpose |
|------|---------|---------|
| `PORT` | `5000` | Port (Render sets this itself) |
| `CLIENT_URL` | `http://localhost:5173` | Allowed frontend origin(s) for CORS, comma-separated, no trailing slash |
| `DB_PATH` | `./data/examhall.db` | SQLite file location |
| `ADMIN_KEY` | long random string | Password for the admin panel (`x-admin-key` header) |

`frontend/.env`

| Name | Example | Purpose |
|------|---------|---------|
| `VITE_API_URL` | `http://localhost:5000/api` | Backend base URL **including `/api`** |

`.env` files are git-ignored; commit only the `.env.example` files.

## How the exam works

* **Start** – the student enters a name, picks *Exam* or *Practice* mode and ticks the instructions checkbox.
  The server creates an *attempt* and returns `endsAt`; the browser stores an absolute `endTime`.
* **Timer** – every tick computes `endTime - Date.now()`, so re-renders, throttled background tabs and
  refreshes never reset or drift it. It re-syncs on tab focus. Warning banners at 5:00 and 1:00; at 0 the test auto-submits (no modal).
* **Persistence** – answers, review marks, visited flags and the current question are saved to `localStorage`
  on every change; a refresh resumes exactly where you were. The browser Back button is blocked during the test.
* **Practice mode** – each answer is checked by the server immediately (green/red + explanation) and then locked;
  a running "x/y correct" appears in the header. Exam mode reveals everything after submitting.
  Correct answers are never sent to the browser while a test is running.
* **Submit** – confirmation modal (answered / unanswered / marked). The request is guarded against double clicks, retried on
  network failure, and is idempotent on the server (one result per attempt).
* **Time tracking** – the time spent on every question is recorded while the exam tab is visible (a small stopwatch chip on each
  question shows it live; switching tabs pauses it). It is saved with the session, survives refreshes, and is sent with the submission.
* **Result** – marks, percentage, correct / wrong / unanswered, accuracy, total time taken, circular score indicator, a
  **Time invested** section (average, longest and quickest question plus a bar per question) and a filterable review where each
  question shows the time you spent on it.

## Project structure

```
backend/
  src/
    server.js            entry point (starts server, seeds empty DB)
    app.js               express app: helmet, CORS, JSON, routes, errors
    config/env.js        environment parsing
    db/database.js       SQLite connection + schema
    db/seed.js           loads src/data/questions.json into tests/questions
    data/questions.json  the 180 questions extracted from the PDF
    models/              SQL access (tests, questions, attempts, results)
    controllers/         request handlers
    routes/index.js      REST routes
    middleware/          validation, admin auth, error handler
    utils/scoring.js     pure result calculation (+ unit tests)
frontend/
  src/
    pages/               Landing, Instructions, Exam, Result, Admin
    components/          Timer, QuestionCard, OptionList, QuestionPalette, drawer, modals, review list, admin forms
    hooks/               useCountdown, useExamSession, useSubmit, useFetch
    services/api.js      API client (timeouts, friendly errors)
    utils/               palette status logic, formatting, session storage
```

## Database (SQLite)

`tests` · `questions` (options stored as JSON, `correct_index`) · `attempts` (server start/end time, mode) · `results`
(answers, score, counts, percentage, total time taken, immutable review snapshot that includes seconds spent per question).
A student/user table is intentionally omitted: students identify themselves by name per attempt.

## API

| Method | Path | Notes |
|--------|------|-------|
| GET | `/api/health`, `/api/stats` | |
| GET | `/api/tests` | active tests with question count and total marks |
| GET | `/api/tests/:id` | test + questions **without answers** |
| POST / PUT / DELETE | `/api/tests`, `/api/tests/:id` | admin: duration, marks, negative marking, visibility |
| GET | `/api/questions?testId=` | admin: list with answers |
| POST / PUT / DELETE | `/api/questions`, `/api/questions/:id` | admin CRUD |
| POST | `/api/attempts` | `{testId, studentName, mode}` -> starts the clock |
| GET | `/api/attempts/:id` | validate/resume an attempt |
| POST | `/api/questions/:id/check` | practice mode only: `{attemptId, selectedIndex}` |
| POST | `/api/results` | `{attemptId, answers, timeSpent, autoSubmitted}` -> scores and stores (idempotent); `timeSpent` is `{questionId: seconds}` |
| GET | `/api/results/:attemptId` | stored result with review |

Admin routes need the header `x-admin-key: <ADMIN_KEY>`.

## Deploy

### 1. Backend on Render (Web Service)

1. Push this repo to GitHub.
2. Render -> **New + -> Web Service** -> pick the repo.
3. **Root Directory** `backend` · **Runtime** Node · **Build Command** `npm install` · **Start Command** `npm start`
4. Environment variables:
   * `CLIENT_URL` = your Vercel URL, e.g. `https://examhall.vercel.app` (no trailing slash; add comma-separated extras if needed)
   * `ADMIN_KEY` = a long random string
   * `NODE_ENV` = `production`
   * `DB_PATH` = `/var/data/examhall.db` **if you attach a disk** (see below)
   * Do not set `PORT` — Render provides it.
5. Deploy, then check `https://<service>.onrender.com/api/health`.

> **SQLite on Render:** the free filesystem is wiped on every deploy/restart. The questions are re-seeded automatically, so
> the app always works, but stored **results are lost**. To keep them, use a paid instance and add a **Disk** mounted at
> `/var/data`, with `DB_PATH=/var/data/examhall.db`. Admin edits to questions are also kept only with a disk.
> Free instances also sleep after inactivity, so the first request can take ~30–60 s.

### 2. Frontend on Vercel

1. Vercel -> **Add New -> Project** -> import the repo.
2. **Root Directory** `frontend` · **Framework** Vite · **Build Command** `npm run build` · **Output Directory** `dist`
3. Environment variable: `VITE_API_URL` = `https://<service>.onrender.com/api`
4. Deploy. `frontend/vercel.json` rewrites all routes to `index.html` so refreshing `/exam` or `/result/...` works.

### 3. Connect them

Vercel frontend --(`VITE_API_URL`)--> Render backend --(`DB_PATH`)--> SQLite file.
After the first Vercel deploy, copy its URL into Render's `CLIENT_URL` and redeploy the backend (CORS). Redeploy the
frontend whenever you change `VITE_API_URL`, because Vite bakes it in at build time.

## Troubleshooting

| Problem | Fix |
|---------|-----|
| Browser shows "Unable to reach the server" | Backend not running, wrong `VITE_API_URL`, or the URL is missing `/api` |
| CORS error in console | `CLIENT_URL` must exactly equal the page origin (scheme + host, no trailing slash); restart the backend |
| `better-sqlite3` install fails | Use Node 18.18+ (20 or 22 recommended); delete `node_modules` and reinstall |
| Admin says "Admin access is disabled" | Set `ADMIN_KEY` in `backend/.env` and restart |
| 404 on refresh in production | Make sure `frontend/vercel.json` is deployed |
| Results disappear on Render | Free filesystem is ephemeral — attach a Disk and set `DB_PATH` |
| Port 5000 busy (macOS AirPlay) | Change `PORT` and `VITE_API_URL` |

## Content notes

Source: a scanned question bank, read page by page. About a dozen questions whose printed answer key was invalid or unreliable
(no correct option, inconsistent figures, truncated options, or a key that contradicts the standard formula) were left out so
students are never marked wrongly. Extraction stopped at page 50 as requested; more questions can be added from `/admin`.

## Mock tests, accounts and login history

- **25 mock tests** ("Mock Test 1" … "Mock Test 25"), 100 questions with 4 options each, are created automatically on first start from `backend/src/data/mock_tests.json` (idempotent – existing tests are never overwritten, so admin edits survive).
- **Marking:** +1 correct, −0.25 wrong, 0 unattempted, max 100. Results (score, counts, time taken, per-question review with correct answers) are saved per attempt, so each test is independent and can be retaken.
- **Accounts:** students must sign up / log in to take tests. Passwords are hashed with scrypt; login tokens are stored hashed (30-day expiry); failed logins are rate-limited.
- **History:** every signup, login, logout and failed login is saved in the `login_history` table (with IP and device) and shown on the **My account** page next to the user's saved results.
- **Timer:** the exam header shows time left and time elapsed.
- New env vars: `SESSION_DAYS`, `MOCK_DURATION_MINUTES` (see `backend/.env.example`).
- Answer-key caveats are listed in `backend/KEY_REVIEW.md`.
- **Render:** the free disk is ephemeral – users, login history and results are lost on redeploy unless you attach a persistent disk and set `DB_PATH=/var/data/examhall.db`.
