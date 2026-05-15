# Horaria

Horaria es una plataforma web para generar y gestionar horarios escolares: docentes, cursos, materias, aulas, sedes, restricciones, importaciones y bloques especiales como proyectos, electivas y optativas.

## Requisitos

- Node.js 20 o superior.
- npm.
- Docker Desktop si queres levantar PostgreSQL local con `docker compose`.

## Instalacion en Windows PowerShell

```powershell
npm install
Copy-Item .env.example .env
npx prisma generate
```

## Variables de entorno

El archivo `.env.example` incluye una configuracion local base:

```env
DATABASE_URL="postgresql://horaria:horaria@localhost:5432/horaria?schema=public"
JWT_SECRET="replace-with-a-long-random-secret"
OPTIMIZER_URL="http://localhost:8000"
NEXT_PUBLIC_APP_URL="http://localhost:3000"
HORARIA_DEMO_MODE="true"
GOOGLE_CLIENT_ID=""
GOOGLE_CLIENT_SECRET=""
GOOGLE_REDIRECT_URI="http://localhost:3000/api/auth/google/callback"
```

`HORARIA_DEMO_MODE="true"` permite entrar aunque PostgreSQL no este levantado. Para exigir base real, cambialo a `"false"`.

## Preparar Prisma y la base

Con PostgreSQL en Docker:

```powershell
docker compose up -d postgres
npx prisma generate
npx prisma migrate dev
npm run prisma:seed
```

Tambien podes usar:

```powershell
npm run prisma:generate
npm run prisma:migrate
npm run prisma:seed
```

El seed crea sedes Northfield Nordelta y Northfield Puertos, usuarios demo, docentes, cursos, aulas, materias, solicitudes, importaciones, condiciones, conflictos y bloques especiales.

## Correr el proyecto

```powershell
npm run dev
```

Abrir:

```text
http://localhost:3000
```

## Como entrar

Usuarios demo:

```text
SUPERADMIN
Email: admin@horaria.demo
Password: horaria-demo

CAMPUS_ADMIN Nordelta
Email: vanina@northfield.demo
Password: horaria-demo

SCHEDULER Puertos
Email: mariana@northfield.demo
Password: horaria-demo

VIEWER Nordelta
Email: viewer.nordelta@horaria.demo
Password: horaria-demo

CAMPUS_ADMIN multisede
Email: coordinacion@horaria.demo
Password: horaria-demo
```

Tambien podes tocar `Ver demo` en la home. Ese boton crea una sesion demo y abre `/dashboard`.

Los usuarios que no son `SUPERADMIN` solo ven sus sedes asignadas. Por ejemplo, `vanina@northfield.demo` no ve ni puede consultar datos de Puertos, y `mariana@northfield.demo` no ve ni puede consultar datos de Nordelta.

## Registro

La pantalla `/register` crea una cuenta en estado `PENDING_APPROVAL`. Si la base esta disponible, la solicitud queda guardada en Prisma para revision del superadmin. Si la base no esta disponible y `HORARIA_DEMO_MODE` esta activo, la app devuelve una respuesta demo para no bloquear el flujo.

## Google login

El boton esta preparado, pero queda deshabilitado visualmente hasta configurar credenciales:

```env
GOOGLE_CLIENT_ID=""
GOOGLE_CLIENT_SECRET=""
GOOGLE_REDIRECT_URI="http://localhost:3000/api/auth/google/callback"
```

## Si aparece el error de Prisma

Error:

```text
@prisma/client did not initialize yet. Please run prisma generate
```

Solucion en PowerShell:

```powershell
npx prisma generate
npm run dev
```

Si sigue fallando:

```powershell
Remove-Item -Recurse -Force node_modules
Remove-Item -Force package-lock.json
npm install
npx prisma generate
npm run dev
```

El proyecto tambien ejecuta `prisma generate` en `postinstall` y antes de `next build`.

En Windows puede aparecer un `EPERM` al ejecutar `npm run build` si `npm run dev` esta abierto y mantiene bloqueado el archivo `query_engine-windows.dll.node`. Cerrá el servidor dev o liberá el puerto antes de volver a compilar:

```powershell
$owners = Get-NetTCPConnection -LocalPort 3000 -ErrorAction SilentlyContinue | Where-Object { $_.OwningProcess -ne 0 } | Select-Object -ExpandProperty OwningProcess -Unique
foreach ($owner in $owners) { Stop-Process -Id $owner -Force }
npm run build
```

## Comandos utiles

```powershell
npm install
npx prisma generate
npx prisma migrate dev
npm run prisma:seed
npm run dev
npm run build
npm run typecheck
```

## Rutas principales

- `/`: home publica.
- `/login`: ingreso con email y contrasena.
- `/register`: registro de cuenta pendiente.
- `/dashboard`: panel interno.
- `/teachers`, `/subjects`, `/courses`, `/classrooms`: gestion base.
- `/dashboard/imports`: centro de importacion CSV.
- `/projects`: proyectos, electivas y optativas.
- `/scheduler`: generacion y calendario.
- `/superadmin`: administracion general.
- `/superadmin/requests`: aprobacion o rechazo de registros.

## Roles

- `SUPERADMIN`: ve todas las sedes, usuarios, solicitudes y configuracion.
- `CAMPUS_ADMIN`: administra sedes asignadas.
- `SCHEDULER`: carga datos, genera horarios y revisa conflictos.
- `VIEWER`: consulta horarios y exporta.

## Estado actual

- Login con email y contrasena funcional.
- Modo demo funcional sin base disponible.
- Registro queda pendiente.
- Selector ES/EN activo en home, login, register y shell interno.
- Google OAuth preparado para credenciales reales.
- CSV import funcionando como MVP; XLSX queda preparado para una etapa posterior.
