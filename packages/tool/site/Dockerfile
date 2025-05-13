# syntax=docker/dockerfile:1

# --- Dependencies ---
FROM node:24.0.1-alpine AS base
WORKDIR /app
RUN apk update; \
    apk upgrade


# --- Build Client ---
FROM node:24.0.1-alpine AS build-client
WORKDIR /build
RUN apk update; \
    apk upgrade
COPY package*.json ./
COPY packages/tool/site/client ./packages/tool/site/client
RUN npm ci --ignore-scripts --workspace packages/tool/site/client --include-workspace-root
COPY node_modules/nhsuk-frontend/dist/nhsuk.css ./packages/tool/site/client/static/
RUN npm run build --workspace packages/tool/site/client
RUN find . -name 'node_modules' -type d -prune -exec rm -rf '{}' +

# --- Build Server ---
FROM node:24.0.1-alpine AS build-server
WORKDIR /build
RUN apk update; \
    apk upgrade
COPY package*.json ./
COPY packages/tool/site/server ./packages/tool/site/server
RUN npm ci --ignore-scripts --workspace packages/tool/site/server --include-workspace-root
RUN npm run build:prod --workspace packages/tool/site/server
RUN find . -name 'node_modules' -type d -prune -exec rm -rf '{}' +

# --- Runtime ---
FROM base AS runtime
ENV NO_UPDATE_NOTIFIER true
COPY --from=build-server /build/package.json /app
COPY --from=build-server /build/package-lock.json /app
COPY --from=build-server /build/packages/tool/site/server/dist/ /app/packages/tool/site/server/
COPY --from=build-server /build/packages/tool/site/server/package*.json /app/packages/tool/site/server/
COPY --from=build-client /build/packages/tool/site/client/static /app/packages/tool/site/server/static
COPY --from=build-client /build/packages/tool/site/client/dist/index.js /app/packages/tool/site/server/static/
COPY --from=build-client /build/packages/tool/site/client/dist/index.js.map /app/packages/tool/site/server/static/
COPY --from=build-client /build/packages/tool/site/client/index.html /app/packages/tool/site/server/templates/index.html
RUN npm ci --ignore-scripts --only=production --workspace packages/tool/site/server --workspace packages/tool/site/client
RUN mkdir "/.npm"
RUN chown -R 65534:65534 "/.npm"
RUN chmod -R a+x /app
USER nobody
CMD ["npm", "run", "start", "--workspace", "packages/tool/site/server"]
