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

## Entry 5 — Expand employee search to match employee code

**What was asked:** Widen `GET /employees`'s `search` param to match a
partial, case-insensitive substring of `employeeCode` in addition to `name`
(HR looks people up by code/ID as often as by name), combined with any
department/country filters via AND as before. No new endpoint, no schema
change. Update the frontend search placeholder text to reflect the wider
scope. Following TDD, split across labeled commits.

**What was generated:**
- `REQUIREMENTS.md` — new "Amendments" section recording the scope change
  and its rationale.
- `backend/src/repositories/employeeRepository.ts` — `buildWhereClause`'s
  search condition changed from a single `like()` on `name` to an `or()` of
  `like()` on `name` and `like()` on `employeeCode` (both lower-cased); this
  one condition still combines with `department`/`country` via the existing
  `and(...)`, unchanged.
- `backend/tests/employees.test.ts` — 2 new scenarios: a partial
  `employeeCode` match, and a search term matching neither field.
- `frontend/src/pages/EmployeeListPage.tsx` — search placeholder updated to
  "Search by name or employee code"; the two frontend tests that queried the
  input by its old placeholder text updated to match.

**Files touched:** see the 4 commits — `docs: amend REQUIREMENTS.md to
include employee code in search`, `test: add failing tests for employee code
search`, `feat: match search against employee code in addition to name`,
this entry.

**Process note:** the task described this change as already authorized by an
"Amendments" section in `REQUIREMENTS.md`, but that section didn't actually
exist yet (checked directly, no match) — flagged to the developer per
`CLAUDE.md`'s "never edit scope silently" rule for that file, rather than
silently assuming either that the doc was out of sync or that the change
wasn't authorized. Confirmed: add the section, then proceed.

> [human note: ] Implemented the search by employee code. But still the search is not working with employee code though we have data in DB. Debugging to fix the bug. 

> [human note: ] Employee search with employee code is working fine. First it was failing with employee code (ex: EMP-000005) though service was giving 200 Ok. Data being returned was empty from service. 
> Hypothesis 1: I have checked syntax in every the path of the service. Everything was fine and correct.  
> Hypothesis 2: To verify the generated employeeCode format, checked drizzle studio and verified that employeeCode is in format of EMP-000005.
> Checked different layers of the route including employeeRepository, employeeService, employeeController, and employeeRouter. Everything was perfectly fine and had not coding bugs. 
> Verified the returned response through curl command and also through postman. There as well I was getting empty data results. This confirmed that issue is not in frontend. 
> Checked on drizzle studio with the query to make employee search with employeeCode. It returned results as expected. 
> Now, after debugging the bug in different layers of the application I have confirmed to myself that issue is not in the code. So I made an assumption that a stale `npm run dev` is still running from previous session and restarted the server. This fixed the issue. 

## Entry 6 — GET /employees/filters and filter dropdowns

**What was asked:** Implement `GET /employees/filters`, returning distinct,
alphabetically sorted `departments` and `countries` derived from the
`employees` table (not hardcoded), and wire two Ant Design `Select`
dropdowns into the already-reserved layout slot on the employee list screen,
each combining with search/pagination via the existing `useEmployees` query
key. Each dropdown needed an explicit clear/"All X" option. Following TDD,
split across 5 labeled commits.

**What was generated:**
- `backend/src/repositories/employeeRepository.ts` — `findFilterOptions()`,
  running two independent `selectDistinct(...).orderBy(asc(...))` Drizzle
  queries (department, country) rather than one combined query, each hitting
  the existing indexes.
- `backend/src/services/employeeService.ts`,
  `backend/src/controllers/employeeController.ts`,
  `backend/src/routes/employeeRoutes.ts` — thin `listFilters` pass-through
  through the existing layering, mounted as `GET /filters` on the existing
  employee router.
- `backend/tests/filters.test.ts` (new, 3 scenarios against a small
  purpose-built fixture: dedup, alphabetical sort, and a department/country
  held by only one employee).
- `frontend/src/api/types.ts` (`EmployeeFilters`), `frontend/src/api/employees.ts`
  (`fetchEmployeeFilters`, and `department`/`country` added to
  `FetchEmployeesParams`), `frontend/src/hooks/useEmployeeFilters.ts` (new,
  5-minute `staleTime`), `frontend/src/hooks/useEmployees.ts` (params
  extended).
- `frontend/src/pages/EmployeeListPage.tsx` — `department`/`country` state,
  the page-reset effect extended to cover them, and two `Select`s (each with
  an explicit `{ value: "", label: "All X" }` option rather than relying on
  `allowClear`) replacing the placeholder `<Space />` reserved in the
  previous pass.
- `frontend/tests/EmployeeListPage.test.tsx` (3 new scenarios: populated
  dropdowns, a department selection triggering a re-fetch with `page: 1`,
  and department + search combining in one request) and
  `frontend/tests/App.test.tsx` (updated to mock `fetchEmployeeFilters`
  alongside the existing `fetchEmployees` mock, since the page now always
  fires both queries on mount).
- Docs: README (new endpoint section, frontend dropdown note),
  ARCHITECTURE.md (entry 8: derived filter options over a hardcoded list),
  this file.

**Files touched:** see the 5 commits — `test: add failing tests for GET
/employees/filters`, `feat: implement GET /employees/filters`, `test: add
failing tests for filter dropdown wiring and combined filtering`, `feat:
wire department and country filter dropdowns into employee list`, `docs:
document filters endpoint, derived-options decision, and AI usage`.

**Process notes:**
- Two test-infrastructure gaps surfaced only once the dropdowns actually
  rendered in jsdom, both fixed as part of the `feat` (frontend) commit
  rather than amending the already-committed `test` commit, per this
  repo's no-amend convention: `rc-select`'s virtual list renders each
  option twice (once visible, once for scroll-height measurement), which
  produced "multiple elements" errors until `virtual={false}` was set on
  both `Select`s; and jsdom has no `ResizeObserver` (which `rc-select`
  needs), fixed with a polyfill in `tests/setup.ts` alongside the existing
  `matchMedia` one.
- The initial test queries selected dropdown options by matched text, which
  collided with the mocked test employee's own department ("Engineering")
  rendered in the table's department column — switched to
  `getByRole("option", { name: ... })` scoping instead.

> [human note: ]
> Service for department and countries was developed at /employees/filters route. 
> Even though the seed data uses a fixed set of values, reason for deriving the list of departments and countries is to have the consistency between database and frontend view. It's because, if edit or delete happens and for any department or country employees and for that category if there is no data available then it'll be consistent between DB and frontend. This is why I am deriving these values fro DB. 
> In frontend dropdowns were added for country and department filters and API integration is done to fetch the filter options and render the UI.  

## Entry 7 — GET /config/currencies, POST /employees, create-employee UI

**What was asked:** Implement `GET /config/currencies` (static currency
list + country→currency default mapping, built first since the create form
depends on it), `POST /employees` with Zod validation and a
server-generated `employeeCode` (never client-supplied), and a shared,
mode-driven `EmployeeForm` + `CreateEmployeeModal` wired into the list
screen via an "Add Employee" button. Department was resolved as a `Select`
sourced from the existing `useEmployeeFilters` hook (symmetric with
Country), and `seed.ts` was refactored to import the new shared
country-currency config instead of keeping its own private copy, per two
explicit decisions confirmed with the developer before building. Following
TDD, split across 8 labeled commits.

**What was generated:**
- `backend/src/config/countryCurrencyDefaults.ts` (new, sibling to
  `currencyRates.ts`), `backend/src/services/configService.ts`,
  `backend/src/controllers/configController.ts`,
  `backend/src/routes/configRoutes.ts` — mirrors the `/health` endpoint's
  no-repository pattern, since this is static config with no DB access.
  `backend/src/db/seed.ts`'s private `COUNTRIES` array now derives from the
  shared config instead of duplicating it.
- `backend/src/validation/employeeValidation.ts` (new) — Zod schema for
  `POST /employees`, using only version-agnostic `.min()`/`.refine()` APIs
  (zod resolved to `4.4.3`, installed fresh this pass).
  `backend/src/repositories/employeeRepository.ts` —
  `findMaxEmployeeCodeNumber()` (`MAX(CAST(SUBSTR(employee_code, 5) AS
  INTEGER))`) and `create()`. `backend/src/services/employeeService.ts` —
  `createEmployee`, computing the next `EMP-######` code from the
  repository's max lookup. `backend/src/controllers/employeeController.ts` —
  Zod `safeParse`, mapping failures to `{ errors: { field: message } }` via
  `.flatten().fieldErrors`.
- `backend/tests/config.test.ts` (2 scenarios) and
  `backend/tests/createEmployee.test.ts` (7 scenarios, new files matching
  this repo's one-file-per-concern test convention).
- `frontend/src/api/config.ts` (`fetchCurrencyConfig`),
  `frontend/src/hooks/useCurrencyConfig.ts` (`staleTime: Infinity` — static
  config, no runtime mutation path, unlike `useEmployeeFilters`'s 5-minute
  staleTime). `frontend/src/api/employees.ts` — `createEmployee`,
  `ApiFieldError` (a typed `Error` subclass carrying `.errors`, thrown on a
  400 response). `frontend/src/hooks/useCreateEmployee.ts` — `useMutation`,
  invalidating the `["employees"]` query key prefix on success.
- `frontend/src/components/EmployeeForm.tsx` (new) — all six fields,
  country-selection auto-defaulting currency without disabling it,
  AntD `Form.Item` rules mirroring the backend's Zod constraints, and an
  `ApiFieldError` → `form.setFields` mapping for server-side 400s.
  `frontend/src/components/CreateEmployeeModal.tsx` (new) — thin `Modal`
  wrapper, only mounts `EmployeeForm` while open, closes only after
  `mutateAsync` resolves without throwing.
  `frontend/src/pages/EmployeeListPage.tsx` — "Add Employee" button and
  modal-open state.
- `frontend/tests/EmployeeForm.test.tsx` (5 scenarios),
  `frontend/tests/CreateEmployeeModal.test.tsx` (3 scenarios — the 400/
  success paths from the original spec, plus a Cancel/X-button test added
  as real, previously-missing coverage), one new test in
  `frontend/tests/EmployeeListPage.test.tsx`, and an `App.test.tsx` mock
  update (the page now always mounts `useCreateEmployee`, even with the
  modal closed).
- Docs: README (new `POST /employees` and `GET /config/currencies`
  sections, a frontend note on the "Add Employee" button), ARCHITECTURE.md
  (entries 9–12: country-currency defaulting as suggestion-not-constraint,
  currency config via a backend endpoint, the shared mode-driven form
  design plus the Zod-mirrored-validation resolution, and the
  `employeeCode` concurrency trade-off written out precisely), this file.

**Files touched:** see the 8 commits — `chore: add zod for request
validation`, `test: add failing tests for GET /config/currencies`, `feat:
implement GET /config/currencies`, `test: add failing tests for POST
/employees validation and creation`, `feat: implement POST /employees with
zod validation and generated employee code`, `test: add failing tests for
employee form, country-currency defaulting, and submission`, `feat:
implement shared EmployeeForm and create employee modal`, `docs: document
currency config endpoint, defaulting behavior, and form architecture`.

**Process notes:**
- Two test-infrastructure gaps surfaced only once the real components
  rendered, both fixed as part of the frontend `feat` commit rather than
  amending the already-committed `test` commit, per this repo's no-amend
  convention: the three new `Select`s needed `virtual={false}` (same
  `rc-select` duplicate-option issue hit previously for the filter
  dropdowns), and the multi-field form-interaction tests needed a higher
  global `testTimeout` to stay reliable under parallel test-worker
  contention (individual runs took ~2–4s but crept past the 5s default
  when several heavy AntD test files ran concurrently).
- A TypeScript inference limitation surfaced in
  `employeeController.ts`'s Zod-error formatter: a generic
  `formatZodErrors<T>(error: ZodError<T>)` couldn't resolve
  `Object.entries(error.flatten().fieldErrors)` against the abstract
  mapped type, typing values as `{}`. Fixed with a direct, verified-safe
  cast (`as Record<string, string[] | undefined>`) rather than fighting
  the generic.
- Verified end-to-end against the real dev server via the browser
  extension: department/country/currency `Select`s populate from live
  data, selecting a country correctly auto-defaults currency without
  locking it, and submitting creates a real row with a correctly
  incremented `employeeCode` (confirmed via direct `GET /employees` checks
  after driving the actual rendered form, not just visual inspection). The
  browser extension itself was unreliable for parts of this session
  (a broken screenshot API, and click-by-element-reference calls that
  silently failed to register — worked around with direct DOM/JS-driven
  interaction instead) and, separately, a real modal-close symptom
  appeared when clicking Cancel/the X button in the live browser. Rather
  than trust one flaky manual session, a dedicated automated test was
  written for that exact interaction (`user-event`-driven, in the
  deterministic jsdom environment) — it passed cleanly and immediately,
  which combined with the extension's other unrelated failures earlier in
  the session, points to a browser-automation artifact rather than a real
  app bug. Flagging this explicitly rather than asserting certainty either
  way — worth a quick manual click-through in a normal browser tab to
  fully close the loop.

> [human note: ]
> Create employee endpoint is developed. Used Zod package for request-body validations. 
> Newly added employee can be from any country and to set the currency type developed GET /config/currencies endpoint which will give list of currencies. 
> In frontend created a form in a modal to add new employee. Employee code creation will handled by BE and HR have to add mandatory fields like name, country, department, salary and date of joining. Currency will be auto populated when country is selected but it'll be editable. 
> On successful addition, a notification/toast will be shown to the user confirming that user is added successfully. 

## Entry 8 — PATCH /employees/:id and edit-employee UI

**What was asked:** Implement `PATCH /employees/:id` accepting a partial
update (any subset of the create fields, only present fields validated and
applied, `employeeCode`/`id` ignored if sent), and an edit-employee UI
reusing `EmployeeForm` in `mode="edit"` via a new `EditEmployeeModal`,
prefilling from already-fetched table data rather than a new fetch, sending
only changed fields on submit, and clearing the salary field once when the
currency changes (directly or via a cascaded country default), never
restoring it if changed back. Following TDD, split across 5 labeled
commits.

**What was generated:**
- `backend/src/validation/employeeValidation.ts` —
  `updateEmployeeSchema = createEmployeeSchema.partial()`.
  `backend/src/repositories/employeeRepository.ts` — `update(id, row)`,
  using the UPDATE's own zero-rows-matched result as the "not found"
  signal (no separate existence lookup), with a guard returning the
  unchanged record via a plain `select` when the update row is empty
  (Drizzle throws on `db.update(...).set({})`, verified directly against
  the runtime, not assumed from docs — an empty `PATCH` body needed this
  guard or it would 500).
  `backend/src/services/employeeService.ts` — `updateEmployee`, building
  the update row field-by-field (only assigning present keys) and mapping
  back to the same `EmployeeDto` shape as `createEmployee`.
  `backend/src/controllers/employeeController.ts` — `updateEmployee`,
  reusing the existing `formatZodErrors` helper as-is; a malformed/
  non-numeric `:id` returns 404 before body validation even runs.
  `backend/src/routes/employeeRoutes.ts` — `PATCH /:id` on the existing
  employee router.
- `backend/tests/updateEmployee.test.ts` (new, 7 scenarios: single-field
  update, multi-field update, invalid currencyCode/salaryAmount → 400 with
  the record unchanged, non-existent id → 404, employeeCode/id ignored,
  and an empty body → 200 no-op).
- `frontend/src/api/types.ts` (`UpdateEmployeePayload`),
  `frontend/src/api/employees.ts` (`updateEmployee`, mirroring
  `createEmployee`'s 400-handling exactly),
  `frontend/src/hooks/useUpdateEmployee.ts` (new, same
  mutate-then-invalidate pattern as `useCreateEmployee`).
- `frontend/src/components/EmployeeForm.tsx` — the salary-reset state
  machine: a `salaryCleared` flag (starts fresh every mount, which happens
  every time the edit modal opens) and a ref capturing the record's
  original currency on mount; a shared check invoked from both the
  currency `Select`'s new `onChange` and the existing country-cascaded
  currency-default path (since `form.setFieldValue` doesn't fire a
  `Select`'s own `onChange`, both call sites need it explicitly); a
  currency-aware placeholder once cleared, via `Form.useWatch`.
- `frontend/src/components/EditEmployeeModal.tsx` (new) — diffs the
  submitted values against the original `Employee` prop field-by-field
  (normalizing `joinedAt` through the same `dayjs(...).format("YYYY-MM-DD")`
  `EmployeeForm` uses internally, since the `Employee` DTO's `joinedAt` is
  a full ISO datetime but the form submits a date-only string), sends only
  the diff, and short-circuits to `onClose()` with no API call at all when
  nothing changed.
  `frontend/src/components/EmployeeTable.tsx` — `columns` moved from a
  module-level const to a function closing over a new `onEdit` prop, adding
  an Actions column with an icon-only, `aria-label`'d Edit button per row.
  `frontend/src/pages/EmployeeListPage.tsx` — a single
  `editingEmployee: Employee | null` state (not a separate open-boolean —
  "modal open" and "an employee is selected" never diverge in this
  feature) driving the new modal.
- `frontend/tests/EmployeeForm.test.tsx` (4 new edit-mode scenarios),
  `frontend/tests/EditEmployeeModal.test.tsx` (new, 3 scenarios: prefill
  with no list re-fetch, diff-only submission, 400 field-error surfacing),
  plus `updateEmployee: vi.fn()` added to the existing mock factories in
  `EmployeeListPage.test.tsx`/`App.test.tsx` (both files mount the new
  modal, and therefore `useUpdateEmployee`, unconditionally regardless of
  open state — the same reason `createEmployee` was already mocked there).
- Docs: README (`PATCH /employees/:id` section, an edit-action note in the
  frontend section), ARCHITECTURE.md (entries 13–15: partial-update
  semantics and the folded-in existence check, prefill-from-table-data and
  why no `GET /employees/:id`, and salary-reset as a frontend-only nudge
  with the no-restore-on-toggle-back simplification), this file.

**Files touched:** see the 5 commits — `test: add failing tests for PATCH
/employees/:id partial update and validation`, `feat: implement PATCH
/employees/:id`, `test: add failing tests for edit modal prefill and
currency-triggered salary reset`, `feat: implement edit employee modal
reusing EmployeeForm`, `docs: document PATCH semantics, prefill decision,
and salary-reset behavior`.

**Process notes:**
- Two backend edge cases weren't in the task's 6 specified test scenarios
  and were resolved by directly tracing Drizzle's runtime behavior rather
  than guessing: `db.update(employees).set({})` throws `"No values to
  set"` (confirmed via a throwaway script against a real in-memory db,
  then deleted) — handled with the empty-row guard described above, plus
  a 7th test case; and a malformed `:id` needed an explicit decision
  (resolved as 404-before-validation, mirroring this controller's existing
  `parsePage`/`parsePageSize` philosophy of never surfacing malformed
  input as a client-facing validation error).
- The frontend test suite was flaky under heavy, unrelated system load
  partway through this session (multiple concurrent Claude Code sessions
  and a heavy Chrome process competing for CPU) — a run that had passed
  cleanly minutes earlier started timing out across totally unrelated
  test files. Re-ran with `--fileParallelism=false` to get a clean,
  trustworthy confirmation without changing the project's actual test
  config for what was a transient, session-specific resource spike, not a
  real issue with the suite or this feature's code.

> [human note: ]
> Employee edit flow is implemented through PATCH /employees/:id. Using Zod all request-body validations are being done. Department/country/name must not be empty. If current code is present then it should be a key in config/currencyRates.ts, if salary is available then it should be a positive value. 
> In frontend same create employee record modal is reused for edit as well. 
> When country is updated then currency will also be changed and salary is set to 0. 
> Filing tests were written for both FE and BE and then code was written to achieve the green flag for all the test cases.

## Entry 9 — DELETE /employees/:id and delete UI

**What was asked:** Implement `DELETE /employees/:id` as a hard delete (400
for a malformed/non-positive `:id`, 404 for a non-existent one, 204 with no
body on success), and a delete action in the employee table guarded by an
explicit confirmation — the delete never fires on the icon click alone.
After a successful delete, if the current page's results come back empty
on refetch and the user isn't on page 1, the view resets to page 1.
Following TDD, split across 5 labeled commits. This closes out the CRUD set
for `/employees` (create/read/update/delete).

**What was generated:**
- `backend/src/repositories/employeeRepository.ts` — `delete(id)`, using
  the `DELETE`'s own affected-row count (`result.changes > 0`, verified
  directly against the runtime rather than assumed) as the found/not-found
  signal — same folded-in-existence-check pattern as `update`.
  `backend/src/services/employeeService.ts` — `deleteEmployee`, a thin
  passthrough. `backend/src/controllers/employeeController.ts` —
  `deleteEmployee`, parsing `:id` as a positive integer and returning `400`
  with a structured `{ errors: { id: "..." } }` if it isn't — a
  deliberately different choice from `PATCH`'s malformed-`:id`-as-404
  handling, since this endpoint's contract explicitly calls for `400` here
  and there's no sensible "coerce to a default" for a resource about to be
  irreversibly removed. `backend/src/routes/employeeRoutes.ts` —
  `DELETE /:id` on the existing employee router.
- `backend/tests/deleteEmployee.test.ts` (new, 5 scenarios, including a
  regression check seeding three sequential employeeCodes, deleting the
  *middle* one to leave a real gap, then confirming a new create still
  produces a non-colliding code — validating decision 12's `MAX`-based
  generation, not just re-testing that a delete succeeded).
- `frontend/src/api/employees.ts` (`deleteEmployee`, no body to parse on a
  204 response), `frontend/src/hooks/useDeleteEmployee.ts` (new, same
  mutate-then-invalidate pattern as create/update).
- `frontend/src/components/EmployeeTable.tsx` — a Delete button in the
  existing Actions column, wrapped in an Ant Design `Popconfirm`; the
  component stays purely presentational (no hooks of its own), receiving
  a new `onDelete` prop rather than owning the mutation itself.
  `frontend/src/pages/EmployeeListPage.tsx` — `useDeleteEmployee` and a
  general page-underflow guard (settled query, empty data, `page > 1` →
  reset to `1`) rather than delete-specific handling threaded through the
  mutation callback, since that's the only realistic way to end up on a
  later page with an empty result once search/filter changes already
  reset the page proactively on their own.
- `frontend/tests/EmployeeTable.test.tsx` (new — no API mocking needed at
  all, since the component takes plain props: confirms Delete doesn't
  fire immediately, confirms it fires on Popconfirm confirmation, confirms
  cancelling fires nothing), one new `EmployeeListPage` scenario (delete
  the last row on page 2, refetch comes back empty, page resets to 1), and
  a `deleteEmployee: vi.fn()` addition to `App.test.tsx`'s mock factory
  (`EmployeeListPage` now calls `useDeleteEmployee` unconditionally on
  mount, same reason `createEmployee`/`updateEmployee` needed mocking
  there already).
- Docs: `REQUIREMENTS.md` — a new Amendments entry recording that employee
  removal (hard delete, no audit trail) is in scope; this was flagged to
  the developer rather than assumed, since the task described this
  amendment as already existing but it didn't (same situation, and same
  resolution, as Entry 5's employee-code-search amendment). README (new
  `DELETE /employees/:id` section, a delete-action note in the frontend
  section). ARCHITECTURE.md (entry 16: hard delete over soft delete, and
  why, closing out the CRUD-layering note), this file.

**Files touched:** see the 5 commits — `test: add failing tests for DELETE
/employees/:id`, `feat: implement DELETE /employees/:id`, `test: add
failing tests for delete confirmation flow and page-reset-on-empty`,
`feat: implement delete UI with confirmation and page-reset handling`,
`docs: document hard-delete decision in ARCHITECTURE.md`.

**Process notes:**
- Verified `db.delete(employees).where(...).run()`'s return shape directly
  (`{ changes, lastInsertRowid }`) against a real in-memory db before
  relying on `changes > 0` as the not-found signal, rather than assuming
  it from Drizzle's types — the same verify-don't-assume approach already
  used for `PATCH`'s empty-`set()` behavior in Entry 8.
- The task described `REQUIREMENTS.md` as already amended to bring
  employee removal into scope; it wasn't. Flagged to the developer before
  writing the amendment, per `CLAUDE.md`'s "never edit scope silently"
  rule — confirmed to proceed, then added it as part of this pass's docs
  commit.

> [human note: ] 
> Developed the endpoint for delete action at DELETE /employees/:id. 
> In the employee table given a delete button in the actions column. Once user clicks the button, it'll ask for confirmation and on confirming it'll delete the user. 
> Failing tests were written for both BE and FE and then code was written to achieve green flag. 

## Entry 10 — GET /insights/summary and GET /insights/outliers (2026-07-08)

**What was asked:** Implement the two remaining backend routes from the
original API design — org-wide payroll aggregates (`GET /insights/summary`)
and per-department highest/lowest-paid employees (`GET /insights/outliers`)
— backend only, no frontend wiring this pass. A shared `convertToUSD`
utility was specified explicitly, reading `config/currencyRates.ts`,
returning `null` and logging a warning (rather than throwing) for an
unrecognized `currencyCode`. `GET /insights/summary` was specified to query
grouped by `(department, country, currencyCode)` — `SUM`/`COUNT` per group
— converting each group's summed amount to USD in application code rather
than pulling all 10,000 raw rows; headcount fields were specified as plain,
conversion-free counts. `GET /insights/outliers` was specified to rank
highest/lowest strictly by converted `salaryUSD`, never native
`salaryAmount`, with a single-employee department legitimately returning
that employee as both. Following TDD, split across 7 labeled commits.

**What was generated:**
- `backend/src/services/currencyConversion.ts` (new) — `convertToUSD(amount, currencyCode)`,
  shared by both new endpoints.
- `backend/src/repositories/insightsRepository.ts` (new) — `findSalaryGroups()`
  (one Drizzle query, `.groupBy(department, country, currencyCode)` with
  `sql<number>` `SUM`/`COUNT` templates, mirroring the existing `count(*)`
  aggregate pattern in `employeeRepository.ts`) and
  `findEmployeesForOutliers()` (an explicit six-column select, not
  `SELECT *`).
- `backend/src/services/insightsService.ts` (new) — `getSummary()` rolls the
  grouped rows into `totalPayrollUSD`, `totalPayrollByCountryUSD`,
  `avgSalaryByDepartmentUSD`, `avgSalaryByCountryUSD` (all rounded via
  `Math.round`), and `headcountByDepartment`/`headcountByCountry` (summed
  unconditionally, independent of currency-conversion success — see
  `ARCHITECTURE.md` entry 17 for the resulting headcount/average-denominator
  asymmetry on bad currency codes). `getOutliers()` converts each employee
  row to `salaryUSD`, drops rows that fail conversion, groups by department,
  and reduces each group to `highest`/`lowest` by `salaryUSD`.
- `backend/src/controllers/insightsController.ts` and
  `backend/src/routes/insightsRoutes.ts` (new) — thin, parameter-free
  pass-throughs mirroring `configController.ts`'s no-repository-touching
  handler style.
- `backend/src/server.ts` — new `insightsRepository`/`insightsService`/
  `insightsRouter` wiring block, mounted at `/insights`, identical shape to
  the existing `/employees` and `/config` blocks.
- `backend/tests/currencyConversion.test.ts` (new, 2 scenarios — a known
  clean-number conversion, an unrecognized code not throwing),
  `backend/tests/insightsSummary.test.ts` (new, 4 scenarios against a
  5-row fixture spanning 2 departments/3 countries/3 currencies chosen so
  most totals/averages are exact integers except one deliberately
  fractional department average, used to prove rounding),
  `backend/tests/insightsOutliers.test.ts` (new, 3 scenarios: a
  native-vs-USD ranking-order disagreement fixture, a single-employee
  department, and a row with an unrecognized currency code excluded from
  results).
- Docs: README (`GET /insights/summary`/`GET /insights/outliers` sections
  with example responses drawn from the real seeded dev DB), ARCHITECTURE.md
  (entry 17: SQL-groups-then-JS-converts, ranking by converted value only,
  the skip-and-warn behavior and its headcount/average asymmetry), this
  file.

**Files touched:** see the 7 commits — `test: add failing tests for
convertToUSD utility`, `feat: implement shared currency conversion utility`,
`test: add failing tests for GET /insights/summary`, `feat: implement GET
/insights/summary`, `test: add failing tests for GET /insights/outliers`,
`feat: implement GET /insights/outliers`, `docs: document conversion
approach and outlier definition in ARCHITECTURE.md`.

**Process notes:**
- The headcount-vs-average-denominator asymmetry (headcount counts every
  group unconditionally; the two `avgSalary...USD` maps only average over
  groups that actually converted) isn't pinned down by any of the task's
  specified test scenarios — none of them exercise a summary fixture with a
  bad currency code. This was flagged in the plan before implementation,
  along with the reasoning, rather than silently picked and discovered
  later.
- Verified directly against a real in-memory Drizzle DB (not assumed) that
  multi-column `.groupBy(a, b, c)` and `sql<number>` `SUM`/`COUNT` templates
  return genuine JS numbers from `better-sqlite3`, consistent with this
  repo's established "verify runtime behavior, don't guess" practice from
  earlier entries.
- Verified both endpoints end-to-end against the real ~10,000-row seeded dev
  DB via direct `curl` requests (not just the test suite): headcounts sum
  close to the real employee count, outliers correctly rank a GBP salary
  above a numerically larger INR salary, confirming USD-based ranking works
  on real data, not just hand-built fixtures.

> [human note: ]
> `/insights/summary` and `insights/outliers` endpoints are implemented. Separate route flow is written for insights routes beside employees. Added insightsRepository, insightsService, insightsController, and insightsRoutes for this route category. 
> `/insights/summary` will return total payroll of all employees, average payroll by department, average payroll by country, head count by department and country. 
> `/insights/outliers` will give outliers by department. This will return the employee details who have highest and lowest salary in each department. 
> Tests are written to validate each route.
> Separation of routes from employees route by Claude is the right call. Reason for this is it's a separate flow. We are processing over the employees data and fetching the insights. 
