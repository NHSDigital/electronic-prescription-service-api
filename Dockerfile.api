# syntax=docker/dockerfile:1

# --- Dependencies ---
FROM node:16.14.2-alpine as base
WORKDIR /app


# --- Build---
FROM node:16.14.2-alpine as build
WORKDIR /build
COPY package*.json ./
COPY packages/coordinator ./packages/coordinator
COPY packages/models ./packages/models
RUN npm ci --workspace packages/coordinator
RUN npm run build --workspace packages/coordinator
RUN find . -name 'node_modules' -type d -prune -exec rm -rf '{}' +
RUN npm ci --only=production --workspace packages/coordinator

# --- Runtime ---
FROM base AS runtime
ENV NO_UPDATE_NOTIFIER true
COPY --from=build /build/package.json /app
COPY --from=build /build/node_modules /app/node_modules
COPY --from=build /build/packages/coordinator/package.json /app/packages/coordinator/package.json
COPY --from=build /build/packages/coordinator/dist/ /app/packages/coordinator/dist
COPY --from=build /build/packages/coordinator/node_modules /app/packages/coordinator/node_modules

RUN chmod -R a+x /app
USER nobody
CMD ["npm", "run", "start", "--workspace", "packages/coordinator"]
