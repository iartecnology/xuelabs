# Stage 1: Build
FROM node:20-alpine AS builder

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci

# Copy source code
COPY . .

# Build the application (CSR only as SSR is disabled)
RUN npm run build

# Stage 2: Run
FROM node:20-alpine

WORKDIR /app

# Install simple http-server to serve static files
RUN npm install -g http-server

# Copy built assets from builder (CSR output is in browser folder usually, or root of dist/learnhub depending on config)
# In Angular 17+ with SSR false, output is usually dist/learnhub/browser or just dist/learnhub
COPY --from=builder /app/dist/learnhub/browser ./public

# Expose port (Easypanel expects 4000 based on previous config, so we make http-server listen on 4000)
EXPOSE 4000

# Start static server
# -p 4000: Port
# -c-1: Disable caching for safety during dev/deploy
# --proxy http://localhost:4000?: No, just serve index.html for SPA
CMD ["http-server", "./public", "-p", "4000", "--cors", "-c-1", "--proxy", "http://localhost:4000?"]
