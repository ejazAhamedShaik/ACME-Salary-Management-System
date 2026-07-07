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

> [human note: ] Generated the full project structure using Claude and set up was done for DB, BE, and FE. For DB local SQLite database is used and a seeding script was written to generate employees data of 10_000. Faker library was used to generate the data and was written to DB. React 19 latest build is being used and latest Ant Design 6 is configured to develop the UI screens. And for backend Express framework is chosen. 

## Entry 2 — Initial project scaffold

**What was asked:** Write an integration test for Seed.ts to test if it generates 10_000 records with unique employee IDs. 

**What was generated:**
- A test was written to test the DB seeding. 
- A helper was written to create in-memory DB for testing purpose. Instead of actual dev DB this in-memory was used to make the tests efficient as using dev DB can slow down tests. 

> [human note: ] Accepted the changes after reviewing. This is first test written to make sure DB is consistent with data seeded. 

## Entry 3 — GET /employees (pagination, search, filters)

**What was asked:** Implement `GET /employees` per a given API contract (page/
pageSize with defaults and a hard pageSize cap, case-insensitive partial name
search, exact department/country filters combined with AND, stable `id`-ascending
ordering, never a 4xx/5xx for "no matches"), using the existing routes→
controllers→services→repositories layering, reusing the in-memory-db test
pattern from Entry 2, following TDD, split across 4 labeled commits.

**What was generated:**
- `backend/src/repositories/employeeRepository.ts` — builds Drizzle
  `eq()`/`like()` conditions from the active filters (hits the existing
  `idx_employees_department`/`idx_employees_country` indexes), runs an indexed
  `LIMIT`/`OFFSET` row query plus a separate `count(*)` query.
- `backend/src/services/employeeService.ts` — computes the pagination offset and
  `totalPages`, maps repository rows to a response DTO (`joinedAt` as an ISO
  string rather than relying on implicit `Date` serialization).
- `backend/src/controllers/employeeController.ts` — parses/clamps `page`,
  `pageSize`, and trims the filter strings from `req.query`.
- `backend/src/routes/employeeRoutes.ts` — mounts the controller under
  `/employees`.
- `backend/src/server.ts` — `createApp()` refactored to `createApp(db)` so the
  employee repository can be wired with an injectable db connection; the
  `client.ts` db import moved into the entrypoint guard (dynamic import) so
  importing `server.ts` in tests no longer touches the real dev DB file as a
  side effect.
- `backend/tests/employees.test.ts` (new, 11 scenarios against an explicit,
  hand-built fixture) and `backend/tests/health.test.ts` (updated to build its
  own in-memory db and call `createApp(db)`).
- Docs: README (new API section for the endpoint), ARCHITECTURE.md (entry 6,
  offset-based vs. cursor-based pagination), this file.

**Files touched:** see the 4 commits — `test: add failing tests for GET
/employees...`, `refactor: extract createApp factory for testability`, `feat:
implement GET /employees...`, `docs: document GET /employees...`.

**Process note:** while turning the tests green, a bug was found in the test
fixture itself (every department/country "bucket" was renaming its own last row
to the search-test's distinctive name, so the search scenario matched 4 rows
instead of 1) — fixed as part of the `feat` commit rather than amending the
already-committed `test` commit, per this repo's no-amend convention. Also
added an 11th test scenario beyond the 10 originally specified, distinguishing
"invalid page falls back to the default" from "valid but out-of-range page
echoes the requested page number with empty data" — two different rules that
are easy to conflate in the controller's parsing logic.

**Verification:** confirmed the department-filter query plan actually uses
`idx_employees_department` (via `EXPLAIN QUERY PLAN`, not just "felt fast") and
timed a deep-page, filtered request against the real 10,000-row seeded dev DB.

> [human note: ] Implemented offset based pagination, written test cases to test GET /employees endpoint. Created employeesRepository helper to fetch the data from DB. Placed service and controller for /employees to format the data. 

## Entry 4 — Employee list screen (GET /employees integration)

**What was asked:** Build the frontend employee list screen against the
existing `GET /employees` endpoint, using TanStack Query (not hand-rolled
`useState`/`useEffect`) with `placeholderData: keepPreviousData`, a single
`/` route structured for additive future routes, and space reserved in the
layout for department/country filter dropdowns (not built this pass —
`GET /employees/filters` doesn't exist yet). Debounced search (~300ms),
antd `Table` wired directly to the API's pagination envelope, no client-side
sorting (deferred pending backend sort support). Following TDD, split across
6 labeled commits.

**What was generated:**
- `src/api/types.ts`, `src/api/employees.ts` (`fetchEmployees`), `src/api/queryClient.ts`
  (module-level `QueryClient` singleton).
- `src/hooks/useEmployees.ts` (wraps `useQuery`), `src/hooks/useDebouncedValue.ts`.
- `src/components/EmployeeTable.tsx` (presentational, antd-agnostic props —
  antd stays this file's private implementation detail).
- `src/pages/EmployeeListPage.tsx` (owns page/search state, the debounce +
  page-reset-on-search-change behavior, loading/empty/error/table states).
- `App.tsx`/`main.tsx` wiring (`/` route swapped to the new page,
  `QueryClientProvider` added at the root); the old `DirectoryPlaceholderPage`
  placeholder deleted as dead code.
- `frontend/tests/testUtils.tsx` (shared `renderWithProviders`/
  `createTestQueryClient` helper), `frontend/tests/EmployeeListPage.test.tsx`
  (7 scenarios), `frontend/tests/App.test.tsx` rewritten to match the new
  route content.
- Docs: README (TanStack Query dependency note), `ARCHITECTURE.md` (entry 7:
  TanStack Query over hand-rolled fetching, plus a note on disabled
  client-side sorting), this file.

**Files touched:** see the 6 commits — `chore: add TanStack Query and wire
QueryClientProvider`, `test: add failing tests for employee list loading,
empty, and error states`, `feat: implement employee list page...`, `test: add
failing tests for debounced search and page-change refetching`, `feat:
implement debounced search input`, `docs: document TanStack Query decision...`.

**Corrections to the task brief, based on reading the actual current code:**
the brief said to add `react-router-dom`; this project already uses the
modern unified `react-router` package (already installed, already wired), so
no new routing dependency was added. Also, the brief didn't specify whether
typing a new search term should reset the current page — flagged as a real
product-behavior gap (a stale deep page combined with a narrower search could
otherwise show an empty table indistinguishable from "no matches") and
confirmed with the developer before building it in.

**Process notes:**
- A pre-existing test-isolation bug was found and fixed while writing these
  tests: `@testing-library/react`'s automatic `afterEach(cleanup)` only
  registers when it detects a *global* `afterEach`, but this project's
  `vite.config.ts` sets `globals: false`, so cleanup between tests was
  silently never happening. Fixed in the shared `tests/setup.ts`.
- The debounce test needed `vi.useFakeTimers()` plus wrapping the timer
  advance in `act()` — the debounce timeout's state update happens outside
  any React event handler, so without `act()` the resulting re-render (and
  the query-key change it triggers) doesn't flush before the assertion runs.
- A `window.matchMedia` polyfill was added to the shared test setup — antd's
  responsive grid hooks need it and jsdom doesn't implement it; this
  surfaced as soon as the first real antd `Table`/`Flex` combination was
  rendered in a test, not during the earlier placeholder-only smoke test.

> [human note: ] Created Employee search landing page with search and pagination features. To handle the complex state management of API data I have used tanstack react-query library. As we have huge amount of data, this library will help in managing state and caching API data. At this state only search is implemented. Filter by department/country and create/edit/delete is not yet implemented as API services are not yet developed. 

