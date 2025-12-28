# Stage 1: Build
FROM node:20-alpine AS builder

WORKDIR /app

COPY package*.json ./
RUN npm ci
COPY . .
# Keep base-href relative to be safe
RUN npm run build -- --base-href=./

# Stage 2: Run using http-server (Simpler and more robust for debugging than Nginx)
FROM node:20-alpine

WORKDIR /app

RUN npm install -g http-server

# Copy built assets
COPY --from=builder /app/dist/learnhub/browser ./public

# ENV Variables
ENV PORT=80

EXPOSE 80

# Start static server on PORT 80 bound to 0.0.0.0
# --proxy http://localhost:80? allows SPA routing fallback to index.html
CMD ["http-server", "./public", "-p", "80", "-a", "0.0.0.0", "--cors", "-c-1", "--proxy", "http://localhost:80?"]
