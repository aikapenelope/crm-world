# syntax=docker/dockerfile:1.4
# ↑ Enables full BuildKit cache mount syntax (--mount=type=cache).
#   Requires DOCKER_BUILDKIT=1 (set by Coolify automatically).
#
# Cache strategy
# ──────────────
# Two persistent cache mounts survive across builds (NOT cleared by docker image prune):
#   yarn-berry-cache   → /root/.yarn/berry/cache
#                        Yarn 4 global package archive. Reused across all stages.
#                        Benefit: yarn install goes from ~60s → ~10s when yarn.lock unchanged.
#   nextjs-build-cache → /app/.mercato/next/cache
#                        Turbopack incremental compilation artefacts.
#                        Benefit: yarn build goes from ~7min → ~2-3min on subsequent deploys.
#
# The mounts are ONLY cleared by `docker buildx prune` or `docker system prune --volumes`.
# Regular `docker system prune` (without --volumes) does NOT clear them.
# Note: `docker system prune -af` DOES clear them (the -a flag clears all build cache).
# For routine disk cleanup use: docker image prune -af (keeps build cache intact).

FROM node:24-alpine AS builder

ENV NEXT_TELEMETRY_DISABLED=1 \
    PATH=/app/node_modules/.bin:$PATH
ARG OPEN_MERCATO_DOCKER_REGISTRY_HOST=host.docker.internal

WORKDIR /app

RUN apk add --no-cache python3 make g++ ca-certificates openssl
RUN corepack enable && corepack prepare yarn@4.12.0 --activate

COPY package.json yarn.lock .yarnrc.yml ./
RUN if grep -Eq 'http://(localhost|127\.0\.0\.1):' .yarnrc.yml; then \
      sed \
        -e "s#http://localhost:#http://${OPEN_MERCATO_DOCKER_REGISTRY_HOST}:#g" \
        -e "s#http://127.0.0.1:#http://${OPEN_MERCATO_DOCKER_REGISTRY_HOST}:#g" \
        .yarnrc.yml > .yarnrc.yml.container; \
      if ! grep -Eq '^checksumBehavior:' .yarnrc.yml.container; then \
        printf '\nchecksumBehavior: update\n' >> .yarnrc.yml.container; \
      fi; \
      mv .yarnrc.yml.container .yarnrc.yml; \
    fi

# Cache the Yarn 4 global package archive so reinstalls are fast even when yarn.lock changes.
RUN --mount=type=cache,id=yarn-berry-cache,target=/root/.yarn/berry/cache \
    yarn install

COPY . .
RUN yarn generate

# Limit Node.js heap to 4GB to avoid OOM in constrained Docker environments
ENV NODE_OPTIONS="--max-old-space-size=4096"

# Cache the Turbopack/Next.js incremental build artefacts.
# On the first build this mount is empty; subsequent builds reuse compiled modules.
# Result: ~7 min → ~2-3 min on deployments that don't touch every module.
RUN --mount=type=cache,id=nextjs-build-cache,target=/app/.mercato/next/cache \
    NODE_ENV=production yarn build

FROM node:24-alpine AS dev

ENV NODE_ENV=development \
    NEXT_TELEMETRY_DISABLED=1 \
    PATH=/app/node_modules/.bin:$PATH
ARG OPEN_MERCATO_DOCKER_REGISTRY_HOST=host.docker.internal

WORKDIR /app

RUN apk add --no-cache python3 make g++ ca-certificates openssl
RUN corepack enable && corepack prepare yarn@4.12.0 --activate

COPY package.json yarn.lock .yarnrc.yml ./
RUN if grep -Eq 'http://(localhost|127\.0\.0\.1):' .yarnrc.yml; then \
      sed \
        -e "s#http://localhost:#http://${OPEN_MERCATO_DOCKER_REGISTRY_HOST}:#g" \
        -e "s#http://127.0.0.1:#http://${OPEN_MERCATO_DOCKER_REGISTRY_HOST}:#g" \
        .yarnrc.yml > .yarnrc.yml.container; \
      if ! grep -Eq '^checksumBehavior:' .yarnrc.yml.container; then \
        printf '\nchecksumBehavior: update\n' >> .yarnrc.yml.container; \
      fi; \
      mv .yarnrc.yml.container .yarnrc.yml; \
    fi
# Reuse the same Yarn cache populated by the builder stage.
RUN --mount=type=cache,id=yarn-berry-cache,target=/root/.yarn/berry/cache \
    yarn install

COPY . .

COPY docker/scripts/dev-entrypoint.sh /app/docker/scripts/dev-entrypoint.sh
COPY docker/scripts/init-or-migrate.sh /app/docker/scripts/init-or-migrate.sh
RUN chmod +x /app/docker/scripts/dev-entrypoint.sh
RUN chmod +x /app/docker/scripts/init-or-migrate.sh

EXPOSE 3000
CMD ["/bin/sh", "/app/docker/scripts/dev-entrypoint.sh"]

FROM node:24-alpine AS runner

ARG CONTAINER_PORT=3000
ARG OPEN_MERCATO_DOCKER_REGISTRY_HOST=host.docker.internal

ENV NODE_ENV=production \
    NEXT_TELEMETRY_DISABLED=1 \
    PATH=/app/node_modules/.bin:$PATH \
    PORT=${CONTAINER_PORT}

WORKDIR /app

RUN apk add --no-cache ca-certificates openssl
RUN corepack enable && corepack prepare yarn@4.12.0 --activate

COPY package.json yarn.lock .yarnrc.yml ./
RUN if grep -Eq 'http://(localhost|127\.0\.0\.1):' .yarnrc.yml; then \
      sed \
        -e "s#http://localhost:#http://${OPEN_MERCATO_DOCKER_REGISTRY_HOST}:#g" \
        -e "s#http://127.0.0.1:#http://${OPEN_MERCATO_DOCKER_REGISTRY_HOST}:#g" \
        .yarnrc.yml > .yarnrc.yml.container; \
      if ! grep -Eq '^checksumBehavior:' .yarnrc.yml.container; then \
        printf '\nchecksumBehavior: update\n' >> .yarnrc.yml.container; \
      fi; \
      mv .yarnrc.yml.container .yarnrc.yml; \
    fi
# Production deps only; reuses the same Yarn cache to avoid re-downloading packages.
RUN --mount=type=cache,id=yarn-berry-cache,target=/root/.yarn/berry/cache \
    yarn workspaces focus --all --production

COPY --from=builder /app/.mercato/next ./.mercato/next
COPY --from=builder /app/public ./public
COPY --from=builder /app/src ./src
COPY --from=builder /app/lib ./lib
COPY --from=builder /app/types ./types
COPY --from=builder /app/.mercato ./.mercato
COPY --from=builder /app/next.config.ts ./next.config.ts
COPY --from=builder /app/postcss.config.mjs ./postcss.config.mjs
COPY --from=builder /app/components.json ./components.json
COPY --from=builder /app/tsconfig.json ./tsconfig.json
COPY docker/scripts/init-or-migrate.sh /app/docker/scripts/init-or-migrate.sh
RUN chmod +x /app/docker/scripts/init-or-migrate.sh

RUN adduser -D -u 1001 omuser \
 && chown -R omuser:omuser /app

USER omuser

EXPOSE ${CONTAINER_PORT}
CMD ["yarn", "start"]
