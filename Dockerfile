# Build stage
FROM oven/bun:1.3.11-alpine AS builder

WORKDIR /app

# Copy package files
COPY package.json bun.lock ./

# Install dependencies (frozen lockfile for reproducibility)
RUN --mount=type=cache,target=/root/.bun/install/cache bun install --frozen-lockfile

# Copy source files
COPY src ./src
COPY drizzle.config.ts ./
COPY tsconfig.json ./

# Build the application for Linux
RUN bun build --compile --minify-whitespace --minify-syntax --outfile build/server src/cli.ts

# Final stage - ultra-minimal runtime
FROM frolvlad/alpine-glibc

WORKDIR /app

# Install only essential C++ runtime libraries (minimal overhead)
RUN apk --no-cache add libstdc++ libgcc

RUN addgroup -S appgroup && adduser -S appuser -G appgroup

# Binary + migration SQL. One image runs both `serve` and `migrate`;
# migrate reads the SQL from MIGRATIONS_DIR (this WORKDIR).
COPY --from=builder /app/build/server ./server
COPY --from=builder /app/src/db/migrations ./src/db/migrations

RUN chmod +x ./server && chown -R appuser:appgroup /app

USER appuser

EXPOSE 3000

CMD ["/app/server", "serve"]
