# syntax=docker/dockerfile:1

# --- Dependencies ---
FROM python:3.8-slim-buster AS base
RUN apt-get update
RUN apt-get install xz-utils
RUN apt-get -y install curl
RUN curl https://nodejs.org/dist/v14.15.4/node-v14.15.4-linux-x64.tar.xz -O
RUN tar -xf node-v14.15.4-linux-x64.tar.xz
RUN ln -s /node-v14.15.4-linux-x64/bin/node /usr/local/bin/node
RUN ln -s /node-v14.15.4-linux-x64/bin/npm /usr/local/bin/npm
WORKDIR /app

# --- Build Client ---
FROM node:12.18.1-alpine as build-client
WORKDIR /build
COPY client/package*.json ./
RUN npm ci
COPY client/ ./client
RUN rm client/tsconfig.json
RUN rm client/webpack.config.js
COPY client/tsconfig.json ./
COPY client/webpack.config.js ./
RUN npm run build:prod

# --- Build Javascript Server ---
FROM node:12.18.1-alpine as build-javascript-server
WORKDIR /build
COPY server_javascript/package*.json ./
RUN npm ci
COPY server_javascript/tsconfig.json ./
COPY server_javascript/src src
RUN npm run build:prod

# --- Build Python Server ---
FROM python:3.8-slim-buster as build-python-server
WORKDIR /build
COPY requirements.txt requirements.txt
RUN pip3 install -r requirements.txt
COPY ./server_python/ ./

# --- Runtime ---
FROM base AS runtime
ENV NO_UPDATE_NOTIFIER true
COPY --from=build-client /build/static ./static
COPY --from=build-client /build/templates ./templates
COPY --from=build-javascript-server /build/node_modules node_modules
COPY --from=build-javascript-server /build/dist/ .
COPY --from=build-javascript-server /build/package*.json .
COPY --from=build-python-server /usr/local/lib/python3.8/site-packages /usr/local/lib/python3.8/site-packages
COPY --from=build-python-server /build .
COPY docker-entrypoint.sh .
USER nobody
CMD ["/app/docker-entrypoint.sh"]