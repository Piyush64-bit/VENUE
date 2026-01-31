# Use Node.js LTS (Alpine for smaller image size)
FROM node:20-alpine

# Set working directory
WORKDIR /app

# Copy package files first to leverage cache
COPY package*.json ./

# Install dependencies (use npm ci for clean install using lockfile)
RUN npm ci --only=production

# Copy the rest of the application code
COPY . .

# Expose the application port
EXPOSE 5000

# Start the application
CMD ["node", "src/server.js"]
