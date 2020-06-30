FROM node:12.18.1-alpine

WORKDIR /app

COPY package*.json ./
RUN npm install --only=production
COPY dist/ ./
RUN chmod -R a+x /app

USER nobody

CMD ["npm", "run", "start"]
