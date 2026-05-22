# Production Deployment (Docker / VPS)

## Prerequisites

- Docker + Docker Compose installed on the VPS
- Project checked out at `/opt/apps/horaria`

## First-time setup

```bash
cd /opt/apps/horaria

# Build and start the container
docker compose up -d --build

# Initialize the database (idempotent — safe to re-run)
docker exec -it horaria npm run db:init
docker exec -it horaria npm run db:migrate
docker exec -it horaria npm run db:seed:demo

# Or use the single convenience command:
docker exec -it horaria npm run setup:prod
```

After seeding, the admin account is:

- **Email:** `admin@horaria.local`
- **Password:** `horaria-admin`

## Re-deploy (after code update)

```bash
cd /opt/apps/horaria
docker compose down
docker compose up -d --build
# Re-run migrations only (seed:demo is idempotent — safe to run again)
docker exec -it horaria npm run db:migrate
docker logs --tail=100 horaria
```

## Verify the database

```bash
docker exec -it horaria node -e "
const Database=require('better-sqlite3');
const db=new Database('/app/data/horaria.db');
console.log(db.prepare(\"SELECT name FROM sqlite_master WHERE type='table'\").all());
"
```

Expected output includes `users`, `campuses`, `teachers`, etc.

## Verify admin login

```bash
docker exec -it horaria node -e "
const Database=require('better-sqlite3');
const db=new Database('/app/data/horaria.db');
console.log(db.prepare(\"SELECT id, email, role, status FROM users WHERE email='admin@horaria.local'\").get());
"
```

## Data persistence

The `docker-compose.yml` mounts `./data` on the host to `/app/data` inside the container:

```yaml
volumes:
  - ./data:/app/data
environment:
  - DATABASE_PATH=/app/data/horaria.db
```

The SQLite file lives at `/opt/apps/horaria/data/horaria.db` on the host and survives container restarts and rebuilds.

## Logs

```bash
docker logs --tail=100 horaria
docker logs -f horaria   # follow
```

## Backup

```bash
docker exec -it horaria npm run db:backup
# Backup written to /app/data/backups/ (persisted on host at ./data/backups/)
```
