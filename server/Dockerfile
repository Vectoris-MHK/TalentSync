FROM node:22-alpine AS base

ENV PNPM_HOME="/pnpm"
ENV PATH="$PNPM_HOME:$PATH"
RUN corepack enable && corepack prepare pnpm@10.33.4 --activate

FROM base AS deps

WORKDIR /app

COPY pnpm-lock.yaml pnpm-workspace.yaml package.json ./
COPY server/package.json server/

RUN pnpm install --frozen-lockfile --filter server --prod

FROM base AS runner

WORKDIR /app

RUN addgroup --system --gid 1001 appgroup && \
    adduser --system --uid 1001 --ingroup appgroup appuser

COPY --from=deps /app/node_modules ./node_modules
COPY --from=deps /app/server/node_modules ./server/node_modules
COPY server/ ./server/

RUN chown -R appuser:appgroup /app

USER appuser

ENV NODE_ENV=production
ENV IS_DOCKER=true

EXPOSE 3000

CMD ["node", "server/server.js"]
