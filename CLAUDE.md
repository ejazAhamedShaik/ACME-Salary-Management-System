# Project: Employee Salary Management (Incubyte Assessment)

## What this is
A web app for an HR Manager to manage salary records for 10,000 employees across
multiple countries, and answer aggregate questions about org-wide pay. Full context
lives in `REQUIREMENTS.md` (scope + explicit non-goals) and `ARCHITECTURE.md`
(design decisions and trade-offs) — read both before non-trivial changes. Don't
duplicate their content here; link to them instead.

## Stack
- Backend: Node.js + TypeScript + Express, DB - SQLite in local repo setup
- Frontend: React + Vite + TypeScript, React Router, Ant Design
- Testing: Jest + supertest (backend), React Testing Library (frontend)
- Layout: `backend/` and `frontend/` are independent projects, each with their own
  `package.json`. Shared docs live at repo root and in `docs/`.

## Commands
Keep this section updated the moment a script changes — it's the first thing that
goes stale and the first thing a reviewer runs.
- Backend: `cd backend && npm install && npm run dev` · `npm test` · `npm run seed`
- Frontend: `cd frontend && npm install && npm run dev` · `npm test`

## How we work: TDD, no exceptions
1. Write a failing test first. Confirm it actually fails before writing implementation.
2. Write the minimal code to make it pass.
3. Refactor only once green.
4. Commit at each of the three steps above — never bundle them into a single commit.

Commit prefixes: `test:`, `feat:`, `refactor:`, `docs:`, `chore:`, `fix:`. One
logical change per commit; nothing that mixes unrelated concerns.

## Tests
Fast, deterministic, isolated — no dependence on real network calls or state shared
between tests. Use an in-memory or throwaway test DB instance rather than the dev
database. Name tests for the behavior they check ("rejects a salary of zero"), not
generic labels ("test3").

## Keeping docs in sync — read this section carefully
Not all docs should be updated the same way:

- **README.md** — update freely and immediately whenever setup steps, scripts, or
  run instructions change. Mechanical, low-risk. Just do it.
- **ARCHITECTURE.md** — when a real design or trade-off decision is made, draft an
  entry (what was decided, why, what was rejected) in the same commit as the change.
  Where there's a genuine fork in the road, *propose* the options and trade-offs for
  me to choose rather than picking one and documenting it after the fact — the
  reasoning needs to actually be mine.
- **AI_USAGE.md** — draft the factual part only: what was asked, what got generated,
  which files changed. Do **not** write the "why I accepted / changed / rejected
  this" commentary yourself — leave it as `> [human note: ]` for me to fill in. That
  reflection is the part of this file that matters, and it has to be genuinely mine,
  not generated on my behalf.
- **REQUIREMENTS.md** — never edit scope silently. If something during the build
  reveals a gap or contradiction in scope, flag it to me in chat instead of rewriting
  the doc.

## Guardrails
- Don't introduce a new major dependency (ORM, framework, library) without flagging
  it first, even if it would technically solve the immediate problem faster.
- Don't delete or weaken a test to make a build pass — fix the underlying code or
  flag the conflict to me.
- Keep backend/frontend coupled only through the HTTP API — no reaching into the
  other project's internals.

## Definition of done for a feature
Failing test → passing implementation → refactor → relevant docs updated →
committed, in that sequence. Not done until all four have happened.

## Coding standards to be followed
- Frontend: Follow SOLID principles, component driven development, modularity, and single responsibility principles to develop components and screens
- Backend: Follow MCV approach, factory method to develop api's, and SOLID principles