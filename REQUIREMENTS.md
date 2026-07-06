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
2. Add a new employee, or correct/update an existing salary record.
3. Answer, without exporting to Excel, questions such as:
   - What's the average salary by department? By country?
   - How many employees do we have per department / per country?
   - What's our total payroll cost, overall and by country?
   - Which employees are outliers (highest/lowest paid) within a department?

## In Scope (MVP)
- **Employee directory** — paginated, searchable, filterable list (by name,
  department, country). Must stay fast at 10,000 records.
- **Create / edit employee** — name, department, country, currency, salary, join
  date, with basic validation (required fields, no negative or zero salary).
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
- Role-based access control
- Salary history / raise tracking over time
- Real-time FX rates
- Payroll / tax system integration