# Stage 1: Build
FROM node:20-alpine AS builder

WORKDIR /app

COPY package*.json ./
RUN npm ci
COPY . .
# Keep base-href relative
RUN npm run build -- --base-href=./

# Stage 2: Run using Nginx
FROM nginx:alpine

# Copy built assets to Nginx html folder
COPY --from=builder /app/dist/learnhub/browser /usr/share/nginx/html

# Create a dedicated health check file
RUN echo "OK" > /usr/share/nginx/html/health.txt

# Simplest Nginx Config possible for SPA
RUN echo 'server { \
    listen 80; \
    server_name localhost; \
    root /usr/share/nginx/html; \
    index index.html; \
    \
    # Health check endpoint \
    location /health.txt { \
    access_log off; \
    return 200 "OK"; \
    } \
    \
    # Main app \
    location / { \
    try_files $uri $uri/ /index.html; \
    } \
    }' > /etc/nginx/conf.d/default.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
