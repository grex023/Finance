# Use the official Node.js image as base
FROM node:18-alpine

# Set the working directory
WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies with better error handling
RUN npm ci && npm cache clean --force

# Copy the rest of the application code
COPY . .

# Build the application
RUN npm run build

# Install a simple HTTP server for serving static content
RUN npm install -g serve

# Create a non-root user for security
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nodejs -u 1001

# Change ownership of the app directory
RUN chown -R nodejs:nodejs /app
USER nodejs

# Expose the port the app runs on
EXPOSE 3000

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=40s --retries=3 \
  CMD curl -f http://localhost:3000 || exit 1

# Command to run the application
CMD ["serve", "-s", "dist", "-l", "3000"]
