# Stage 1: Build
FROM node:20-alpine AS builder

WORKDIR /app

COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

# Stage 2: Run using Nginx (Production Grade)
FROM nginx:alpine

# Copy built assets to Nginx html folder
# Try both potential output paths to be safe. Angular 17+ outputs to browser folder.
COPY --from=builder /app/dist/learnhub/browser /usr/share/nginx/html

# Custom Nginx config to handle SPA routing (fallback to index.html)
RUN echo 'server { \
    listen 80; \
    server_name localhost; \
    root /usr/share/nginx/html; \
    index index.html; \
    location / { \
    try_files $uri $uri/ /index.html; \
    } \
    # MIME types fix \
    include /etc/nginx/mime.types; \
    }' > /etc/nginx/conf.d/default.conf

# Easypanel maps port 80 by default for Nginx images usually, or we can expose 80.
# Your Docker Compose exposes 4000? We should stick to 80 internal for Nginx standard.
EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
