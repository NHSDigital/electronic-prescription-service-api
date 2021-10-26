FROM node:12.18.1 as builder

WORKDIR /app

COPY . .
RUN npm config set update-notifier false
RUN npm --prefix=coordinator ci
RUN npm --prefix=models ci

RUN npm --prefix=coordinator run build

RUN mkdir -p coordinator/dist/coordinator/src/resources

COPY coordinator/src/resources/ebxml_request.mustache coordinator/dist/coordinator/src/resources/

COPY validator/src/main/resources/manifest.json coordinator/dist/coordinator/src/resources/validator_manifest.json

FROM node:12.18.1-alpine

ENV NO_UPDATE_NOTIFIER true

COPY --from=builder /app/coordinator/dist/ ./

USER nobody

CMD ["npm", "run", "start"]
