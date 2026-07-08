# ACME Salary Management System

A web app for an HR Manager to manage salary records for 10,000 employees across
multiple countries, and answer aggregate questions about org-wide pay — replacing
a spreadsheet-based workflow. See `REQUIREMENTS.md` for full scope and
`ARCHITECTURE.md` for the design decisions behind the stack below.

## Tech stack

- **Backend:** Node.js + TypeScript + Express, SQLite via `better-sqlite3` +
  Drizzle ORM
- **Frontend:** React + Vite + TypeScript, React Router, Ant Design v6,
  TanStack Query for server-state fetching/caching (see `ARCHITECTURE.md` for
  why, over hand-rolled `useState`/`useEffect` fetching)
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

## API

### `GET /employees`

Paginated, searchable, filterable employee list.

| Query param | Default | Notes |
|---|---|---|
| `page` | `1` | Invalid values (non-numeric, ≤0) fall back to the default. A valid page beyond the last one just returns an empty `data` array. |
| `pageSize` | `20` | Invalid values fall back to the default; values above `100` are clamped to `100`, never rejected. |
| `search` | — | Case-insensitive partial match against employee name. |
| `department` | — | Exact match. |
| `country` | — | Exact match. |

`department`, `country`, and `search` combine with AND. Results are ordered by
`id` ascending for stable pagination across requests. No matches is a normal
200 response (`data: []`), never a 4xx/5xx.

```bash
curl "http://localhost:3000/employees?page=1&pageSize=5&department=Engineering"
```

```json
{
  "data": [
    {
      "id": 1,
      "employeeCode": "EMP-000001",
      "name": "Hugh Bechtelar",
      "department": "Engineering",
      "country": "India",
      "currencyCode": "INR",
      "salaryAmount": 193866,
      "joinedAt": "2023-01-31T05:36:45.000Z"
    }
  ],
  "pagination": { "page": 1, "pageSize": 5, "total": 1734, "totalPages": 347 }
}
```

### `GET /employees/filters`

Distinct department and country values currently present in the `employees`
table, each alphabetically sorted with no duplicates — used to populate the
employee list's filter dropdowns. No query params.

```bash
curl "http://localhost:3000/employees/filters"
```

```json
{
  "departments": ["Engineering", "Finance", "Human Resources", "Marketing", "Operations", "Sales"],
  "countries": ["Australia", "Canada", "Germany", "India", "United Kingdom", "United States"]
}
```

### `POST /employees`

Creates a new employee. `employeeCode` is always server-generated — the next
`EMP-######` code after the current highest one — and any value supplied by
the client for it is ignored.

Request body:

```json
{
  "name": "Ada Lovelace",
  "department": "Engineering",
  "country": "United Kingdom",
  "currencyCode": "GBP",
  "salaryAmount": 85000,
  "joinedAt": "2024-01-15"
}
```

`name`/`department`/`country` are required non-empty strings, `currencyCode`
must be a known key in `config/currencyRates.ts`, `salaryAmount` must be a
positive integer, and `joinedAt` must be a parseable date string. Validation
failures return `400` with per-field messages:

```json
{ "errors": { "salaryAmount": "Salary amount must be greater than zero" } }
```

A valid request returns `201` with the created employee, including its
generated `employeeCode`.

### `PATCH /employees/:id`

Updates an existing employee. Body is any subset of the `POST /employees`
fields — only the fields present are validated and applied; everything else
is left unchanged. `employeeCode`/`id`, if sent, are ignored, same as `POST`.

```json
{ "department": "Finance", "salaryAmount": 95000 }
```

Each present field follows the same validation as `POST`. Validation
failures return `400` with the same per-field error shape. A non-existent
`:id` returns `404`. A successful request returns `200` with the full
updated employee record — including an empty body `{}`, which is a valid
no-op update that returns the record unchanged.

```bash
curl -X PATCH "http://localhost:3000/employees/1" \
  -H "Content-Type: application/json" \
  -d '{"department": "Finance"}'
```

### `DELETE /employees/:id`

Permanently removes an employee — a hard delete, no soft-delete flag, no
recovery after the fact. `:id` must parse as a positive integer, or the
request returns `400`. A non-existent `:id` returns `404`. A successful
delete returns `204 No Content`.

```bash
curl -X DELETE "http://localhost:3000/employees/1"
```

### `GET /config/currencies`

Static reference data for the create-employee form: every known currency
code and a default currency per country. Not derived from employee
records — unlike `/employees/filters`, this doesn't change as employees are
added or removed. No query params.

```bash
curl "http://localhost:3000/config/currencies"
```

```json
{
  "currencies": ["USD", "GBP", "EUR", "INR", "CAD", "AUD"],
  "countryCurrencyDefaults": {
    "United States": "USD",
    "United Kingdom": "GBP",
    "Germany": "EUR",
    "India": "INR",
    "Canada": "CAD",
    "Australia": "AUD"
  }
}
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

The employee list screen has department and country filter dropdowns next to
the search box, populated from `GET /employees/filters`. Each defaults to
"All Departments"/"All Countries" and combines with search via AND.

An "Add Employee" button above the table opens a create form (department/
country/currency populated from `GET /employees/filters` and
`GET /config/currencies`). Selecting a country auto-fills a suggested
currency but never locks the field — see `ARCHITECTURE.md` for why.

Each table row has an Edit action that opens the same form pre-filled from
that row's already-fetched data (no extra fetch). Only the fields you
actually change are sent to the server. Changing the currency (directly, or
via a country change that cascades a new default) clears the salary field
once, with a placeholder reminding you to re-enter it in the new currency —
see `ARCHITECTURE.md` for why this is a frontend-only nudge, not enforced
server-side.

Each row also has a Delete action, guarded by a confirmation prompt — the
delete only fires once you explicitly confirm it, never on the icon click
alone. Deleting the last row on a page automatically returns you to page 1.

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
