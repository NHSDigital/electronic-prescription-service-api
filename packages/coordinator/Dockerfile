FROM node:19.5.0-alpine

ENV NO_UPDATE_NOTIFIER true

WORKDIR /app

COPY package*.json ./
RUN npm config set update-notifier false
RUN npm ci --only=production
COPY dist/ ./
RUN chmod -R a+x /app

USER nobody

CMD ["npm", "run", "start"]
