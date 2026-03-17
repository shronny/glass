# Glass — Financial Mirror

## Quick Start

```bash
cp .env.example .env    # First time only
docker compose up --build -d
npm run seed            # Optional: seed with dummy data
```

App: http://127.0.0.1:3000

## Commands

- `docker compose up --build -d` — start app + database
- `docker compose down` — stop everything
- `npx drizzle-kit generate` — generate migration from schema changes
- `npx drizzle-kit push` — apply schema to database
- `npm run seed` — seed with dummy data
- `npm run test:run` — run tests once
- `npm run test` — run tests in watch mode
- `./scripts/backup.sh` — backup database
- `./scripts/restore.sh <file>` — restore database

## Architecture

- **Entity layer** (`src/entities/`) — all database operations go through here. No direct Drizzle calls from API routes or components.
- **Computed metrics** (`src/lib/computedMetrics.ts`) — single source of truth for derived calculations.
- **API routes** (`src/app/api/`) — thin handlers that validate input and delegate to entities.
- **Schema** (`src/db/schema.ts`) — single file for all Drizzle table definitions.

## Rules

- Max 400 lines per file (warn at 300)
- No duplication of business logic
- No direct DB calls outside `src/entities/`
- All data is append-only — never delete rows
- Tests go in `__tests__/` folders next to source
- Feature branches for new work
