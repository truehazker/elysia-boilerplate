# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

## [0.6.0] - 2026-05-06

### Changed

- ⬆️ **BREAKING:** Migrated official Elysia plugins from `@elysiajs/*` to `@elysia/*` scope (`cors`, `openapi`)
- ⬆️ **BREAKING:** Swapped database driver from `pg` (node-postgres) to `Bun.sql` via `drizzle-orm/bun-sql` — drops `pg` and `@types/pg`, uses Bun's native PostgreSQL client
- ⬆️ **BREAKING:** Renamed `DATABASE_URL` env var to `DATABASE_DSN` (it's a connection DSN, not a URL endpoint) — update `.env`, deploy configs, and CI secrets accordingly
- ⬆️ Bumped TypeScript `5.9` → `6.0` (replaced deprecated `baseUrl` with `paths` in `tsconfig.json`)
- ⬆️ Bumped `@biomejs/biome` `2.4.8` → `2.4.14`
- ⬆️ Bumped `@elysia/cors` to `1.4.2`, `@elysia/openapi` to `1.4.15`, `drizzle-orm` to `0.45.2`, `@types/bun` to `1.3.13`
- ♻️ Pino logger: ISO timestamps in production JSON output, simpler `transport.target` config in dev, secret redaction defaults (`password`, `token`, `authorization`, `cookie`)
- ♻️ Renamed startup-log `hostname` field to `host` to avoid colliding with pino's default `base.hostname`
- ♻️ Pool options renamed for `Bun.sql`: `connectionTimeoutMillis` → `connectionTimeout` (seconds), added `idleTimeout` (seconds); `statement_timeout` removed (set via `DATABASE_DSN` query string if needed)

### Removed

- 🔥 `pg` and `@types/pg` dependencies — replaced by `Bun.sql`

### Migration notes

- If you set custom pg pool options via env or fork, port them to `Bun.SQL` equivalents (seconds, not ms).
- For per-statement timeout, append `?options=-c%20statement_timeout%3D5000` to `DATABASE_DSN`.
- Compiled binaries (`bun build --compile`) must run with `NODE_ENV=production` to bypass the pino-pretty worker thread (worker dynamic-require is unsupported in compiled mode).

## [0.5.0] - 2026-03-23

### Added

- ✨ Health module (`/health` liveness, `/ready` readiness) with `application/health+json` responses per IETF draft
- ✨ `Dockerfile.migrate` for running database migrations as a separate container
- ✨ Dedicated migration service in `docker-compose.yml` with dependency ordering
- ✨ Common `errorResponse` schema helper in `src/common/schema.ts`
- ✅ Comprehensive test suite for health module
- ✅ Expanded users test suite with conflict handling and error scenarios
- 🔧 Type checking (`bun run typecheck`) added to CI lint workflow
- 🔧 PostgreSQL service container in CI test workflow for integration tests
- 🔧 Build step added to CI test workflow

### Changed

- ⬆️ Updated Bun base image from `1.3.2` to `1.3.11` in Dockerfiles and CI
- ⬆️ Updated dependencies and lockfile
- ♻️ Users service returns `null` on email conflict instead of throwing (`onConflictDoNothing`)
- ♻️ Users routes simplified — removed redundant try/catch, let errors propagate to global handler
- ♻️ Error handler registered with `{ as: 'global' }` for full plugin coverage
- ♻️ OpenAPI version now reads from `package.json` dynamically
- ♻️ Server `listen()` now binds to configured hostname
- 🗃️ Email column marked as `unique()` in users schema with email format validation
- 🐳 Added non-root user (`appuser`) to Dockerfiles for improved security
- 📝 Overhauled `README.md` and `CLAUDE.md` with updated project structure and guidelines

### Removed

- 🔥 Removed `users.getError` model — unhandled fetch errors propagate to global handler

## [0.4.5] - 2026-01-03

### Changed

- Updated dependencies to the latest version

## [0.4.4] - 2025-12-25

### Added

- Added `CLAUDE.md` with comprehensive development guidelines for AI-assisted development
- Added `ENABLE_OPENAPI` environment variable to control OpenAPI documentation availability
- Added new `src/middleware/error-handler.ts` for centralized error handling
- Added startup logging to indicate OpenAPI documentation availability status

### Changed

- Extracted global error handler into separate middleware file (`src/middleware/error-handler.ts`)
- Enhanced error logging in users module to log all caught errors before returning responses
- Updated `src/common/logger.ts` to use raw `pino` instead of elysia-logger wrapper
- Updated OpenAPI integration to respect `ENABLE_OPENAPI` configuration
- Updated `.env.example` with `ENABLE_OPENAPI` setting and changed default `LOG_LEVEL` to `debug`
- Updated dependencies: `@elysiajs/openapi` to ^1.4.12, `drizzle-orm` to ^0.45.1, `elysia` to ^1.4.19
- Cleaned up `src/main.ts` by moving error handling logic to dedicated middleware

### Removed

- Removed `@bogeychan/elysia-logger` dependency in favor of raw Pino integration

## [0.4.3] - 2025-12-15

### Changed

- Improved `README.md` with up-to-date docs
- Fixed database variable value in `.env.example` to work with `docker-compose.yml` deployment out of the box
- Updated Elysia to the latest `1.4.19` version

## [0.4.2] - 2025-12-06

### Added

- Added database migration error handling
- Added automatic database migrations on server startup

### Changed

- Updated dependencies to the latest version
- Changed the way server starts to be more robust

## [0.4.1] - 2025-12-03

### Changed

- Updated dependencies to the latest version
- Updated error handling to be more robust
- Updated ci workflows to use action environment variables instead of test environment

### Fixed

- Fixed error logging to not expose sensitive request information

## [0.3.1] - 2025-12-01

### Changed

- Updated graceful shutdown functionality to be more robust
- Updated dependencies to the latest version

### Added

- Added `@types/pg` to dev dependencies for type safety

## [0.3.0] - 2025-11-27

### Changed

- Updated logger integration to use plugin-based approach at root app level
- Improved app initialization and launch process with proper signal handling (SIGINT/SIGTERM)
- Enhanced error logging with structured HTTP request context
- Improved error handling in the users module

## [0.2.4] - 2025-11-20

### Fixed

- Fixed `README.md` to use correct workflow name

## [0.2.2] - 2025-11-20

### Fixed

- Fixed workflows to use environment variables

## [0.2.0] - 2025-11-20

### Added

- Added local MCP server configuration
- Added CI lint workflow
- Added Biome-based formatting/linting
- Added VS Code recommendations/settings included
- Added project guidelines and updated changelog

### Fixed

- Improved user-creation error handling with clearer 422 responses and more robust failure checks

### Changed

- Updated dependencies to the latest version
- Updated tests for consistent formatting and interaction patterns

## [0.1.6] - 2025-11-11

### Changed

- Dependencies updated to the latest version
- Fixed the way we define models
- Moved database-related files to `src/db`
- Moved common files to `src/common`
- Removed aliases from `tsconfig.json` as it may interfere with monorepo setups

### Added

- Added `timestamp` prefix to migrations

## [0.1.5] - 2025-09-30

### Changed

- Updated dependencies to the latest version
- Updated the way we use logger
- Improved `openapi` documentation

## [0.1.4] - 2025-09-16

### Changed

- Updated packages to the latest version
- Improved `Dockerfile`

## [0.1.2] - 2025-09-14

### Added

- Added test directory to `bunfig.toml`
- Added users test file

### Fixed

- Fixed `LOG_LEVEL` type in `config.ts`
- Fixed mistaken comment in `users/index.ts`

### Changed

- Updated `README.md` with testing information and some badges

## [0.1.1] - 2025-09-14

### Changed

- Removed invalid parameters from `bunfig.toml` and disabled telemetry

## [0.1.0] - 2025-09-14

### Added

- Elysia web framework with TypeScript and Bun runtime
- PostgreSQL database with Drizzle ORM
- User management API endpoints
- OpenAPI documentation generation
- Docker and Docker Compose configuration
- Database migration system
- Pino logger with development pretty printing
- Environment variable validation with Envalid
- Hot reload development server
- Initial users table schema

### Changed

- Updated OpenAPI documentation URLs from `/swagger` to `/openapi`
