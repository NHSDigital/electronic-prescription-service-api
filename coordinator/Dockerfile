FROM node:17-alpine3.14

ENV NO_UPDATE_NOTIFIER true

WORKDIR /app

COPY package*.json ./
RUN npm config set update-notifier false
RUN npm ci --only=production
COPY dist/ ./
RUN chmod -R a+x /app

USER nobody

CMD ["npm", "run", "start"]
