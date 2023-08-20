# Orbiter 8 Game Client: Demo3 (/demo3)
#
# Build Stage 1: NPM Install to generate assets
# Latest Node.js LTS version as of 2022.03.22: 16.14.2
FROM node:16-alpine AS builder
WORKDIR /app
COPY . /app
RUN npm config set depth 0 \
    && npm install \
    && npm i caniuse-lite browserslist \
    && npm run docker-build \
    && rm -rf node_modules

# 2022.06.09: We don't need PHP, so just use the nginx base image
# Build Stage 3: Final image, without unneeded components
# Base image from https://github.com/Partavate-Studios/nginx-php-fpm
# FROM registry.gitlab.com/partavate/infrastructure/nginx-php-fpm:php81
FROM nginx:alpine

# Kubernetes secrets will fill in certain ENV values
# COPY ./deployment/docker.env /var/www/.env
COPY ./deployment/docker.nginx.conf /etc/nginx/conf.d/orbiter8.conf
RUN rm -rf /etc/nginx/conf.d/default.conf

# Copy compiled PHP and Assets to the final image
COPY --from=builder /app/dist /var/www/public/demo3
