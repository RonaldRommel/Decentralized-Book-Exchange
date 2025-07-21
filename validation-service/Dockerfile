FROM node:18

WORKDIR /app

COPY package*.json ./
RUN npm install
EXPOSE 3005

# Run the service
CMD ["npm", "run","dev"]
