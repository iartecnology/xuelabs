# Stage 1: Build
FROM node:20-alpine AS builder

WORKDIR /app

COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

# Stage 2: Run
FROM node:20-alpine

WORKDIR /app

RUN npm install -g http-server

# Copy browser build to public folder
COPY --from=builder /app/dist/learnhub/browser ./public

# ENV Variables for http-server
ENV PORT=4000

EXPOSE 4000

# HOST 0.0.0.0 is CRITICAL for Docker networking
CMD ["http-server", "./public", "-p", "4000", "-a", "0.0.0.0", "--cors", "-c-1", "--proxy", "http://localhost:4000?"]
