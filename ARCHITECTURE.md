# Architecture

Design decisions for the ACME Salary Management System, each recorded as what we
chose, why, and what we rejected. See `REQUIREMENTS.md` for scope and `CLAUDE.md`
for the development conventions these decisions operate within.

## 1. Single repo, independent backend/frontend projects, shared commit history

**What we chose:** One git repository containing `backend/` and `frontend/` as two
independent projects, each with its own `package.json`, dependencies, and test
runner, coupled only through the HTTP API.

**Why:** This is a small, single-team take-home assessment — there's no need for
separately versioned releases or independent deploy cadences that would justify
separate repos. A shared history keeps setup, review, and reasoning about a change
that spans both sides simple, while the strict "no reaching into the other
project's internals" rule (see `CLAUDE.md`) preserves the same boundary a
multi-repo split would enforce.

**What we rejected:** Separate repositories for backend and frontend — adds
cross-repo versioning and CI coordination overhead with no corresponding benefit
at this scale.

## 2. Express over Fastify/NestJS

**What we chose:** Express for the backend HTTP framework, with our own layered
structure (routes → controllers → services → repositories) built on top of it.

**Why:** Express is a thin, unopinionated layer. Building the MVC/factory-method
layering ourselves (see `CLAUDE.md`'s coding standards) means the architecture
reflects our own layering decisions, not a framework's — useful both as a
demonstration of design ability and to keep the codebase easy to reason about
without needing to learn a framework's own conventions first.

**What we rejected:** Fastify (faster, but its plugin/schema system is more
opinionated than needed here) and NestJS (a full DI/module framework — far more
structure than a single-entity MVP needs, and it would obscure our own layering
choices behind the framework's).

## 3. Plain React + Vite over Next.js

**What we chose:** React + Vite as a client-side single-page app, no
server-rendering framework.

**Why:** This is an internal, single-user, auth-free HR tool with no public-facing
SEO surface and no need for server-side rendering, API routes, or edge
middleware. Vite gives a fast dev server and simple build with none of that
extra machinery.

**What we rejected:** Next.js — its main advantages (SSR/SSG, file-based API
routes, SEO) don't apply to an internal admin tool that already has a separate
Express API.

## 4. SQLite + Drizzle + auto-reseed-on-startup

**What we chose:** SQLite via `better-sqlite3`, with Drizzle ORM for schema and
queries. On every server boot, the app runs any pending migrations and then seeds
10,000 deterministic employee records if the `employees` table is empty.

**Why:** SQLite is a single-file database with zero external hosting — appropriate
for a demo-scale take-home assessment where standing up and paying for a managed
Postgres/MySQL instance would be disproportionate overhead. Drizzle gives
type-safe queries and a lightweight, reviewable migration format (plain
committed SQL files) without a heavier ORM's runtime footprint. The auto-reseed
step exists specifically because free-tier hosts (e.g. Render) often use
ephemeral disks that reset on redeploy — without it, a redeploy could leave the
app pointing at an empty, unusable database with no manual recovery step. Since
`migrate()` is idempotent and the seed only runs when the table is empty, this is
safe to run on every boot.

**What we rejected:** A hosted Postgres/MySQL instance — real production
practice, but unnecessary complexity and cost for a demo-scale assessment with no
concurrent-write requirements. Also rejected `drizzle-kit push` as the runtime
mechanism for schema creation — it's an interactive, CLI-only dev tool not meant
for programmatic use at boot; generating migrations ahead of time and applying
them with the programmatic `migrate()` function is the reviewable, safe
equivalent.

## 5. Ant Design

**What we chose:** Ant Design (v6) as the frontend component library.

**Why:** Ant Design's table, form, and filter components are built for exactly
this kind of enterprise data-management screen — a paginated, filterable
employee directory and data-entry forms are close to Ant Design's core use case
out of the box. Prior production experience with it also means less time spent
learning a new library's conventions and more time on the actual feature work.

**What we rejected:** Building bespoke components from a headless/utility-first
base (e.g. Tailwind + Headless UI) — more flexible long-term, but slower to reach
a working, polished admin UI for an assessment-scale project.

## 6. Offset-based pagination over cursor-based

**What we chose:** `GET /employees` paginates with `page`/`pageSize` query
params, translated to SQL `LIMIT`/`OFFSET`, with results always ordered by `id`
ascending so page boundaries are stable across requests.

**Why:** This matches the API contract directly (`page`/`pageSize` in, a
`{ page, pageSize, total, totalPages }` envelope out), is trivial to express
with Drizzle's `.limit()/.offset()`, and a known `total`/`totalPages` is exactly
what an admin-UI page control (page 3 of 347, jump to page N) needs. At this
data scale — a single-tenant, ≤10,000-row, read-mostly dataset with no
concurrent-pagination concerns — the well-known weaknesses of `OFFSET` (its cost
growing with the offset, and pages shifting if rows are inserted/deleted between
requests) don't materialize in practice.

**What we rejected:** Keyset/cursor pagination (`WHERE id > lastId LIMIT n`) —
stronger consistency under concurrent writes and no `OFFSET`-scan cost at very
large offsets, but it trades away a simple `total`/page-count-driven UI for an
opaque-cursor API, complexity this dataset's size and near-zero write
concurrency (see decision 4) doesn't justify.

## 7. TanStack Query over hand-rolled `useState`/`useEffect` fetching

**What we chose:** TanStack Query (`@tanstack/react-query`) for the employee
list's data fetching, caching, and loading/error state, with
`placeholderData: keepPreviousData` so the table keeps showing the current
page's rows while a page change or a debounced search settles, instead of
flashing blank.

**Why:** The employee list page has a debounced search input whose value
flows into the query — every keystroke that survives the debounce, and every
page change, fires a new request while a previous one may still be in flight.
A hand-rolled `useEffect` fetch needs manual request-cancellation/staleness
tracking (e.g. an `AbortController` plus an "is this still the latest request"
guard) to stop a slower, older response from overwriting a newer one — a real
race-condition risk, not a hypothetical one, given how easily a user can
change the search term again before the first request returns. TanStack
Query's query keys (`["employees", { page, pageSize, search }]`) make each
distinct request/parameter combination address its own cache entry
automatically, so a stale response for an old key never clobbers state for
the current one, without hand-written cancellation logic.

**What we rejected:** Hand-rolled `useState`/`useEffect` fetching — viable for
a single one-shot fetch, but the debounced-search-plus-pagination combination
here is exactly the case where that approach's manual race-condition handling
becomes real, easy-to-get-wrong code, not boilerplate avoidance.

Related, smaller decision made in the same pass: the employee list `Table`'s
built-in column sorting was deliberately left disabled. `GET /employees`
doesn't accept a sort parameter yet, and enabling Ant Design's client-side
sort would only reorder the current page's rows, not the full result set —
misleading at pagination boundaries. Revisit once the backend supports a sort
query parameter.

## 8. Derived filter options over a hardcoded list

**What we chose:** `GET /employees/filters` computes its `departments` and
`countries` arrays with `SELECT DISTINCT ... ORDER BY` against the live
`employees` table, rather than the frontend or backend shipping a static list
of the known department/country values.

**Why:** The current seed data only ever populates a fixed set of six
departments and six countries, so a hardcoded list would work today. But
once employee create/delete exists, a hardcoded list can drift from reality
in two ways: it can offer a filter option with zero current employees behind
it (selecting it always returns an empty table, indistinguishable from a
real "no matches" case), or it can silently omit a value that only exists
because of newly created data. Deriving the list from the table guarantees
every filter option always corresponds to at least one real, currently
matching row.

**What we rejected:** A hardcoded array of department/country strings on
either the frontend or backend — simpler and marginally faster (no query),
but only correct as long as the dataset never changes, which doesn't hold
once create/delete ships.

## 9. Country→currency defaulting is a suggestion, never a constraint

**What we chose:** Selecting a country in the create-employee form
auto-populates the currency field with that country's default currency
(`GET /config/currencies`'s `countryCurrencyDefaults`), but the currency
`Select` stays fully editable afterward — never disabled, and the backend's
Zod validation never restricts `currencyCode` to match `country`.

**Why:** Real HR pay arrangements sometimes diverge from a country's local
currency — expats paid in their home currency, contracts denominated in
USD/EUR regardless of work location, and similar cases. Locking the field
once a country is chosen would misrepresent that reality and block a
legitimate entry. The default exists purely to save a click in the common
case, not to encode a business rule that doesn't actually hold.

**What we rejected:** Disabling/locking the currency field once a default
is applied, or validating `currencyCode` against `country` server-side —
both would incorrectly treat "usual" as "required."

## 10. Currency config served via a backend endpoint, not a frontend-hardcoded list

**What we chose:** `GET /config/currencies` (backed by
`backend/src/config/currencyRates.ts` and the new sibling
`countryCurrencyDefaults.ts`) is the single source of truth for both the
list of valid currency codes and the country→currency default mapping. The
frontend fetches it (`useCurrencyConfig`, `staleTime: Infinity` — this is
static app config with no runtime mutation path, unlike
`GET /employees/filters`) rather than shipping its own hardcoded copy.

**Why:** A hardcoded frontend list and the backend's Zod-validated set of
known currency codes are two things that would need to be kept in sync by
hand on every change — exactly the two-files-drift risk decision 8 already
rejected for department/country filter options, and the same reasoning
applies here. Serving it from the backend means there's exactly one place
that defines "what currencies exist" and "what a country's default is."

**What we rejected:** A hardcoded `currencies`/`countryCurrencyDefaults`
list duplicated in the frontend — simpler for a single static snapshot, but
guaranteed to drift the moment either side is edited without the other.

## 11. Shared, mode-driven `EmployeeForm`; Zod-mirrored client validation

**What we chose:** `EmployeeForm` takes a `mode: 'create' | 'edit'`, an
optional `initialValues`, and an `onSubmit` callback returning
`Promise<void>` — no knowledge of `Modal` chrome or of how/where its data is
persisted. Its public contract is entirely plain-string based
(`initialValues.joinedAt` and the payload handed to `onSubmit` are both ISO
date strings); the `DatePicker`'s `Dayjs` representation is an internal
implementation detail converted at the component's boundary. Only `create`
mode ships in this pass, via `CreateEmployeeModal`, a thin wrapper that owns
the `useCreateEmployee` mutation and only mounts `EmployeeForm` (and its
`useEmployeeFilters`/`useCurrencyConfig` queries) while the modal is open.

**Why:** An edit flow is a clearly anticipated next step (see
`REQUIREMENTS.md`'s "Create / edit employee"), and building the field
list/validation/country-currency-defaulting logic once, parameterized by
`mode`, avoids duplicating it later. Keeping the public contract
string-based (not `Dayjs`-based) means a future `EditEmployeeModal` just
passes a different `initialValues` object built from an `Employee` DTO,
with no date-library leakage into `api/types.ts`.

Client-side validation is intentionally **not** shared code with the
backend's Zod schema — `CLAUDE.md`'s "no reaching into the other project's
internals" rules out the frontend importing it, and it isn't installed
there. "Zod-mirrored" means two independently maintained, intentionally
matching validation definitions: Zod (`backend/src/validation/employeeValidation.ts`)
is the source of truth for correctness, hand-written Ant Design `Form.Item`
`rules` are the source of truth for immediate client-side feedback.

**What we rejected:** Building `EmployeeForm` as create-only with no `mode`
prop (would need a near-duplicate for edit later); sharing a validation
schema across the HTTP boundary (not possible without violating the
frontend/backend coupling rule, and not warranted at this scale of
duplication — five simple rules).

## 12. `employeeCode` generation: `MAX(numeric suffix) + 1`, not `COUNT(*)`

**What we chose:** The next `employeeCode` is derived by parsing the numeric
suffix out of every existing code, taking the maximum, and adding one
(`backend/src/repositories/employeeRepository.ts`'s
`findMaxEmployeeCodeNumber`), rather than counting existing rows.

**Why:** `COUNT(*) + 1` breaks the moment a delete exists — deleting any
employee except the most recently created one produces a `COUNT` that no
longer matches the highest issued number, risking a collision with an
existing `employeeCode` on the next create. `MAX(suffix) + 1` stays correct
regardless of deletions, since it only cares about the highest number ever
issued that's still present.

**Concurrency trade-off, stated precisely:** `better-sqlite3` is a
synchronous driver — `.all()`/`.get()`/`.run()` have no `await` point
between them. Within a single Node process, nothing can interleave between
one request's `findMaxEmployeeCodeNumber()` call and its `create()` call, so
concurrent `POST /employees` requests against **one process** can never race
on the max-lookup. The real risk is only a **multi-instance** deployment
sharing one SQLite file, where two separate processes could both read the
same `MAX` before either inserts. `employeeCode`'s `UNIQUE` constraint turns
that scenario into a clean insert failure, not silent duplicate data — an
acceptable, explicitly-documented trade-off for this demo-scale,
single-instance app (consistent with decision 4's single-SQLite-file
stance), not something worth building row-locking for.

**What we rejected:** `COUNT(*) + 1` (breaks under delete); a UUID or
similar opaque identifier instead of the sequential `EMP-######` format
(would be a breaking API/data-format change with no benefit at this scale,
and HR-facing employee codes are conventionally sequential and readable).

## 13. Partial-update semantics via `.partial()`, existence check folded into the UPDATE

**What we chose:** `PATCH /employees/:id`'s validation is
`createEmployeeSchema.partial()` — every field becomes optional while
keeping each field's original validator active when present. "Not found" is
signaled by the repository's `UPDATE ... WHERE id = ?` matching zero rows
(Drizzle's `.get()` returns `undefined` in that case), not a separate
existence lookup before the update runs.

**Why:** `.partial()` gives exactly the "any subset, but present fields
still validated" contract with zero new validation code — no hand-written
"is this field present, and if so is it valid" branching to get wrong.
Folding the existence check into the UPDATE itself avoids a redundant
`SELECT` before every write; the database already tells us whether a row
existed by whether it matched.

**What we rejected:** A separate Zod schema hand-written for updates
(duplicates every rule `createEmployeeSchema` already encodes, with no
behavioral difference from `.partial()`); a `findById` existence check
before the `UPDATE` (a second query for information the `UPDATE`'s own
result already gives us for free).

## 14. Prefill from already-fetched table data — no `GET /employees/:id`

**What we chose:** Clicking Edit on a table row passes that row's data
(already present in the list query's cache) directly into `EmployeeForm`'s
`initialValues`. There is no `GET /employees/:id` endpoint.

**Why:** The table already holds every field the edit form needs — a
dedicated fetch-by-id endpoint would exist purely to re-fetch data the
client already has, adding a network round-trip (and a brief loading state
in the modal) for no new information. It also introduces a staleness risk
a prefill-from-cache approach doesn't have: the row could change between
the table loading and the modal opening, and a fresh fetch wouldn't close
that window either (another request could race it) — it would just move
the risk around while adding latency, not remove it.

**What we rejected:** A `GET /employees/:id` endpoint fetched on Edit-click,
which is the more "RESTful-by-the-book" shape but solves a problem this app
doesn't have at this scale (10,000 rows, single HR-manager user, no
real-time collaboration to make staleness a meaningful concern).

## 15. Salary-reset-on-currency-change is frontend-only, never enforced server-side

**What we chose:** When editing an employee, changing the currency (directly
or via a country change cascading a new default) clears the `salaryAmount`
field client-side, once per edit session, with a placeholder naming the new
currency. `PATCH /employees/:id` itself places no constraint between
`currencyCode` and `salaryAmount` — any valid combination is accepted,
identical to `POST`.

**Why:** This is a data-entry safety nudge — stopping someone from
accidentally submitting a salary number that was correct under the old
currency but now reads as a wildly wrong amount under the new one — not a
business rule. It's consistent with decision 9 (currency is a suggestion,
never a constraint): the backend has no opinion on which currency a salary
figure is denominated in, so it has nothing to validate here either.

**What we rejected:** Server-side enforcement requiring `salaryAmount` to
be re-submitted whenever `currencyCode` changes — would conflate a UX
safeguard with a data-integrity rule the domain doesn't actually have.

**No-restore-on-toggle-back, a deliberate simplification:** once cleared,
the salary field never repopulates automatically, even if the currency is
changed back to the record's original value. Restoring it correctly would
mean caching the pre-clear number through arbitrary further edits and only
re-showing it on an exact currency match — real state to build and maintain
for a rare path (changing currency more than once in a single edit
session), not worth it here.

## 16. Hard delete over soft delete

**What we chose:** `DELETE /employees/:id` actually removes the row —
`DELETE FROM employees WHERE id = ?` — rather than setting a `deletedAt`/
`isDeleted` flag and filtering it out of subsequent queries.

**Why:** Soft delete exists to support things this app deliberately doesn't
do: recovering an accidental deletion, auditing who removed what and when,
or keeping historical records for compliance/reporting. Salary history
itself is already out of scope (see `REQUIREMENTS.md`'s "Deliberately Out
of Scope") — a versioned or recoverable employee record would be
inconsistent with that stance, adding real complexity (a `deletedAt`
column, `WHERE deletedAt IS NULL` on every existing query, a way to
eventually purge or restore) in service of a recovery guarantee nothing
else in this app provides. A hard delete keeps `GET /employees`,
`/employees/filters`, and the `employeeCode` generation's `MAX`-lookup all
working against the same simple, single table with no filtering
convention to remember or forget.

**What we rejected:** A soft-delete flag with an undo window — the more
common production pattern, and worth revisiting if audit/recovery ever
enters scope (see decision 12's `employeeCode`-gap handling either way),
but not justified for a demo-scale, single-user tool that already excludes
salary history for the same underlying reason.

This closes out the CRUD set for `/employees` — create (`POST`), read
(`GET`, `GET .../filters`), update (`PATCH`), delete (`DELETE`) all follow
the same route → controller → service → repository layering, the same
in-memory-db test pattern, and the same `{ errors: { field: message } }`
error shape wherever validation applies.
