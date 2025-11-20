# AGENTS.md

## Project Overview

This is an ElysiaJS boilerplate project using Bun, PostgreSQL, and Drizzle ORM.
It follows a modular architecture with strict TypeScript configuration.

## Tech Stack

- **Runtime**: Bun
- **Framework**: ElysiaJS
- **Database**: PostgreSQL
- **ORM**: Drizzle ORM
- **Linter/Formatter**: Biome
- **Testing**: Bun Test
- **Containerization**: Docker

## Setup & Commands

- **Install dependencies**: `bun install`
- **Start dev server**: `bun run dev`
- **Build for production**: `bun run build`
- **Start production server**: `bun run start`
- **Run tests**: `bun test`
- **Lint code**: `bun run lint`
- **Format code**: `bun run format`

## Database Operations

- **Generate migrations**: `bun run db:generate` (Run after modifying schema in `src/db/schema`)
- **Apply migrations**: `bun run db:migrate`
- **Open Database Studio**: `bun run db:studio`

## Code Style & Conventions

- **Linter**: Strictly follow Biome rules. Run `bun run lint:fix` to auto-fix issues.
- **TypeScript**: Strict mode is enabled. No `any` types unless absolutely necessary.
- **Architecture**:
  - Modular structure in `src/modules/`.
  - Each module should have `index.ts` (routes), `service.ts` (logic), `model.ts` (data).
  - Shared utilities in `src/common/`.
  - Database schema in `src/db/schema/`.
- **Environment**: Use `src/common/config.ts` for env vars (Envalid). Do not use `process.env` directly.
- **Imports**: Use explicit imports.

## Testing Instructions

- **Runner**: Use `bun test`.
- **Location**: Tests are located in `src/tests/`.
- **Convention**: Name test files `*.test.ts`.
- **Requirement**: All new features must include unit/integration tests.
- **Coverage**: Run `bun test --coverage` to check coverage.

## PR Instructions

- **Branches**: Target `develop` for features, `main` for releases.
- **Checks**: Ensure `bun run lint` and `bun test` pass before requesting review.
- **Title**: Follow conventional commits (e.g., `feat: add user module`, `fix: resolve login bug`).

## Directory Structure

- `src/common`: Shared configuration and utilities.
- `src/db`: Database setup, migrations, and schemas.
- `src/modules`: Business logic modules.
- `src/tests`: Test files.
- `src/main.ts`: Application entry point.

