# Use official Node.js base image
FROM node:18

WORKDIR /app/exchange-service

COPY package*.json ./

RUN npm install

EXPOSE 3002

CMD ["npm", "run","dev"]
