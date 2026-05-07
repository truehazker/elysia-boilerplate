# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working
with code in this repository.

## Development Commands

```bash
# Dependencies
bun install                    # Install dependencies

# Development
bun run dev                    # Start dev server with hot reload
bun run start                  # Start production server
bun run build                  # Build optimized binary

# Database (Drizzle ORM)
bun run db:generate            # Generate migration after schema changes
bun run db:migrate             # Apply pending migrations
bun run db:studio              # Open Drizzle Studio GUI

# Code Quality
bun run lint                   # Check for lint errors
bun run lint:fix               # Auto-fix lint issues
bun run format                 # Format code with Biome

# Testing
bun test                       # Run unit tests (default; no Docker needed)
bun test --coverage            # Unit tests with coverage report
bun run test:int               # Run integration tests against a Postgres testcontainer (requires Docker)

# Docker
docker-compose up -d           # Start all services (app + postgres)
docker-compose up -d elysia-boilerplate-postgres  # PostgreSQL only
docker-compose logs -f         # View logs
docker-compose down            # Stop all services
```

## Architecture Overview

### Request Flow

1. Request enters through `src/main.ts` (root Elysia app)
2. Global middleware applied: CORS, error handling, OpenAPI
3. Routed to module in `src/modules/` (e.g., `/users` -> `src/modules/users/`)
4. Module structure: `index.ts` (routes) -> `service.ts` (business logic) -> database

### Logger Architecture (CRITICAL)

The logger is initialized **once** in `src/main.ts`. To avoid duplicate logs:

- **DO NOT** use logger from Elysia context (`ctx.log`) in submodules
- **ALWAYS** import logger directly: `import { log } from 'src/common/logger'`
- Create child loggers for modules: `const log = logger.child({ name: 'module-name' })`

Example from `src/modules/users/index.ts`:

```typescript
import { log as logger } from 'src/common/logger';
const log = logger.child({ name: 'users' });
```

### Module Pattern

Each module in `src/modules/` follows this structure:

1. **`schema/` in `src/db/schema/`**: Drizzle table definition + validation schemas
   - Define table with `pgTable()`
   - Export `createInsertSchema`, `createSelectSchema`, `createUpdateSchema`
     from drizzle-typebox
   - Add Elysia field refinements (validation rules)

2. **`model.ts`**: Type definitions and Elysia model plugin
   - Define request/response types using Elysia's `t` (TypeBox)
   - Create namespace (e.g., `UsersModel`) with typed DTOs
   - Export Elysia plugin with `.model()` to register schemas

3. **`service.ts`**: Business logic and database operations
   - Pure functions that interact with database
   - No HTTP concerns (status codes, headers, etc.)
   - No HTTP concerns (status codes, headers, etc.)

4. **`index.ts`**: Route definitions (Elysia controller)
   - Define routes with `.get()`, `.post()`, etc.
   - Reference models by string: `body: 'users.createRequest'`
   - Catch specific errors and map to HTTP with `status()` from Elysia
   - Let unknown errors propagate to the global handler
   - OpenAPI documentation in `detail` field

### Database Schema Pattern

When creating/modifying tables in `src/db/schema/`:

```typescript
// 1. Define table
export const users = pgTable('users', {
  id: uuid('id').primaryKey().$defaultFn(() => Bun.randomUUIDv7()),
  // ... fields
});

// 2. Define validation refinements for Elysia
const fieldRefinements = {
  name: t.String({ minLength: 1, maxLength: 255 }),
};

// 3. Create schemas (avoid infinite type instantiation)
const _userCreate = createInsertSchema(users, fieldRefinements);
const _userSelect = createSelectSchema(users, fieldRefinements);
const _userUpdate = createUpdateSchema(users, fieldRefinements);

// 4. Export with explicit types
export const userCreate = _userCreate;
export const userSelect = _userSelect;
export const userUpdate = _userUpdate;
```

After schema changes, run `bun run db:generate` to create migration.

### Environment Configuration

- All env vars validated in `src/common/config.ts` using Envalid
- **NEVER** use `process.env` or `Bun.env` directly in application code
- Always import: `import config from 'src/common/config'`
- Available config: `NODE_ENV`, `LOG_LEVEL`, `SERVER_HOSTNAME`,
  `SERVER_PORT`, `DATABASE_DSN`, `DB_POOL_MAX`, `DB_AUTO_MIGRATE`,
  `ENABLE_OPENAPI`
- `.env.test` ships in the repo with placeholder values. Bun
  auto-loads it whenever `NODE_ENV=test` (which `bun test` sets
  automatically), so unit tests don't need any externally-provided
  env. Integration tests overwrite `DATABASE_DSN` from the preload
  after starting their testcontainer.

### Error Handling

Global error handler in `src/middleware/error-handler.ts`
(registered with `{ as: 'global' }` to cover all plugins):

- Elysia's handled errors (status codes) pass through
- Unhandled errors are logged with context (method, URL, referrer)
- Clients receive generic "Internal Server Error" (never expose details)

### Health Endpoints

- `GET /health` -- liveness check, returns `{ status: 'pass' }`
- `GET /ready` -- readiness check, verifies DB connectivity
- Responses use `application/health+json` content type per IETF draft
- Status values follow RFC: `pass`, `fail`, `warn`

### Bootstrap Process

`src/main.ts` bootstrap function:

1. Run database migrations (if `DB_AUTO_MIGRATE=true`)
2. Start HTTP server
3. Register graceful shutdown handlers (SIGINT, SIGTERM)

If bootstrap fails, app logs fatal error and exits with code 1.

## Branch Strategy

- `main`: Production releases
- `develop`: Integration branch (default PR target)
- `feature/*`: New features
- GitHub Actions run lint checks on push/PR to `main` and `develop`

## TypeScript Configuration

- Strict mode enabled (`strict: true`)
- No unchecked indexed access (`noUncheckedIndexedAccess: true`)
- Module resolution: `bundler` (Bun-specific)
- Base URL set to `.` for absolute imports from project root

## Testing

Tests live under a single `tests/` tree, split into tiers so each tier
can be configured (and skipped) independently:

```text
tests/
├── unit/                       # Fast, mock-everything tests. No Docker.
│   ├── users/
│   │   └── users.unit.spec.ts
│   └── health/
│       └── health.unit.spec.ts
├── int/                        # Real Postgres via Testcontainers. Docker required.
│   ├── setup.ts                # Preload — boots container, exports helpers
│   ├── users/
│   │   └── users.int.spec.ts
│   └── health/
│       └── health.int.spec.ts
└── e2e/                        # Reserved for full HTTP/end-to-end tests.
    └── <feature>.e2e.spec.ts   # Naming: <feature>.e2e.spec.ts (flat layout).
```

Conventions:

- File names follow `<subject>.<tier>.spec.ts`. `*.spec.ts` is matched
  by Bun's default discovery.
- Unit and integration tests group by module (`unit/<module>/...`,
  `int/<module>/...`). E2E tests are typically cross-module and live
  flat under `tests/e2e/`.
- All new features require unit tests at minimum; service code that
  hits the database should also have an integration test.

### How `bun test` is wired

- `bunfig.toml` sets `[test].root = "tests/unit"`, so the default
  `bun test` runs only the unit tier — fast, no Docker.
- `bun run test:int` invokes Bun with `--preload ./tests/int/setup.ts`
  and the int directory (`./tests/int`) as the test target, so Bun
  walks it recursively regardless of subfolder depth.
- `bun run test:e2e` (add when the first e2e test lands) follows the
  same pattern: explicit directory target, with or without a preload.

Because the tiers run as separate `bun test` invocations, each can
have its own preload, env vars, timeouts, or other configuration with
no cross-contamination.

#### Ad hoc runs (running a single spec)

Because `[test].root = "tests/unit"`, paths outside that root must be
prefixed with `./` so Bun treats them as paths rather than filters:

```bash
# Single unit spec — works as a filter within bunfig root
bun test users.unit

# Single integration spec — needs ./ prefix AND the preload
bun test --preload ./tests/int/setup.ts ./tests/int/users/users.int.spec.ts
```

For most local work just use the tier scripts (`bun test`, `bun run
test:int`).

### How the integration preload works

`tests/int/setup.ts` is loaded as a Bun **preload** — it runs before
any test file is parsed, so it can:

1. Boot a single shared `postgres:16-alpine` container.
2. Set `process.env.DATABASE_DSN` to the container URI.
3. Apply Drizzle migrations.
4. Register cleanup hooks (`afterAll` + `beforeExit`/signals, with a
   bounded timeout so a hung `container.stop()` can't stall the run).

Because env is set before any test file loads, integration tests use
**plain static imports** — `import { UsersService } from
'src/modules/users/service'` works exactly like in unit tests, and
`src/db` constructs its singleton against the test container.

The setup module also exports:

- `testDb` — the Drizzle handle bound to the container, useful for
  direct assertions on persisted state.
- `resetDatabase()` — discovers public-schema tables via `pg_tables`
  and truncates them with `RESTART IDENTITY CASCADE` (using
  `sql.identifier` for safe quoting). Call from `beforeEach` for full
  per-test isolation. Drizzle's bookkeeping in the `drizzle` schema is
  untouched, so migrations don't re-run.

### Adding a new integration test

1. Create `tests/int/<module>/<subject>.int.spec.ts`.
2. Static-import services and schema from `src/...` as usual.
3. The preload registers a global `beforeEach(resetDatabase)`, so each
   test starts from a clean schema — no per-file boilerplate needed.
   Import `testDb` from `../setup` if you need to assert directly on
   persisted state.
4. The `test:int` script targets the `./tests/int` directory, so Bun
   walks it recursively — your file is picked up automatically with
   no script edits.

## Code Style

- Linter: Biome (config in `biome.json`)
- Run `bun run lint:fix` before committing
- No `any` types unless absolutely necessary
- Use explicit imports (no `import *`)
