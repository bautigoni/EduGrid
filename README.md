# Horaria

Horaria is a full-stack EdTech SaaS platform for school timetable generation and management. It supports multi-campus schools, account approval, role-based access, imports from existing spreadsheets, custom scheduling conditions, and special blocks such as projects, electives, optatives and workshops.

## Run locally

```bash
npm install
cp .env.example .env
npm run dev
```

Open `http://localhost:3000`.

Demo credentials:

```text
admin@horaria.demo
horaria-demo
```

## Database

Horaria uses PostgreSQL and Prisma.

```bash
docker compose up -d postgres
npx prisma db push
npm run prisma:seed
```

The seed creates two campuses: Northfield Nordelta and Northfield Puertos, plus teachers, courses, classrooms, custom conditions, imports, users, registration requests and special program blocks.

## Authentication and roles

Email/password auth is implemented with secure password hashes and a signed HTTP-only session cookie. Routes under the internal app are protected by middleware.

Roles:

- `SUPERADMIN`: all campuses, approvals, users, schedules and settings.
- `CAMPUS_ADMIN`: assigned campuses and local approvals.
- `SCHEDULER`: timetable creation and manual edits for assigned campuses.
- `VIEWER`: view and export only.

User statuses:

- `PENDING_APPROVAL`
- `ACTIVE`
- `REJECTED`
- `SUSPENDED`

## Google login

The Google OAuth entrypoint is prepared at `/api/auth/google`. Configure:

```env
GOOGLE_CLIENT_ID=""
GOOGLE_CLIENT_SECRET=""
GOOGLE_REDIRECT_URI="http://localhost:3000/api/auth/google/callback"
```

If credentials are missing, the app returns to login with a clear setup message.

## Registration approval

New users register at `/register`. They submit full name, email, password, institution, requested campus, requested role and an optional message. Accounts are created as pending. Superadmins review them at `/superadmin/requests` and can approve or reject.

## Multi-campus support

Campus is a first-class model. Teachers, courses, classrooms, blocked slots, schedule versions, imports, conditions and special blocks belong to a campus. The top bar includes a campus selector. Superadmins can see all campuses; other roles are intended to be scoped by `UserCampus`.

## Imports

The Import Center lives at `/dashboard/imports`.

Supported now:

- CSV upload
- preview first rows
- validation errors
- template download

Prepared contract:

- XLSX support can be added behind the same preview API.

Templates:

- Disponibilidad horaria
- Horarios cursos
- Horarios por aula

## Scheduler

The Next API calls a Python FastAPI microservice using Google OR-Tools CP-SAT.

It handles:

- regular subject requirements
- teacher availability
- classroom conflicts
- course conflicts
- campus filtering
- special program blocks
- multiple required teachers in the same block
- fixed project day/time
- custom condition payloads

If the optimizer is unavailable, the app returns a deterministic demo schedule with conflict explanations, so the UI remains usable.

## Projects, electives and optatives

`ProgramBlock` models special blocks such as Ciudadanos, Electiva de Tecnologia, Optativa de Arte, Taller Maker and Proyecto Interdisciplinario. Blocks can require simultaneous teachers, simultaneous courses, specific room types, preferred rooms, fixed slots and priority.

## Languages

Spanish is the default language. Use the language switcher in the top bar to switch to English. The shared shell and new navigation use translation keys; remaining content is mostly Spanish by design for the current demo.

## Exports

The scheduler exposes:

- `/api/export/pdf`
- `/api/export/excel`

Excel currently returns CSV-compatible content for broad spreadsheet support.

## Docker

```bash
docker compose up --build
```

This starts PostgreSQL, the optimizer service and the Next.js app.

## Known limitations

- Google OAuth callback is scaffolded but not finalized without credentials.
- XLSX import parsing is represented by the API contract; CSV is fully implemented.
- Approval actions persist in Prisma when a database is available and use a mock response otherwise.
- Some old MVP pages still use static demo data, but the schema and APIs are ready for live campus filtering.

## Next steps

- Add full Auth.js Google callback.
- Persist selected campus in the user profile.
- Add full CRUD forms for every entity.
- Add XLSX parser support.
- Store generated optimizer results as schedule versions.
