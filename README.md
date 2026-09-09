# RupeeWise — Expense Tracker

A simple, minimal, premium expense tracker for India. React frontend, Node.js/Express API,
MongoDB storage, INR (₹) throughout. Every button works: full CRUD, search, filters, sorting,
pagination, CSV export, category drill-downs, charts and a responsive mobile layout.

## Features

- **Dashboard** — total expenses, this-month spend with last-month trend, average, 6-month
  spending trend chart, category donut, recent transactions
- **Transactions** — search (title/note), category filter, from/to date range, sortable columns,
  pagination, CSV export of the current view
- **Add / Edit / Delete** — validated modal form + confirm dialogs and toast feedback
- **Categories** — per-category totals, counts, share bars; click a card to drill into its transactions
- **Settings** — editable profile, database status, full CSV export, delete-all with confirmation
- **Production-ready** — security headers (helmet), gzip, request logging, Zod validation,
  central error handling, health check, Docker + CI, unit tests

## Quick start

```bash
cp .env.example .env        # set MONGODB_URI (or use the memory demo below)
npm install
npm run dev                 # API :5000 + client :5173
```

Open `http://localhost:5173`.

No MongoDB handy? For an **ephemeral local demo only**:

```bash
ALLOW_MEMORY_DB=true npm run dev
```

Memory mode is disabled in production — set `MONGODB_URI` there.

Optional demo data:

```bash
npm run seed -- --clear
```

## Production

```bash
npm ci
npm run build
NODE_ENV=production MONGODB_URI="mongodb+srv://..." npm start
```

The Express process serves both the API and the compiled React client.
Health check: `GET /api/health`.

### Docker

```bash
docker compose up --build   # app on :5000 + MongoDB
```

### Deploy

- **Render/Railway/Fly.io**: use the included `Dockerfile` (or `render.yaml`), set `MONGODB_URI`
  to a MongoDB Atlas cluster.
- Any Node 20+ host works: `npm ci && npm run build && npm start`.

## API

| Method | Path | Description |
|---|---|---|
| GET | `/api/health` | Status, DB mode, expense count |
| GET | `/api/categories` | Category taxonomy |
| GET | `/api/stats` | Totals, monthly + per-category aggregates |
| GET | `/api/expenses?search=&category=&from=&to=&sort=&order=&page=&limit=` | Paginated list |
| POST | `/api/expenses` | Create (`title, amount, category, date, note?`) |
| PUT | `/api/expenses/:id` | Update |
| DELETE | `/api/expenses/:id` | Delete |
| DELETE | `/api/expenses?confirm=all` | Delete all |
| GET | `/api/expenses/export.csv?...filters` | CSV download |

## Tests

```bash
npm test    # node:test — validation + repository (in-memory) suites
```

## Tech

React 18 · Vite · Recharts · Express 4 · Mongoose 8 · Zod · DM Sans UI
