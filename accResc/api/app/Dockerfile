FROM node:24-bookworm-slim AS deps
WORKDIR /app
COPY package*.json ./
RUN npm install

FROM node:24-bookworm-slim AS build
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN npm run build

FROM node:24-bookworm-slim AS runtime
WORKDIR /app
ENV NODE_ENV=production
RUN apt-get update \
  && apt-get install -y --no-install-recommends texlive-latex-base texlive-latex-recommended ca-certificates \
  && rm -rf /var/lib/apt/lists/*
COPY --from=build /app/dist ./dist
COPY --from=build /app/package*.json ./
COPY --from=deps /app/node_modules ./node_modules
RUN mkdir -p /data/docs /data/output
EXPOSE 3000
CMD ["node", "dist/boot.js"]
