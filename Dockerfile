# Builder's supported Node/Docker deployment path; secrets enter at runtime only.
FROM node:24-bookworm-slim AS build
WORKDIR /app
RUN apt-get update && apt-get install -y --no-install-recommends python3 make g++ && rm -rf /var/lib/apt/lists/*
ENV PYTHON=/usr/bin/python3
ENV NODE_OPTIONS=--max-old-space-size=2048
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
RUN corepack enable && pnpm install --frozen-lockfile
COPY . .
RUN pnpm build

FROM build AS migrate
CMD ["pnpm", "migrate:production"]

FROM build AS production-deps
RUN pnpm prune --prod --ignore-scripts

FROM node:24-bookworm-slim AS runtime
WORKDIR /app
ENV NODE_ENV=production PORT=3000 HOST=0.0.0.0
COPY --from=build --chown=node:node /app/.output .output
COPY --from=production-deps --chown=node:node /app/node_modules node_modules
COPY --from=build --chown=node:node /app/package.json package.json
USER node
EXPOSE 3000
CMD ["node", ".output/server/index.mjs"]
