# Build stage
FROM oven/bun:1.3.2-alpine AS builder

WORKDIR /app

# Copy package files
COPY package.json bun.lock ./

# Install dependencies
RUN bun install

# Copy source files
COPY src ./src
COPY drizzle.config.ts ./
COPY tsconfig.json ./

# Build the application for Linux
RUN bun build --compile --minify-whitespace --minify-syntax --outfile build/server src/main.ts

# Final stage - ultra-minimal runtime using alpine-glibc (16MB base)
FROM frolvlad/alpine-glibc

# Install only essential C++ runtime libraries (minimal overhead)
RUN apk --no-cache add libstdc++ libgcc

# Copy the compiled binary directly from builder stage
COPY --from=builder /app/build/server /server

# Make the binary executable
RUN chmod +x /server

EXPOSE 3000

# Use the compressed binary
CMD ["/server"]
