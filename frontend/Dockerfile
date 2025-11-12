FROM node:18-alpine as build

WORKDIR /app

# Copy package files first for better caching
COPY package*.json ./

# Install dependencies with better error output
RUN npm install || (echo "npm install failed" && exit 1)

# Copy the rest of the application
COPY . .

# Build the application with better error output
RUN npm run build || (echo "npm build failed" && exit 1)

# Production stage
FROM nginx:stable-alpine

# Copy built assets from build stage
COPY --from=build /app/dist /usr/share/nginx/html

# Add custom nginx config
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Add health check
HEALTHCHECK --interval=30s --timeout=3s \
    CMD wget -q --spider http://localhost:80/ || exit 1
