FROM node:18

WORKDIR /app/user-service

COPY package*.json ./
RUN npm install

EXPOSE 3001

CMD ["npm", "run", "dev"]
