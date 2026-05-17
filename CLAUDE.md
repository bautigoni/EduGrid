# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Stack and tools

- Next.js 15 (App Router) + React 19 + TypeScript (strict).
- Tailwind CSS + shadcn-style UI primitives under `src/components/ui`.
- Auth: custom JWT in an `httpOnly` cookie (`horaria_session`), see `src/lib/auth.ts`.
- Persistence: **SQLite via better-sqlite3**. One file: `data/horaria.db`. There is no Prisma, no PostgreSQL, no Docker required locally.

## Commands

```powershell
# install
npm install

# bring up the database (idempotent)
npm run db:init          # creates data/horaria.db and applies db/schema.sql
npm run db:migrate       # re-applies db/schema.sql and runs any new db/migrations/NNN_*.sql
npm run db:seed:clean    # superadmin user + base sede + two invitation codes
npm run db:seed:demo     # two demo sedes + subject catalog
npm run db:backup        # copies data/horaria.db into data/backups/

# dev / build / quality
npm run dev
npm run build
npm run lint
npm run typecheck
```

Demo login after `db:seed:clean`: `admin@horaria.local` / `horaria-admin`. Registration is invite-code only; `HORARIA-SUPERADMIN-2026` and `MAIN-COORDINADOR-2026` are created by the clean seed.

## Architecture overview

### Data plane (server)

- `src/lib/db.ts` — singleton `better-sqlite3` connection. Always go through `getDb()`; it creates `data/` on demand and enables `foreign_keys` + WAL. `newId(prefix)` and `nowIso()` are the standard id/timestamp helpers used everywhere.
- `db/schema.sql` — **canonical, idempotent schema** for every operational table plus analytics views (`view_teacher_load`, `view_course_weekly_requirements`, `view_schedule_assignments_full`, `view_conflicts_summary`, `view_subject_hours_by_course`). `npm run db:init` and `db:migrate` both execute this file; future incremental migrations go in `db/migrations/NNN_*.sql` and are tracked in `_schema_migrations`.
- `src/server/repositories/*` — the only place that issues SQL. Routes and pages must depend on these functions, not on `getDb()` directly. Notable repos:
  - `campuses.ts` (also seeds default time blocks when a new campus is created).
  - `users.ts`, `invitationCodes.ts`.
  - `subjects.ts` (catalog only — no weekly hours here).
  - `courses.ts` exposes `getCourseSubjectRequirements` and `saveCourseSubjectRequirements`; weekly hours belong to a `course_subject_requirements` row keyed by `(course_id, subject_id)`.
  - `teachers.ts` exposes `saveTeacherSubjects` and `saveTeacherCourseEligibility` (both do delete-then-insert inside a transaction).
  - `availability.ts` writes `teacher_availability` / `course_availability` keyed by `time_block_id`.
  - `timeBlocks.ts` — `defaultBlocks` is the institutional grid (7 CLASS blocks + 4 BREAK/MINI_BREAK/LUNCH rows, durations 60/65/50 min); `seedDefaultTimeBlocksForCampus` materializes it Mon–Fri.

### Scheduler

- `src/lib/scheduler.ts` — greedy generator. Read it before changing scheduling behavior. Today it: deletes the campus's previous `schedule_assignments` and `conflicts`, creates a new `schedule_versions` row, then for each course×subject requirement walks `assignable` time blocks honoring teacher availability + course availability + `teacher_subjects` + `teacher_course_eligibility` + per-teacher contractual minutes ceiling, and inserts both assignments and unfulfilled-requirement conflicts.
- `getLatestScheduleForCampus(campusId)` powers the planner view and exports.
- The Python optimizer in `optimizer/` is legacy and no longer wired up.

### Auth and scoping

- `src/lib/auth.ts` mints/verifies the JWT. The session payload carries `id`, `role`, `selectedCampusId`, `campusIds`.
- `src/lib/access-control.ts` is the gate for every API route. Always wrap handlers with `requireAuth()`, then `requireRole(...)` and `requireCampusAccess(user, campusId)`. `resolveCampusScope` / `getScopedCampusIds` query SQLite — non-superadmins are restricted to their `user_campuses` rows.
- `src/lib/demo-scope.ts` is the server-side aggregator used by page-level server components. It returns the scoped campus, teachers, courses, subjects, and time blocks for the current session. UI never reaches for arrays from `@/lib/demo-data` (that module is now a back-compat shim that only re-exports presentational constants like `days` and the default `timeBlocks`).

### App router layout

- `/planner` is the main workspace: `PlannerClient` renders the weekly grid, hits `/api/scheduler/generate`, and applies the active filter to Excel/PDF exports.
- `/planner/print` is a server-rendered, print-friendly colored schedule. `/api/export/pdf` 302-redirects there; users save via the browser's "Save as PDF".
- `/teachers`, `/courses`, `/subjects` each use a **full-screen modal** (`src/components/ui/full-screen-modal.tsx`) for create/edit. The teacher and course modals use tabs (`data` / `subjects` / `eligibility` / `availability` for teachers; `data` / `subjects` / `availability` for courses) and PUT to the corresponding sub-endpoints (`/api/teachers/[id]/subjects|eligibility|availability`, `/api/courses/[id]/subjects|availability`).
- `/superadmin/campuses` and `/superadmin/invitation-codes` are the SUPERADMIN-only management surfaces.

### API conventions

- All write endpoints expect a `campusId` in the body (or `?campusId=` for DELETE) and validate it with `requireCampusAccess`.
- Updates that own a collection (teacher↔subject, teacher↔course, requirements, availability) use PUT with the full desired set; the repository deletes existing rows and re-inserts inside a transaction.
- Subject add/remove on a course must key on `subject.id`, never on subject name — the historical bug (last/Física couldn't be added) was a name-based dedupe.

### Roles

- Only **SUPERADMIN** and **COORDINADOR_HORARIOS** are actively used. Legacy values (`CAMPUS_ADMIN`, `SCHEDULER`, `VIEWER`) are still accepted by `SessionUser` and `requireRole` for sessions created before the simplification, but the UI doesn't offer them. Registration sets the role from the invitation code, never from a form field.

## Editing notes specific to this repo

- `src/lib/demo-data.ts` is a thin presentational shim. Don't add operational data there — write to SQLite via a repository.
- Subjects are a catalog only. Weekly hours per subject live on `course_subject_requirements`, not on `subjects`. Don't put "horas semanales" columns in the Subjects page.
- Availability grids must keep Friday visible: use `grid-cols-[<col>_repeat(5,1fr)]` inside an `overflow-x-auto` container with a `min-w-[…]` inner wrapper. The shared `AvailabilityGrid` already does this; matching planner/print tables follow the same pattern.
- The teacher edit modal disables "Guardar cambios" while available time exceeds `contractual_weekly_minutes` (hours × 60). Keep this invariant if you touch the modal.
- `optimizer/main.py`, `src/app/api/scheduler/validate/route.ts`, and `src/app/api/classrooms/route.ts` are stubs — fine to extend, but don't reintroduce Prisma or mock arrays as source of truth.
