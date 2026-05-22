# Production Deployment (Docker / VPS)

## Prerequisites

- Docker + Docker Compose installed on the VPS
- Project checked out at `/opt/apps/horaria`

---

## First-time setup

```bash
cd /opt/apps/horaria

# Build image and start container
# --build is required: it compiles the Next.js app and copies scripts/ src/ db/
# into the image so DB commands work inside the container.
docker compose up -d --build

# Initialize the database (idempotent — safe to re-run)
docker exec -it horaria npm run db:init
docker exec -it horaria npm run db:migrate
docker exec -it horaria npm run db:seed:demo

# Or use the convenience command that runs all three:
docker exec -it horaria npm run setup:prod
```

After seeding, the admin account is:

| Field    | Value                |
|----------|----------------------|
| Email    | `admin@horaria.local` |
| Password | `horaria-admin`       |

---

## Re-deploy after a code update

```bash
cd /opt/apps/horaria

# IMPORTANT: always pass --build so the image is rebuilt with the latest code.
# Skipping --build reuses the old image — scripts/ and src/ inside the
# container will be stale.
docker compose down
docker compose up -d --build

# Migrations only (seed:demo is idempotent — safe to run again)
docker exec -it horaria npm run db:migrate

docker logs --tail=100 horaria
```

---

## Verify the database

Check that all tables exist:

```bash
docker exec -it horaria node -e "
const Database=require('better-sqlite3');
const db=new Database('/app/data/horaria.db');
console.log(db.prepare(\"SELECT name FROM sqlite_master WHERE type='table'\").all());
"
```

Expected output includes `users`, `campuses`, `teachers`, `courses`, `subjects`, etc.

Check that the admin user exists:

```bash
docker exec -it horaria node -e "
const Database=require('better-sqlite3');
const db=new Database('/app/data/horaria.db');
console.log(db.prepare(\"SELECT id, email, role, status FROM users WHERE email='admin@horaria.local'\").get());
"
```

Verify scripts directory is present inside the container:

```bash
docker exec -it horaria ls -la /app/scripts
```

---

## Data persistence

`docker-compose.yml` mounts `./data` on the host to `/app/data` inside the container:

```yaml
volumes:
  - ./data:/app/data
environment:
  - DATABASE_PATH=/app/data/horaria.db
```

The SQLite file lives at `/opt/apps/horaria/data/horaria.db` on the host and
survives container restarts and image rebuilds.

---

## Logs

```bash
docker logs --tail=100 horaria
docker logs -f horaria   # follow in real time
```

---

## Backup

```bash
docker exec -it horaria npm run db:backup
# Written to /app/data/backups/ — persisted on host at ./data/backups/
```

---

## Troubleshooting

### `ERR_MODULE_NOT_FOUND: Cannot find module '/app/scripts/...'`

The running container was built before the `scripts/` COPY was added to the
Dockerfile. Rebuild the image:

```bash
docker compose down
docker compose up -d --build
```

### `SqliteError: no such table: users`

The database file exists but has no tables. Run:

```bash
docker exec -it horaria npm run setup:prod
```

### Login returns "El servidor no está inicializado"

Same as above — the database has not been seeded. Run `setup:prod`.
