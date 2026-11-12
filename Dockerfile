FROM node:20-alpine AS build
WORKDIR /app
RUN corepack enable
COPY package.json pnpm-lock.yaml ./
RUN pnpm install --frozen-lockfile
COPY . .
RUN pnpm build

FROM node:20-alpine AS runtime-base
COPY scripts/prepare-share-fonts.sh /usr/local/bin/prepare-share-fonts.sh
RUN apk add --no-cache fontconfig font-noto-all font-noto-cjk font-noto-emoji \
    && sh /usr/local/bin/prepare-share-fonts.sh
WORKDIR /app
RUN corepack enable
COPY package.json pnpm-lock.yaml ./
RUN pnpm install --prod --frozen-lockfile
ENV NODE_ENV=production
ENV HOST=0.0.0.0
ENV PORT=8080
EXPOSE 8080
CMD ["node", "dist/server/entry.mjs"]

# CI supplies the exact artifact that Firebase Hosting will serve.
FROM runtime-base AS prebuilt
COPY dist ./dist
COPY public ./public
COPY release-manifest.json ./release-manifest.json
COPY scripts/verify-release-artifact.mjs /usr/local/bin/verify-release-artifact.mjs
RUN node /usr/local/bin/verify-release-artifact.mjs /app

# Keep source builds available for local development and existing tooling.
FROM runtime-base AS runtime
COPY --from=build /app/dist ./dist
COPY --from=build /app/public ./public
