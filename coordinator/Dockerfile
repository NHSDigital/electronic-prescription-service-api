FROM node:12.18.1-alpine

WORKDIR /app

COPY app.yaml ./
COPY package*.json ./

RUN npm install --only=production

COPY dist/ ./
RUN chmod -R a+x /app

USER nobody

#EXPOSE 9000
CMD ["npm", "run", "start"]
