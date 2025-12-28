# Stage 1: Build
FROM node:20-alpine AS builder

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci

# Copy source code
COPY . .

# Build the application
RUN npm run build

# Stage 2: Run
FROM node:20-alpine

WORKDIR /app

# Copy built assets from builder
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/package*.json ./

# Expose port (Easypanel usually expects 3000 or 80 or 4000)
# Angular SSR defaulted to 4000 usually, but let's expose 4000
EXPOSE 4000

# Start the server
CMD ["node", "dist/learnhub/server/server.mjs"]
