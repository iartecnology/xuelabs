# Stage 1: Build
FROM node:20-alpine AS builder

WORKDIR /app

COPY package*.json ./
RUN npm ci
COPY . .
# Configura base-href relativo durante el build también para asegurar consistencia
RUN npm run build -- --base-href=./

# Stage 2: Run using Nginx
FROM nginx:alpine

# Copy built assets
COPY --from=builder /app/dist/learnhub/browser /usr/share/nginx/html

# Config Nginx con Logs detallados y sin cache agresivo para debug
RUN echo 'server { \
    listen 80; \
    server_name localhost; \
    root /usr/share/nginx/html; \
    index index.html; \
    \
    # Logs a stdout para verlos en Easypanel \
    error_log /dev/stderr debug; \
    access_log /dev/stdout; \
    \
    location / { \
    try_files $uri $uri/ /index.html; \
    add_header Cache-Control "no-store, no-cache, must-revalidate"; \
    } \
    \
    # Tipos MIME correctos \
    include /etc/nginx/mime.types; \
    types { \
    application/javascript js mjs; \
    } \
    }' > /etc/nginx/conf.d/default.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
