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
bun run test:e2e               # Run full-stack e2e tests against a Postgres testcontainer (requires Docker)

# Docker
docker-compose up -d           # Start all services (app + postgres)
docker-compose up -d elysia-boilerplate-postgres  # PostgreSQL only
docker-compose logs -f         # View logs
docker-compose down            # Stop all services
```

## Architecture Overview

### Request Flow

1. Root Elysia app is composed in `src/app.ts`; the `serve` command
   (`src/commands/serve.ts`), dispatched from the CLI entrypoint
   `src/cli.ts`, boots it (`listen`, graceful shutdown)
2. Global middleware applied: telemetry, request-ID, CORS, error handling, OpenAPI
3. Routed to module in `src/modules/` (e.g., `/users` -> `src/modules/users/`)
4. Module structure: `index.ts` (routes) -> `service.ts` (business logic) -> database

### Logger Architecture (CRITICAL)

The logger is initialized **once** in `src/common/logger`. To avoid duplicate logs:

- **DO NOT** use logger from Elysia context (`ctx.log`) in submodules
- **ALWAYS** import logger directly: `import { log } from 'src/common/logger'`
- Create child loggers for modules: `const log = logger.child({ name: 'module-name' })`

Example from `src/modules/users/index.ts`:

```typescript
import { log as logger } from 'src/common/logger';
const log = logger.child({ name: 'users' });
```

Every log line is automatically tagged with the in-flight request's
correlation ID (`requestId`) and — when telemetry is enabled — its
`traceId`/`spanId`, via a pino `mixin` in `src/common/logger`. You do
**not** thread these through service calls; just log as usual.

### Correlation / Request IDs

`src/middleware/request-id.ts` gives every request a correlation ID so a
log line can be tied to a single request, even across services:

- On each request it reuses a valid inbound `x-request-id` header (so one
  ID can span services) or mints a fresh UUIDv7. Inbound IDs are length-capped;
  HTTP already forbids control characters in header values, so a length cap is
  enough to keep logs and spans from being bloated or injected.
- The ID is bound to an `AsyncLocalStorage` store (`enterWith` in
  `onRequest`, the idiomatic Elysia pattern) and read at log time by the
  logger mixin. Use `getRequestId()` to read it anywhere in the request's
  async context.
- It is echoed back on the `x-request-id` response header and recorded as
  the `request.id` span attribute, so logs ↔ traces share one correlation
  key. Cross-service trace propagation itself still rides on the W3C
  `traceparent` header handled by OpenTelemetry.

Registered right after `telemetry` in `src/app.ts` so the active span
exists when the attribute is set.

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
  `SERVER_PORT`, `DATABASE_DSN`, `DB_POOL_MAX`,
  `DB_POOL_CONNECTION_TIMEOUT`, `DB_POOL_IDLE_TIMEOUT`,
  `DB_AUTO_MIGRATE`, `MIGRATIONS_DIR`, `ENABLE_OPENAPI`,
  `OTEL_ENABLED`, `OTEL_SERVICE_NAME`, `OTEL_TRACES_SAMPLE_RATIO`
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

### CLI / Entrypoints

`src/cli.ts` is the single entrypoint and the `bun build --compile` target.
It uses Commander to dispatch one of two subcommands from one binary:

- `serve` (`src/commands/serve.ts`) — the long-lived HTTP server. This is
  where the `/health` and `/ready` endpoints live; they run continuously
  alongside the server.
- `migrate` (`src/commands/migrate.ts`) — a **one-shot** process that applies
  pending migrations via the programmatic `migrateDb()`, closes the DB pool,
  and lets the event loop drain so it **exits on its own** (no
  `process.exit()`, which would truncate pino's worker-thread transport).
  Failure is signalled via `process.exitCode = 1`.

Command modules are lazily imported with literal specifiers so `migrate`
never loads the Elysia/route graph (and so `--compile` bundles them).

The same compiled image runs both commands (`server serve` / `server
migrate`) — there is no separate migration image. In Docker/Compose the
`migrate` service runs to completion before the app starts.

### `serve` Bootstrap Process

The `serve` command (`src/commands/serve.ts`):

1. Run database migrations (if `DB_AUTO_MIGRATE=true` — **local-dev only**;
   `migrate()` takes no advisory lock, so this is unsafe across replicas —
   use the `migrate` command in deployments)
2. Start HTTP server
3. Register graceful shutdown handlers (SIGINT, SIGTERM)

If bootstrap fails, the CLI logs a fatal error and exits with code 1.

### Telemetry

`src/middleware/telemetry.ts` traces requests via `@elysia/opentelemetry`,
gated by `OTEL_ENABLED` (no-op plugin when off). It owns a traces-only
`NodeTracerProvider` and registers it so the plugin attaches to it rather than
starting its own `NodeSDK` (which would also open an unbounded OTLP logs
pipeline). Service name/version and environment come from `package.json` +
`NODE_ENV`; the exporter reads the standard `OTEL_EXPORTER_OTLP_*` env vars.
Sampling is an explicit `ParentBasedSampler(TraceIdRatioBased)` driven by
`OTEL_TRACES_SAMPLE_RATIO` (defaults to all traces — lower it in production).
OTel's internal diagnostics (e.g. failed exports) are bridged into pino at WARN
so a misconfigured collector surfaces in the logs instead of dropping spans
silently. `shutdownTelemetry()` runs last in
`gracefulShutdown` (after the DB pool closes, so a hung collector can't delay
it) to flush and close the provider.

`@elysia/opentelemetry` and the direct `@opentelemetry/*` deps are pinned to
exact versions on the `0.200.x` / core-`2.0.0` line — the plugin's transitive
SDK consumes our objects, so keep them in lockstep to dedupe a single
`@opentelemetry/core`.

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
├── support/                    # Shared helpers (not a test tier).
│   └── setup.ts                # Preload — boots container, exports helpers
├── unit/                       # Fast, mock-everything tests. No Docker.
│   ├── users/
│   │   └── users.unit.spec.ts
│   └── health/
│       └── health.unit.spec.ts
├── int/                        # Real Postgres via Testcontainers. Docker required.
│   ├── users/
│   │   └── users.int.spec.ts
│   └── health/
│       └── health.int.spec.ts
└── e2e/                        # Full HTTP/end-to-end tests. Docker required.
    └── users.e2e.spec.ts       # Naming: <feature>.e2e.spec.ts (flat layout).
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
- `bun run test:int` invokes Bun with `--preload ./tests/support/setup.ts`
  and the int directory (`./tests/int`) as the test target, so Bun
  walks it recursively regardless of subfolder depth.
- `bun run test:e2e` follows the same pattern: it uses the shared
  preload (`./tests/support/setup.ts`) and targets `./tests/e2e`. Specs boot
  the real app via `import { app } from 'src/app'` and drive it with
  `app.handle()`; `beforeEach(resetDatabase)` keeps cases independent.

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
bun test --preload ./tests/support/setup.ts ./tests/int/users/users.int.spec.ts
```

For most local work just use the tier scripts (`bun test`, `bun run
test:int`).

### How the shared test preload works

`tests/support/setup.ts` is loaded as a Bun **preload** — it runs before
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
   Import `testDb` from `../../support/setup` if you need to assert
   directly on persisted state.
4. The `test:int` script targets the `./tests/int` directory, so Bun
   walks it recursively — your file is picked up automatically with
   no script edits.

## Code Style

- Linter: Biome (config in `biome.json`)
- Run `bun run lint:fix` before committing
- No `any` types unless absolutely necessary
- Use explicit imports (no `import *`)

<!-- skrrt:ship -->
## Git workflow — skrrt skills

Use the installed skrrt skills for all git shipping operations:

- **Commits**: Use `/commit` to stage changes and write conventional commits with gitmojis.
- **Pull requests**: Use `/pr` to push branches and open PRs or MRs with the matching forge CLI.
- **Releases**: Use `/release` to draft release notes and publish releases.

Do not write raw `git commit`, `gh pr create`, `gh release create`, `glab mr create`, or
`glab release create` commands manually when these skills are available.

### Deployment conventions (Skrrt)

These rules apply regardless of branching strategy:

- **Tag format:** `vX.Y.Z` (production), `vX.Y.Z-rc.N` (release candidate), `vX.Y.Z-{env}.N` (custom tier). Always use annotated tags.
- **Tags are immutable.** Never delete or move a tag. If a release is bad, cut a new patch version.
- **Build once, promote the same artifact.** The artifact tested in staging must be identical to what reaches production. Never rebuild from a tag.
- **Lower environments do not need tags.** Dev deploys from branch HEAD on merge. Preview environments are per-PR and SHA-scoped.
- **Manual `workflow_dispatch`** can promote an existing artifact to any environment. It complements the tag-driven flow, not replaces it.

<!-- skrrt:branching -->
## Branching strategy — GitHub Flow

This project uses **GitHub Flow**. All agents and contributors must follow these rules:

### Branch rules

- `main` is the only long-lived branch and is always deployable.
- All work happens on short-lived, descriptively named branches.
- Never commit directly to `main` — all changes reach `main` through a pull request.
- PRs always target `main`.
- Feature branches must be up to date with `main` before merging.
- Feature branches are deleted after merge.
- CI runs on every PR.
- Releases are cut by tagging commits on `main`.
- Do not create `develop`, `release/*`, or `hotfix/*` branches.

### Branch naming

Use `<type>/<short-description>` with lowercase and hyphens:
- Features: `feat/add-auth`, `feat/search-index`
- Fixes: `fix/login-redirect`, `fix/null-check`
- Other: `docs/api-guide`, `chore/update-deps`, `refactor/auth-module`

### Keeping branches up to date (Skrrt convention)

- Before opening a PR, rebase the feature branch onto `main`: `git pull --rebase origin main`
- If the rebase has conflicts, resolve them and run `git rebase --continue`.
- If the rebase cannot be resolved cleanly, abort with `git rebase --abort` and ask the user for help.

### PR merge strategy (Skrrt convention)

- Use **squash merge** — each PR becomes one clean commit on `main`.
- This keeps `main` history linear: one commit = one PR = one logical change.

### Tagging and environment (Skrrt convention)

Tags are placed **on `main` only** — never on feature branches. See shared deployment conventions above.

| Environment | Trigger | Tag? |
| --- | --- | --- |
| Dev | Merge to `main` (squash merge) | No |
| Staging | Tag `vX.Y.Z-rc.N` on `main` | Yes |
| Production | Tag `vX.Y.Z` on `main` | Yes |

- Promote to staging by tagging an RC on `main`. If it fails, merge fixes via PR and tag a new RC.
- Promote to production by tagging a clean semver release on the validated commit.

### Agent lifecycle (full auto)

1. Create a branch from `main`: `git switch -c <type>/<description>`
2. Make changes and commit using `/commit`.
3. Before opening a PR, rebase onto `main`: `git pull --rebase origin main`
4. Push and open a PR using `/pr` — target is always `main`.
5. After squash merge, the branch is deleted automatically by the forge.
6. To promote to staging, tag an RC on `main`: use `/release` with a pre-release tag.
7. After staging validation, tag the production release on `main`: use `/release`.
<!-- /skrrt:branching -->
