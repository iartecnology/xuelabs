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

# CONFIG NGINX TO LISTEN ON PORT 80 (Standard for Easypanel default)
RUN echo 'server { \
    listen 80; \
    server_name localhost; \
    root /usr/share/nginx/html; \
    index index.html; \
    location / { \
    try_files $uri $uri/ /index.html; \
    } \
    include /etc/nginx/mime.types; \
    }' > /etc/nginx/conf.d/default.conf

# Expose port 80
EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
