# syntax=docker/dockerfile:1

# --- Dependencies ---
FROM node:24.3.0-alpine AS base
WORKDIR /app
RUN apk update; \
    apk upgrade

# --- Build---
FROM node:24.3.0-alpine AS build
WORKDIR /build
RUN apk update; \
    apk upgrade
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
COPY --from=build /build/packages/coordinator/package.json /app/packages/coordinator/dist/package.json
COPY --from=build /build/packages/coordinator/src/resources /app/packages/coordinator/dist/coordinator/src/resources
RUN npm ci --ignore-scripts --only=production --workspace packages/coordinator

RUN mkdir -p /.npm && chown -R nobody:nogroup /.npm
RUN chown -R nobody:nogroup /app
USER nobody
ENV npm_config_cache=/.npm
# use node command directly rather than npm start so SIGTERM signal handled correctly
# see https://github.com/nodejs/docker-node/blob/main/docs/BestPractices.md#cmd
CMD ["node", "--enable-source-maps", "packages/coordinator/dist/coordinator/src/app.js", "--use_strict"]
