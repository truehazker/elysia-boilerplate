# Elysia Boilerplate

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Bun](https://img.shields.io/badge/Bun-000?logo=bun&logoColor=fff)](https://bun.sh)
[![Postgres](https://img.shields.io/badge/Postgres-%23316192.svg?logo=postgresql&logoColor=white)](https://www.postgresql.org)
[![Drizzle](https://img.shields.io/badge/Drizzle-C5F74F?logo=drizzle&logoColor=000)](https://orm.drizzle.team)
[![TypeScript](https://img.shields.io/badge/TypeScript-007ACC?logo=typescript&logoColor=white)](https://www.typescriptlang.org)
[![Docker](https://img.shields.io/badge/Docker-2496ED?logo=docker&logoColor=white)](https://www.docker.com)
[![Tests][tests-badge]][tests-url]
[![Lint][lint-badge]][lint-url]

[tests-badge]: https://github.com/truehazker/elysia-boilerplate/actions/workflows/tests.yml/badge.svg
[tests-url]: https://github.com/truehazker/elysia-boilerplate/actions/workflows/tests.yml
[lint-badge]: https://github.com/truehazker/elysia-boilerplate/actions/workflows/lint.yml/badge.svg
[lint-url]: https://github.com/truehazker/elysia-boilerplate/actions/workflows/lint.yml

A modern boilerplate for building APIs with Elysia, Bun runtime,
and PostgreSQL.

## Features

- **Elysia** - Fast and ergonomic web framework
- **Bun** - Ultra-fast JavaScript runtime and package manager
- **PostgreSQL** - Robust relational database
- **Drizzle ORM** - Type-safe SQL ORM with excellent TypeScript support
- **Pino Logger** - High-performance JSON logger
- **OpenAPI** - Automatic API documentation generation
- **Environment Configuration** - Type-safe environment variable validation
  with Envalid
- **Modular Architecture** - Clean, organized code structure

## Prerequisites

- [Bun](https://bun.sh) (latest version)
- [Docker](https://www.docker.com/) — only required for the integration
  test suite. Podman with the docker-compatible API also works.

## Installation

1. **Clone the repository**

   ```bash
   git clone <repository-url>
   cd elysia-boilerplate
   ```

2. **Install dependencies**

   ```bash
   bun install
   ```

3. **Set up PostgreSQL**

   **Recommended approach**: Use the provided Docker Compose setup,
   which will start PostgreSQL instantly:

   ```bash
   docker-compose up -d elysia-boilerplate-postgres
   ```

   **Alternative**: Run your own PostgreSQL instance, create a database,
   and update your `.env` file with the correct `DATABASE_DSN`.

4. **Create and configure environment variables**

   ```bash
   cp .env.example .env
   ```

   **Important**: Create a `.env` file from the provided `.env.example`
   template and update it with your PostgreSQL connection details:

   ```env
   NODE_ENV=development
   LOG_LEVEL=info
   SERVER_HOSTNAME=localhost
   SERVER_PORT=3000
   DATABASE_DSN=postgresql://username:password@localhost:5432/your_db
   ```

5. **Run database migrations**

   ```bash
   bun run db:migrate
   ```

## Development

Start the development server with hot reload:

```bash
bun run dev
```

The server will start at `http://localhost:3000` (or your configured port).

## Available Scripts

| Command | Description |
| --- | --- |
| `bun run dev` | Start development server with hot reload |
| `bun run start` | Start production server |
| `bun run build` | Compile the single multi-command binary (`server serve` / `server migrate`) |
| `bun run db:generate` | Generate a new database migration (drizzle-kit, dev-only) |
| `bun run db:migrate` | Apply pending migrations via the one-shot `migrate` command |
| `bun run db:studio` | Open Drizzle Studio for database management |
| `bun test` | Run unit tests |
| `bun run test:int` | Run integration tests against a Testcontainers Postgres |
| `docker-compose up -d` | Start the entire stack with Docker Compose |
| `docker-compose down` | Stop all Docker services |
| `docker-compose logs -f` | View logs from all services |

## Testing

Tests live under a single `tests/` tree, split into tiers so each tier
can be configured and run independently. All tiers use Bun's built-in
test runner.

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
```

Naming convention: `<subject>.<tier>.spec.ts`. `*.spec.ts` is picked
up by Bun's default discovery; the `.<tier>.` qualifier makes intent
obvious to humans and to grep.

### Unit tests

Mock external collaborators and run without any external dependencies:

```bash
bun test                  # run all unit tests
bun test --coverage       # with coverage
```

`bunfig.toml` sets `[test].root = "tests/unit"`, so the default
`bun test` runs only the unit tier.

### Integration tests

Exercise services against a real PostgreSQL instance booted on demand
by [Testcontainers](https://testcontainers.com/). Docker (or podman
with the docker-compatible API) must be running.

```bash
bun run test:int
```

How it works:

- `tests/int/setup.ts` is a **Bun preload** — it runs once before any
  test file is parsed, boots a single shared `postgres:16-alpine`
  container, applies the Drizzle migrations, and sets `DATABASE_DSN`
  to point at the container.
- Because env is set first, integration tests use plain static imports
  (`import { UsersService } from 'src/modules/users/service'`) — no
  dynamic-import boilerplate.
- The setup exposes `testDb` (raw Drizzle handle) and `resetDatabase()`
  for `beforeEach` isolation.
- A shared `afterAll` hook plus `beforeExit` / signal handlers stop
  the container (with a bounded timeout) when the run completes.

### Adding tests

- **Unit**: drop `tests/unit/<module>/<subject>.unit.spec.ts`. Picked
  up by the bunfig root automatically.
- **Integration**: drop `tests/int/<module>/<subject>.int.spec.ts`.
  The `test:int` script's glob picks it up — no script edits needed.
  Use `beforeEach(resetDatabase)` from `../setup` for state isolation.
- **E2E**: drop `tests/e2e/<feature>.e2e.spec.ts` and add a
  matching `test:e2e` script when the first e2e test lands.

Because each tier runs as a separate `bun test` invocation, each can
have its own preload, env vars, timeouts, or other configuration with
no cross-contamination.

## Project Structure

```text
src/
├── db/                       # Database configuration and schema
│   ├── migrations/           # Database migrations
│   ├── index.ts              # Database connection setup
│   └── schema/               # Drizzle schema definitions
├── common/                   # Shared utilities
│   ├── config.ts             # Environment configuration
│   ├── schema.ts             # Shared response schemas
│   └── logger.ts             # Logger setup
├── modules/                  # Feature modules
│   ├── health/               # Health & readiness endpoints
│   │   ├── index.ts          # GET /health, GET /ready
│   │   ├── model.ts          # Health response models
│   │   └── service.ts        # Dependency checks
│   └── users/                # User module example
│       ├── index.ts          # Route definitions
│       ├── model.ts          # Data models
│       └── service.ts        # Business logic
└── main.ts                   # Application entry point

tests/                        # Test tiers (sibling to src/)
├── unit/                     # Mock-everything unit tests (default `bun test`)
├── int/                      # Integration tests (Testcontainers Postgres)
│   └── setup.ts              # Preload: boots container, exports helpers
└── e2e/                      # End-to-end tests (reserved)
```

### Important Notes on Logger Usage

To avoid duplicate logs, submodules should import and use the logger
directly from `src/common/logger` rather than relying on Elysia's context.

**Example:**

```typescript
// Correct: Import logger directly
import { log } from 'src/common/logger';

// Incorrect: Using logger from Elysia context in submodules
// This will cause duplicate logs
```

## Configuration

The application uses [Envalid](https://github.com/af/envalid)
for type-safe environment variable validation.
All configuration is centralized in `src/common/config.ts`.

### Environment Variables

| Variable | Type | Default | Description |
| --- | --- | --- | --- |
| `NODE_ENV` | string | `development` | Application environment |
| `LOG_LEVEL` | string | `info` | Logging level |
| `SERVER_HOSTNAME` | string | `localhost` | Server bind address |
| `SERVER_PORT` | number | `3000` | Server port |
| `DATABASE_DSN` | string | *(required)* | PostgreSQL connection string (DSN) |
| `DB_POOL_MAX` | number | `10` | Maximum DB connections in the Drizzle/Bun.SQL pool |
| `DB_POOL_CONNECTION_TIMEOUT` | number | `5` | Seconds to wait for a connection before failing |
| `DB_POOL_IDLE_TIMEOUT` | number | `30` | Seconds an idle connection is kept in the pool |
| `DB_AUTO_MIGRATE` | boolean | `false` | Run migrations on startup |
| `MIGRATIONS_DIR` | string | `src/db/migrations` | Directory of Drizzle migration files |
| `ENABLE_OPENAPI` | boolean | `true` | Enable OpenAPI docs at `/openapi` |

## API Documentation

Once the server is running, you can access the interactive
API documentation at:

- **Scalar UI**: `http://localhost:3000/openapi`
- **OpenAPI JSON**: `http://localhost:3000/openapi/json`

## Database Management

This project uses [Drizzle ORM](https://orm.drizzle.team) for schema
definitions and migrations. Migration files live in `src/db/migrations/`
and are generated from the schema definitions in `src/db/schema/`.

### Generating Migrations

After changing any table definition in `src/db/schema/`, generate
a new migration file:

```bash
bun run db:generate
```

This produces a timestamped SQL migration in `src/db/migrations/`.
Always review the generated SQL before applying it.

### Applying Migrations

#### Local Development

Run migrations manually with the one-shot `migrate` command:

```bash
bun run db:migrate
```

This runs `src/cli.ts migrate`: it applies pending migrations via the
programmatic `migrateDb()` (Drizzle's `migrate()` over the SQL files —
**no `drizzle-kit` needed at runtime**), closes the DB pool, and exits.

Alternatively, set `DB_AUTO_MIGRATE=true` in your `.env` file to run
pending migrations automatically on server startup. The `serve` command
in `src/commands/serve.ts` checks this flag and calls `migrateDb()`
before the server begins accepting requests.

> **Note:** Auto-migration is intended for local development only.
> In the Docker Compose setup, the application container does **not**
> enable `DB_AUTO_MIGRATE` — it is effectively a no-op unless you
> explicitly set the variable. Do not rely on auto-migration in
> production or shared environments.

#### Production

Running migrations at application startup in production is discouraged
because it introduces risk when multiple replicas start simultaneously
and couples deployments with schema changes. Drizzle's `migrate()` takes
**no advisory lock**, so concurrent runs can double-apply DDL — you must
guarantee a single runner. Use one of the following approaches:

- **One-shot `migrate` command** — run `bun run db:migrate` (or the
  compiled `server migrate`) as an explicit step in your CI/CD pipeline
  before deploying the new application version.
- **Sidecar / init container** — in Kubernetes or similar orchestrators,
  run the same image as a single one-shot migration job (`server migrate`)
  that completes before the application pods start. Prefer one job over a
  per-replica init container so exactly one migration runs.
- **Dedicated migration tool** — integrate with a schema management
  tool like [Atlas](https://atlasgo.io) for more advanced workflows
  such as drift detection, linting, and approval gates.

The CI/CD step is the recommended path: it runs exactly once (safe given
the missing advisory lock), keeps DDL credentials in CI, and gates the
rollout on success — no extra runtime container. Example:

```yaml
# .github/workflows/deploy.yml (excerpt)
jobs:
  migrate:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: oven-sh/setup-bun@v2
      - run: bun install --frozen-lockfile
      - run: bun run db:migrate
        env:
          DATABASE_DSN: ${{ secrets.DATABASE_DSN }}
  deploy:
    needs: migrate # roll out only after migrations succeed
    runs-on: ubuntu-latest
    steps:
      - run: echo "deploy the new image…"
```

### Drizzle Studio

Open a GUI to browse and edit your local database:

```bash
bun run db:studio
```

## Docker Deployment

This project includes Docker configuration for easy deployment
and development.

### Using Docker Compose (Recommended)

The easiest way to run the entire stack is with Docker Compose:

```bash
# Start all services (app + database + migration sidecar)
docker-compose up -d

# View logs
docker-compose logs -f

# Stop all services
docker-compose down
```

This will start:

- **Migration job** — the same app image run as `server migrate`; applies
  pending migrations then exits (the app is gated on its success)
- **Elysia application** on `http://localhost:3000` (starts after migrations succeed)
- **PostgreSQL database** on `localhost:5432`

### Docker Configuration

- **Dockerfile**: Multi-stage build using Bun runtime,
  compiles TypeScript and creates optimized binary
- **docker-compose.yml**: Complete stack with PostgreSQL,
  health checks, and persistent data storage
- **Environment**: Configuration with proper networking,
  restart policies, and auto-migration

## Production Deployment

1. **Build the application**

   ```bash
   bun run build
   ```

2. **Set production environment variables**

   ```bash
   export NODE_ENV=production
   export DATABASE_DSN=your_production_database_dsn
   # ... other production variables
   ```

3. **Run the application**

   ```bash
   ./build/server
   ```

## Using Agents

This repository features an `AGENTS.md` file that outlines
the recommended tools and commands for using agents.

You can use cursor, claude, etc. to use agents

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the
[LICENSE](LICENSE) file for details.
