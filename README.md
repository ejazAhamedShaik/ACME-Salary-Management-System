# ACME Salary Management System

A web app for an HR Manager to manage salary records for 10,000 employees across
multiple countries, and answer aggregate questions about org-wide pay — replacing
a spreadsheet-based workflow. See `REQUIREMENTS.md` for full scope and
`ARCHITECTURE.md` for the design decisions behind the stack below.

## Tech stack

- **Backend:** Node.js + TypeScript + Express, SQLite via `better-sqlite3` +
  Drizzle ORM
- **Frontend:** React + Vite + TypeScript, React Router, Ant Design v6
- **Testing:** Vitest on both sides (backend also uses Supertest; frontend also
  uses React Testing Library + jest-dom)
- **Package manager:** npm

`backend/` and `frontend/` are independent projects with their own
`package.json`, coupled only through the HTTP API.

## Running locally

### Backend

```bash
cd backend
npm install
cp .env.example .env   # defaults work as-is for local dev
npm run dev            # starts the API on http://localhost:3000
```

On first startup the server creates the SQLite schema and, if the `employees`
table is empty, automatically seeds 10,000 deterministic employee records. This
also means a fresh clone or a redeploy with a reset disk always comes back up
in a working, demoable state with no manual step.

Confirm it's running:

```bash
curl http://localhost:3000/health
# {"status":"ok"}
```

Other backend scripts:

```bash
npm run build        # compile TypeScript to dist/
npm start             # run the compiled server (dist/server.js)
npm run seed          # run the seed script standalone (applies migrations + seeds)
npm run db:generate   # regenerate Drizzle migration SQL after a schema change
npm test              # run the Vitest suite
```

### Frontend

```bash
cd frontend
npm install
cp .env.example .env   # points VITE_API_BASE_URL at the local backend
npm run dev            # starts the app on http://localhost:5173
```

Other frontend scripts:

```bash
npm run build     # production build
npm run preview   # preview the production build locally
npm test          # run the Vitest suite
```

## Docs

- [`REQUIREMENTS.md`](./REQUIREMENTS.md) — scope and explicit non-goals
- [`ARCHITECTURE.md`](./ARCHITECTURE.md) — design decisions and trade-offs
- [`CLAUDE.md`](./CLAUDE.md) — conventions for AI-assisted development on this
  repo (TDD workflow, commit style, docs policy)
- [`docs/erd.md`](./docs/erd.md) — entity-relationship diagram
- [`AI_USAGE.md`](./AI_USAGE.md) — log of AI-assisted work on this project
