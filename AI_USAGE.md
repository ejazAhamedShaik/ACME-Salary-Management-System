# AI Usage Log

This log records how AI assistance was used on this project. Each entry has a
factual part (what was asked, what was generated, which files changed) written by
the AI, and a `> [human note: ]` placeholder for the developer's own reflection on
what was accepted, changed, or rejected, and why. The human note is written by the
developer, not the AI.

---

## Entry 1 — Initial project scaffold

**What was asked:** Scaffold the repo's structure and tooling only — no employee
CRUD, search/filter, or reporting logic yet. Set up an Express + TypeScript
backend and a React + Vite + TypeScript + Ant Design v6 frontend, an
`employees` table + seed script + currency config via Drizzle ORM and SQLite,
Vitest-based smoke tests on both sides, and baseline docs (README, ARCHITECTURE,
this log, and an ER diagram), split across 5 labeled commits.

**What was generated:**
- Backend: Express app with a layered `/health` endpoint (service → controller →
  route, factory functions), CORS/PORT/DATABASE_FILE env config, separate
  `build`/`start` scripts, full ESM module setup.
- Database: a Drizzle `employees` table (indexed on `department` and `country`),
  a `client.ts` DB connection module, a `bootstrap.ts` that runs migrations and
  auto-seeds an empty database on startup, a batched deterministic seed script
  (10,000 rows via `@faker-js/faker`, fixed seed), and a static
  currency-to-USD rate table.
- Frontend: a React 19 + Vite app wired with `react-router` and an Ant Design
  `ConfigProvider`, a placeholder directory page, and a bare API client stub.
- Tests: one backend smoke test (`GET /health` via Vitest + Supertest) and one
  frontend smoke test (rendering `App` via Vitest + React Testing Library +
  jest-dom).
- Docs: `README.md` (rewritten), `ARCHITECTURE.md` (5 decisions, each with
  rejected alternatives), `docs/erd.md` (Mermaid ER diagram), and this file.

**Files touched:** see the 5 commits — `chore: scaffold backend project`,
`chore: scaffold frontend project`, `feat: define employee schema, seed script,
and currency config`, `test: add smoke tests...`, `docs: add architecture
notes...`.

**Process note:** for this one-time scaffolding pass, working code (commits 1–3)
was committed before the smoke tests (commit 4), per the task's explicit 5-commit
sequence — a deliberate, scoped exception to the normal test-first workflow in
`CLAUDE.md`, which applies starting with the next feature slice (employee CRUD).

**Live version checks:** package versions (TypeScript 6.0.3, Ant Design 6.5.0,
Drizzle ORM 0.45.2, `@faker-js/faker` 10.5.0, etc.) were confirmed via `npm view`
rather than assumed, since several were newer majors than expected going in.

> [human note: ]
