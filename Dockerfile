# Stage 1: Build
FROM node:20-alpine AS builder

WORKDIR /app

# Copy dependency manifests first for layer caching
COPY package.json ./

RUN npm install

# Copy source
COPY . .

# Build the production bundle
RUN npm run build

# Stage 2: Serve with nginx
FROM nginx:alpine

# Remove default nginx static files
RUN rm -rf /usr/share/nginx/html/*

# Copy built assets from builder stage
COPY --from=builder /app/dist /usr/share/nginx/html

# Copy nginx SPA configuration
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Expose port 80
EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
