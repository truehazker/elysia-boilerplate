# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

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
bun test                       # Run all tests
bun test --coverage            # Run tests with coverage report

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
3. Routed to module in `src/modules/` (e.g., `/users` → `src/modules/users/`)
4. Module structure: `index.ts` (routes) → `service.ts` (business logic) → database

### Logger Architecture (CRITICAL)
The logger is initialized **once** in `src/main.ts` using `.use(log.into({...}))`. To avoid duplicate logs:
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
   - Export `createInsertSchema`, `createSelectSchema`, `createUpdateSchema` from drizzle-typebox
   - Add Elysia field refinements (validation rules)

2. **`model.ts`**: Type definitions and Elysia model plugin
   - Define request/response types using Elysia's `t` (TypeBox)
   - Create namespace (e.g., `UsersModel`) with typed DTOs
   - Export Elysia plugin with `.model()` to register schemas

3. **`service.ts`**: Business logic and database operations
   - Pure functions that interact with database
   - No HTTP concerns (status codes, headers, etc.)

4. **`index.ts`**: Route definitions (Elysia controller)
   - Define routes with `.get()`, `.post()`, etc.
   - Reference models by string: `body: 'users.createRequest'`
   - Handle errors and return proper HTTP status codes
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
- Available config: `NODE_ENV`, `LOG_LEVEL`, `SERVER_HOSTNAME`, `SERVER_PORT`, `DATABASE_URL`, `DB_AUTO_MIGRATE`, `ENABLE_OPENAPI`

### Error Handling
Global error handler in `src/middleware/error-handler.ts`:
- Elysia's handled errors (status codes) pass through
- Unhandled errors are logged with context (method, URL, referrer)
- Clients receive generic "Internal Server Error" (never expose details)

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
- Test files in `src/tests/` named `*.test.ts`
- Use Bun's built-in test runner
- All new features require tests

## Code Style
- Linter: Biome (config in `biome.json`)
- Run `bun run lint:fix` before committing
- No `any` types unless absolutely necessary
- Use explicit imports (no `import *`)
