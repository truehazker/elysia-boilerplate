# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

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
