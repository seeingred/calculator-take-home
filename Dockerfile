# syntax=docker/dockerfile:1

# ---- deps: install exactly what package-lock.json pins ----
FROM node:22-alpine AS deps
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci --no-audit --no-fund
COPY . .

# ---- test: `docker build --target test .` fails if any test fails ----
FROM deps AS test
RUN npm test

# ---- build: built from the test stage, so an untested image can't ship ----
FROM test AS build
RUN npm run build

# ---- runtime: static files served by unprivileged nginx on 0.0.0.0:8080 ----
FROM nginxinc/nginx-unprivileged:1.29-alpine AS runtime
COPY nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /app/dist /usr/share/nginx/html
EXPOSE 8080
USER 101
HEALTHCHECK --interval=10s --timeout=3s --start-period=5s \
  CMD wget -q -O /dev/null http://127.0.0.1:8080/ || exit 1
