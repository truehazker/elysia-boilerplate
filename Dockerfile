FROM oven/bun:1.2.21

WORKDIR /app

# Copy package files
COPY package.json bun.lock ./

# Install dependencies
RUN bun install

# Copy source files
COPY src ./src
COPY drizzle.config.ts ./
COPY tsconfig.json ./

# Build the application
RUN bun run build

EXPOSE 3000

# Use the compiled binary
CMD ["./build/server"]
