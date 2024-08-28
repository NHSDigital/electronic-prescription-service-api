# syntax=docker/dockerfile:1

# --- Dependencies ---
FROM node:20.10.0-alpine AS base
WORKDIR /app


# --- Build---
FROM node:20.10.0-alpine AS build
WORKDIR /build
COPY package*.json ./
COPY packages/coordinator ./packages/coordinator
COPY packages/models ./packages/models
RUN npm ci --ignore-scripts --workspace packages/coordinator --workspace packages/models --include-workspace-root
RUN npm run build --workspace packages/coordinator
RUN find . -name 'node_modules' -type d -prune -exec rm -rf '{}' +

# --- Runtime ---
FROM base AS runtime
ENV NO_UPDATE_NOTIFIER true
COPY --from=build /build/package.json /app
COPY --from=build /build/package-lock.json /app
COPY --from=build /build/packages/coordinator/package.json /app/packages/coordinator/package.json
COPY --from=build /build/packages/coordinator/dist/ /app/packages/coordinator/dist
RUN npm ci --ignore-scripts --only=production --workspace packages/coordinator

RUN mkdir -p /.npm && chown -R nobody:nogroup /.npm
RUN chown -R nobody:nogroup /app
USER nobody
ENV npm_config_cache=/.npm
CMD ["npm", "run", "start", "--workspace", "packages/coordinator"]
