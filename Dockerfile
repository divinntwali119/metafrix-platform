# syntax=docker/dockerfile:1.7
FROM node:22-alpine AS base
RUN apk add --no-cache libc6-compat
WORKDIR /app

FROM base AS dependencies
COPY package.json package-lock.json ./
RUN npm ci

FROM base AS builder
ENV NEXT_TELEMETRY_DISABLED=1 \
    NEXT_PUBLIC_DEMO_MODE=false
COPY --from=dependencies /app/node_modules ./node_modules
COPY . .
RUN npm run build

FROM node:22-alpine AS runner
ENV NODE_ENV=production \
    NEXT_TELEMETRY_DISABLED=1 \
    PORT=3000 \
    HOSTNAME=0.0.0.0
WORKDIR /app
RUN apk add --no-cache tini \
    && addgroup -S -g 10001 metafrix \
    && adduser -S -u 10001 -G metafrix -h /home/metafrix metafrix \
    && mkdir -p .next \
    && chown metafrix:metafrix .next
COPY --from=builder --chown=metafrix:metafrix /app/public ./public
COPY --from=builder --chown=metafrix:metafrix /app/.next/standalone ./
COPY --from=builder --chown=metafrix:metafrix /app/.next/static ./.next/static
USER metafrix:metafrix
EXPOSE 3000
ENTRYPOINT ["/sbin/tini", "--"]
CMD ["node", "server.js"]
