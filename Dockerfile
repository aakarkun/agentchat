# agentchat API — monorepo root, Bun, long-running process
# Build: docker build -t agentchat-api .
# Run:   docker run -p 8787:8787 -e DATABASE_URL=... agentchat-api

FROM oven/bun:1-alpine AS base
WORKDIR /app

# Install deps (workspace root; only api + core for smaller image).
# No --frozen-lockfile: root lockfile is for full monorepo; this image has only api + core.
COPY package.json bun.lock bunfig.toml ./
COPY apps/api/package.json apps/api/
COPY packages/core/package.json packages/core/
RUN bun install

# Copy source
COPY packages/core packages/core
COPY apps/api apps/api

# Default port (override with -e PORT=...)
ENV HOST=0.0.0.0
ENV PORT=8787
EXPOSE 8787

# Run from repo root so @agentchat/core and static paths resolve
CMD ["bun", "run", "api"]
