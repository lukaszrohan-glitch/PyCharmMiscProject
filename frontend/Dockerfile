# Build static frontend
FROM node:18-alpine AS build
WORKDIR /app
COPY package*.json ./
COPY src ./src
COPY index.html ./
RUN npm ci
RUN npm run build

# Serve with nginx
FROM nginx:stable-alpine
COPY --from=build /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]

