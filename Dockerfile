# Use Node.js 20
FROM node:20-slim

# Set working directory
WORKDIR /app

# Copy server package files
COPY server/package*.json ./server/

# Install dependencies
WORKDIR /app/server
RUN npm ci

# Copy server source code
COPY server/ ./

# Expose port
EXPOSE 3000

# Start with ts-node (no compilation needed)
CMD ["npx", "ts-node", "--transpile-only", "src/index.ts"]
