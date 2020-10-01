FROM node:12.18.1-alpine

ENV NO_UPDATE_NOTIFIER true

WORKDIR /app

COPY package*.json ./
RUN npm config set update-notifier false
RUN npm install --only=production
COPY dist/ ./
RUN chmod -R a+x /app

USER nobody

CMD ["npm", "run", "start"]
