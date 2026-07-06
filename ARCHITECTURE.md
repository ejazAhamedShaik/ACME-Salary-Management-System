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
