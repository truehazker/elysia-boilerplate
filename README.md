# Elysia Boilerplate

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Bun](https://img.shields.io/badge/Bun-000?logo=bun&logoColor=fff)](https://bun.sh)
[![Postgres](https://img.shields.io/badge/Postgres-%23316192.svg?logo=postgresql&logoColor=white)](https://www.postgresql.org)
[![Drizzle](https://img.shields.io/badge/Drizzle-C5F74F?logo=drizzle&logoColor=000)](https://orm.drizzle.team)
[![TypeScript](https://img.shields.io/badge/TypeScript-007ACC?logo=typescript&logoColor=white)](https://www.typescriptlang.org)
[![Docker](https://img.shields.io/badge/Docker-2496ED?logo=docker&logoColor=white)](https://www.docker.com)

A modern, production-ready boilerplate for building APIs with Elysia, Bun runtime, and PostgreSQL.

## Features

- **Elysia** - Fast and ergonomic web framework
- **Bun** - Ultra-fast JavaScript runtime and package manager
- **PostgreSQL** - Robust relational database
- **Drizzle ORM** - Type-safe SQL ORM with excellent TypeScript support
- **Pino Logger** - High-performance JSON logger
- **OpenAPI** - Automatic API documentation generation
- **Environment Configuration** - Type-safe environment variable validation with Envalid
- **Modular Architecture** - Clean, organized code structure

## Prerequisites

- [Bun](https://bun.sh) (latest version)
- [PostgreSQL](https://www.postgresql.org) (12+)

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
   - Install and start PostgreSQL on your system
   - Create a database for your project
   - Note the connection details (host, port, database name, username, password)

4. **Create and configure environment variables**
   ```bash
   cp .env.example .env
   ```
   
   **Important**: You must create a `.env` file from the provided `.env.example` template and update it with your PostgreSQL connection details:
   ```env
   NODE_ENV=development
   LOG_LEVEL=info
   SERVER_HOSTNAME=localhost
   SERVER_PORT=3000
   DATABASE_URL=postgresql://username:password@localhost:5432/your_database_name
   ```

5. **Run database migrations**
   ```bash
   bun run migration:apply
   ```

## Development

Start the development server with hot reload:
```bash
bun run dev
```

The server will start at `http://localhost:3000` (or your configured port).

## Available Scripts

| Command | Description |
|---------|-------------|
| `bun run dev` | Start development server with hot reload |
| `bun run start` | Start production server |
| `bun run build` | Build the application for production |
| `bun run migration:generate` | Generate a new database migration |
| `bun run migration:apply` | Apply pending migrations to the database |
| `bun run migration:studio` | Open Drizzle Studio for database management |
| `docker-compose up -d` | Start the entire stack with Docker Compose |
| `docker-compose down` | Stop all Docker services |
| `docker-compose logs -f` | View logs from all services |

## Testing

This project includes a testing setup using Bun's built-in test runner. Tests are located in the `src/tests/` folder.

### Running Tests

To run all tests:
```bash
bun test
```

To run tests with coverage:
```bash
bun test --coverage
```

### Adding Tests

Add your test files to the `src/tests/` folder. Test files should follow the naming convention `*.test.ts`.

Example test structure:
```
src/tests/
├── users.test.ts          # User module tests
├── auth.test.ts           # Authentication tests
└── api.test.ts            # API endpoint tests
```

## Project Structure

```
src/
├── db/                   # Database configuration and schema
│   ├── index.ts          # Database connection setup
│   └── schema/           # Drizzle schema definitions
├── modules/              # Feature modules
│   ├── common/           # Shared utilities
│   │   ├── config.ts     # Environment configuration
│   │   └── logger.ts     # Logger setup
│   └── users/            # User module example
│       ├── index.ts      # Route definitions
│       ├── model.ts      # Data models
│       └── service.ts    # Business logic
└── main.ts               # Application entry point
```

## Configuration

The application uses [Envalid](https://github.com/af/envalid) for type-safe environment variable validation. All configuration is centralized in `src/modules/common/config.ts`.

### Environment Variables

| Variable | Type | Default | Description |
|----------|------|---------|-------------|
| `NODE_ENV` | string | `development` | Application environment |
| `LOG_LEVEL` | string | `info` | Logging level |
| `SERVER_HOSTNAME` | string | `localhost` | Server hostname |
| `SERVER_PORT` | number | `3000` | Server port |
| `DATABASE_URL` | string | - | PostgreSQL connection URL |

## API Documentation

Once the server is running, you can access the interactive API documentation at:
- **Scala UI**: `http://localhost:3000/openapi`
- **OpenAPI JSON**: `http://localhost:3000/openapi/json`

## Database Management

### Generate a new migration
```bash
bun run migration:generate
```

### Apply migrations
```bash
bun run migration:apply
```

### Open Drizzle Studio
```bash
bun run migration:studio
```

## Docker Deployment

This project includes Docker configuration for easy deployment and development.

### Using Docker Compose (Recommended)

The easiest way to run the entire stack is with Docker Compose:

```bash
# Start all services (app + database)
docker-compose up -d

# View logs
docker-compose logs -f

# Stop all services
docker-compose down
```

This will start:
- **Elysia application** on `http://localhost:3000`
- **PostgreSQL database** on `localhost:5432`
- **Automatic database migrations** on startup

### Manual Docker Build

If you prefer to build and run manually:

```bash
# Build the Docker image
docker build -t elysia-boilerplate .

# Run PostgreSQL
docker run -d --name postgres \
  -e POSTGRES_USER=postgres \
  -e POSTGRES_PASSWORD=postgres \
  -e POSTGRES_DB=elysia-boilerplate \
  -p 5432:5432 \
  postgres:17-alpine

# Run the application
docker run -d --name elysia-app \
  -p 3000:3000 \
  -e DATABASE_URL=postgresql://postgres:postgres@host.docker.internal:5432/elysia-boilerplate \
  elysia-boilerplate
```

### Docker Configuration

- **Dockerfile**: Multi-stage build using Bun runtime, compiles TypeScript and creates optimized binary
- **docker-compose.yml**: Complete stack with PostgreSQL, health checks, and persistent data storage
- **Environment**: Production-ready configuration with proper networking and restart policies

## Production Deployment

1. **Build the application**
   ```bash
   bun run build
   ```

2. **Set production environment variables**
   ```bash
   export NODE_ENV=production
   export DATABASE_URL=your_production_database_url
   # ... other production variables
   ```

3. **Run the application**
   ```bash
   ./build/server
   ```

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.
