# syntax=docker/dockerfile:1

# --- Dependencies ---
FROM node:16.14.2-alpine AS base
WORKDIR /app

# --- Build Client ---
FROM node:16.14.2-alpine AS build-client
WORKDIR /build
COPY client/package*.json ./
RUN npm ci
COPY client/ ./
RUN npm run build

# --- Build Server ---
FROM node:16.14.2-alpine AS build-server
WORKDIR /build
COPY server/package*.json ./
RUN npm ci
COPY server/tsconfig.json ./
COPY server/src src
RUN npm run build:prod

# --- Runtime ---
FROM base AS runtime
ENV NO_UPDATE_NOTIFIER true
COPY --from=build-server /build/node_modules node_modules
COPY --from=build-server /build/dist/ ./
COPY --from=build-server /build/package*.json ./
COPY --from=build-client /build/static ./static
COPY --from=build-client /build/dist/index.js ./static/
COPY --from=build-client /build/index.html ./templates/index.html
RUN chmod -R a+x /app
USER nobody
CMD ["npm", "run", "start"]
