# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

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
