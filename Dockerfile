# Stage 1: Build
FROM node:20-alpine AS builder

WORKDIR /app

COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

# Stage 2: Run using Nginx
FROM nginx:alpine

# Copy built assets
COPY --from=builder /app/dist/learnhub/browser /usr/share/nginx/html

# Custom config to LISTEN ON PORT 4000 to match user's Easypanel config
RUN echo 'server { \
    listen 4000; \
    server_name localhost; \
    root /usr/share/nginx/html; \
    index index.html; \
    location / { \
    try_files $uri $uri/ /index.html; \
    } \
    include /etc/nginx/mime.types; \
    }' > /etc/nginx/conf.d/default.conf

# Expose 4000 explicitly
EXPOSE 4000

CMD ["nginx", "-g", "daemon off;"]
