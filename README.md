# Horaria

Horaria es una plataforma web para que el equipo coordinador arme y mantenga los horarios escolares: docentes, cursos, materias, bloques horarios, disponibilidad y generación automática.

La base de datos es **SQLite** (un único archivo en `data/horaria.db`). No requiere Prisma, PostgreSQL ni Docker para desarrollo local.

## Requisitos

- Node.js 20 o superior.
- npm.

## Cómo iniciar en localhost

1. Instalar dependencias

```powershell
npm install
```

2. Crear la base SQLite

```powershell
npm run db:init
```

Crea el archivo `data/horaria.db` y aplica el esquema inicial.

3. Ejecutar migraciones (idempotente)

```powershell
npm run db:migrate
```

Vuelve a aplicar `db/schema.sql` y cualquier migración numerada en `db/migrations/`.

4. Cargar datos iniciales limpios

```powershell
npm run db:seed:clean
```

Crea un usuario superadmin (`admin@horaria.local` / `horaria-admin`), una sede mínima y dos códigos de invitación.

Para datos demo (dos sedes ficticias + catálogo de materias):

```powershell
npm run db:seed:demo
```

5. Iniciar la app

```powershell
npm run dev
```

Abrir <http://localhost:3000>.

## Archivo de base de datos

- Ubicación: `data/horaria.db`
- Formato: SQLite estándar.
- Podés abrirlo con [DB Browser for SQLite](https://sqlitebrowser.org/) o SQLiteStudio para hacer consultas y analytics.

Para hacer un backup manual:

```powershell
npm run db:backup
```

Copia el archivo actual a `data/backups/horaria-<timestamp>.db`.

**Importante**: los datos no se regeneran automáticamente. El seed sólo corre cuando se ejecuta manualmente.

## Registro

El registro funciona con **códigos de invitación**. La pantalla `/register` pide:

- Nombre completo
- Email
- Contraseña
- Código de invitación
- Mensaje opcional

El código define automáticamente la sede y los permisos. Nunca se muestra una lista de sedes a usuarios sin autenticar.

Códigos demo (sólo en desarrollo o luego de `db:seed:clean` / `db:seed:demo`):

```
HORARIA-SUPERADMIN-2026     → Superadmin global
MAIN-COORDINADOR-2026       → Coordinador Sede Principal (seed:clean)
NORDELTA-HORARIOS-2026      → Coordinador Northfield Nordelta (seed:demo)
PUERTOS-HORARIOS-2026       → Coordinador Northfield Puertos (seed:demo)
```

## Roles

- **SUPERADMIN**: ve todas las sedes, crea sedes y administra los códigos de invitación.
- **COORDINADOR_HORARIOS**: usuario principal de la sede. Crea docentes, cursos, materias, configura disponibilidad y genera el horario.

Otros roles legados (CAMPUS_ADMIN, SCHEDULER, VIEWER) siguen aceptándose en sesiones existentes pero no se ofrecen en el registro.

## Rutas principales

- `/`: home.
- `/login`: ingreso con email y contraseña.
- `/register`: registro con código de invitación.
- `/planner`: planificador (calendario, generación y export). **Workspace principal.**
- `/teachers`, `/subjects`, `/courses`: ABM con modales full-screen.
- `/superadmin/campuses`: ABM de sedes (sólo superadmin).
- `/superadmin/invitation-codes`: gestión de códigos de invitación.

## Exportar

El planificador ofrece:

- **Exportar Excel**: CSV listo para abrir en Excel/LibreOffice.
- **Exportar PDF**: redirige a `/planner/print`, una vista en formato calendario, lista para `Imprimir → Guardar como PDF` desde el navegador.
- **Imprimir**: imprime la vista actual.

Todos respetan el filtro activo (todo / por curso / por docente / por materia).

## Comandos útiles

```powershell
npm install
npm run db:init
npm run db:migrate
npm run db:seed:clean
npm run db:seed:demo
npm run db:backup
npm run dev
npm run build
npm run lint
npm run typecheck
```

## Notas

- No hay dependencia de PostgreSQL, Docker ni Prisma.
- Toda la persistencia pasa por `better-sqlite3`. Acceso vía `src/lib/db.ts` (singleton) y las repositorías en `src/server/repositories/`.
- El esquema canónico vive en `db/schema.sql` y es idempotente. Las migraciones futuras se agregan como `db/migrations/NNN_descripcion.sql` y se aplican una vez (`db:migrate` registra cada una en `_schema_migrations`).
- Docker queda **opcional**, sólo para despliegues VPS si se quiere empaquetar la app.

## Estado actual

- Persistencia real en SQLite.
- Registro con código de invitación.
- ABM completo en docentes, cursos, materias y sedes.
- Generador de horario greedy que respeta materias compatibles, años/cursos elegibles, disponibilidad y carga contractual.
- Export a Excel/CSV y a PDF vía vista de impresión coloreada.
