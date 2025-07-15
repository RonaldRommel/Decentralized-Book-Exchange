# Use official Node.js base image
FROM node:18

# Set working directory inside the container
WORKDIR /app

# Copy package.json and package-lock.json first for dependency installation
COPY package*.json ./

# Install dependencies
RUN npm install

# Copy rest of the application code
COPY . .

# Expose the port the service listens on
EXPOSE 3002

# Start the server
CMD ["npm", "start"]
