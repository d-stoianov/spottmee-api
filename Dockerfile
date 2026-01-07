FROM node:20 AS base
WORKDIR /app

RUN apt-get update && apt-get install -y --no-install-recommends \
    python3 \
    build-essential \
    openssl \
    ca-certificates \
    && npm install -g pnpm \
    && rm -rf /var/lib/apt/lists/*

COPY package.json package-lock.json* ./
RUN npm install --frozen-lockfile
RUN npm rebuild @tensorflow/tfjs-node --build-from-source

FROM base AS build
COPY . .
RUN npm run prisma:generate
RUN npm run build

RUN npm rebuild @tensorflow/tfjs-node --build-from-source

FROM node:20-slim AS prod
WORKDIR /app

RUN apt-get update && apt-get install -y --no-install-recommends \
    openssl \
    ca-certificates \
    && npm install -g pnpm \
    && rm -rf /var/lib/apt/lists/*

COPY package.json package-lock.json* ./
RUN npm install --frozen-lockfile --production

COPY --from=base /app/node_modules/@tensorflow/tfjs-node/lib/napi-v8 \
    /app/node_modules/@tensorflow/tfjs-node/lib/napi-v8

COPY --from=build /app/dist ./dist
COPY --from=build /app/prisma ./prisma
COPY --from=build /app/node_modules/.prisma ./node_modules/.prisma
COPY --from=build /app/node_modules/@prisma ./node_modules/@prisma

EXPOSE 3000
CMD ["sh", "-c", "npx prisma migrate deploy && node dist/main.js"]
