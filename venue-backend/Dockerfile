# Use Node.js 20-alpine for a lightweight production image
FROM node:20-alpine

# Use production environment by default
ENV NODE_ENV=production

# Set working directory
WORKDIR /app

# Install dependencies first for better layer caching
# Only copy package files to avoid re-installing on source code changes
COPY package*.json ./

# npm ci is faster and more reliable for production builds
# Install only production dependencies
RUN npm ci --only=production

# Copy the rest of the application source code
COPY . .

# Create logs directory and set permissions for the node user
RUN mkdir -p logs && chown -R node:node /app

# Use non-root user for security
USER node

# Expose the application port
EXPOSE 5000

# Start the application using node directly (cleaner for signals)
CMD ["node", "server.js"]
