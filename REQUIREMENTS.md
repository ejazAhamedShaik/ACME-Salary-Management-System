# Employee Salary Management — Requirements

## Problem
ACME's HR team currently manages salary data for 10,000 employees across multiple
countries using spreadsheets. This is slow to update, error-prone at this scale, and
makes it hard to answer basic questions about how the organization pays its people.
This project replaces that workflow with a web-based tool.

## Primary User
HR Manager — a single-user persona for this MVP. No other roles are in scope.

## What This Tool Must Let the HR Manager Do
1. Find and review any employee's salary record quickly, even across 10,000 people.
2. Add a new employee, correct/update an existing salary record, or remove an
   employee who has departed.
3. Answer, without exporting to Excel, questions such as:
   - What's the average salary by department? By country?
   - How many employees do we have per department / per country?
   - What's our total payroll cost, overall and by country?
   - Which employees are outliers (highest/lowest paid) within a department?

## In Scope (MVP)
- **Employee directory** — paginated, searchable, filterable list (by name,
  employee code, department, country). Must stay fast at 10,000 records.
- **Create / edit / remove employee** — name, department, country, currency,
  salary, join date, with basic validation (required fields, no negative or
  zero salary). Removal is a hard delete, not a soft/flagged one — consistent
  with salary history already being out of scope; there's nothing to preserve.
- **Compensation insights** — a small, fixed set of views answering the questions
  above (by department, by country, distribution/outliers). This is a purpose-built
  reporting view, not a general BI tool.
- **Seed data** — script generating 10,000 realistic, deterministic employee records
  across multiple departments and countries.

## Deliberately Out of Scope (and why)

| Feature | Why it's excluded |
|---|---|
| Authentication / roles | Persona is a single HR Manager; multi-user access control adds real complexity for a need the brief doesn't state. |
| Salary history / audit trail | Requires a versioned data model (raises, promotions over time). A current snapshot satisfies the stated problem; a natural next step. |
| Payroll processing (tax, deductions, payslips) | The brief asks for salary *management*, not a payroll engine — a materially different, much larger problem. |
| Live currency conversion | Cross-country aggregates need a common currency, but a live FX API is an external dependency the brief doesn't call for. A small static conversion table is used instead (see Assumptions). |

## Key Assumptions
- Each record stores salary as a native amount + currency code. Cross-country
  aggregates use a small, static, documented conversion table — fine for demo-scale
  insight, explicitly not production-accurate FX handling.
- Department and country are drawn from a fixed, realistic list for seeding purposes,
  not a configurable taxonomy.
- No integration with any external HR, payroll, or identity system.

## Non-Functional Note
At 10,000 records, "query everything and filter in memory" won't hold up. The
directory and insight views are expected to use pagination and indexed queries, not
full-table scans. Deeper architecture and performance decisions are covered
separately in `ARCHITECTURE.md`.

## Explicitly Deferred (good next steps, not MVP)
Grouped by kind rather than listed flat, since "what's not built" spans a few
different categories of reasoning. If continuing, priority order would be:
(1) sorting — cheapest, most obviously missing from a v1 list view; (2) the
department × country cross-tab — highest product value of anything here;
(3) Postgres over SQLite — the biggest gap between this and a real deployment.

**Feature completeness**
- Sort on the employee list (deferred at the GET /employees step; search and
  filtering shipped, sorting did not)
- Bulk create / CSV import; no way to add a new department or country value
  from the UI — the fixed seed-time list is also the only list
- Bulk delete; no undo/recovery after a delete (hard delete was the
  deliberate choice — see table above)
- Multi-select on department/country filters (single-select was the MVP call)
- Department × country cross-tab for average salary (e.g., "average
  Engineering salary in Germany vs. India") — the current by-department and
  by-country views are independent marginals, not a combined breakdown
- Role-based access control
- Salary history / raise tracking over time
- Real-time FX rates
- Payroll / tax system integration

**UX polish**
- Charts/visualizations on the insights screen (Ant Design's own Table/
  Statistic components were the deliberate choice, not a technical limit)
- Drill-down interactivity (e.g., clicking a department to filter the
  employee list to it)
- Optimistic UI updates on create/edit/delete (currently wait-then-refetch —
  itself a deliberate simplicity call, not an oversight)

**Production-readiness** — things that were reasonable *because this is an
assessment*, worth being explicit about rather than presenting as finished
- SQLite + auto-reseed-on-startup was a deliberate simplification for
  assessment scale; a real deployment would need persistent Postgres
- Render's free-tier cold start is a demo-experience limitation of the
  hosting tier, not a design flaw in the app
- No monitoring/observability, no CI pipeline beyond auto-deploy-on-push
- Simple highest/lowest outlier detection vs. a statistical (IQR-based)
  approach — reasoning already in `ARCHITECTURE.md`

## Amendments
- **2026-07-07** — Employee directory search expanded to include employee code,
  not just name. Discovered during implementation: HR teams commonly look an
  employee up by code/ID (e.g., from a ticket or another system), not only by
  name. Original scope was an oversight rather than a deliberate exclusion.
- **2026-07-08** — DELETE added to scope. Flagged as an open question while
  create/edit were being built, deliberately left undecided rather than
  defaulted into; confirmed in scope once the rest of the CRUD surface was
  complete. Real offboarding need (an employee leaves, their record should be
  removable) outweighs the small added surface area.
- **2026-07-09** — Deferred-items list consolidated. Several exclusions were
  decided in the moment while building individual features (noted in that
  feature's own build session) but never rolled up here. Gathered into one
  place, grouped by kind, with a priority order, ahead of submission.