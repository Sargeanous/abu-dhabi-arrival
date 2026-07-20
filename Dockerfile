# SettleSide production image (Fly.io)
FROM node:24-slim AS build
WORKDIR /app
# npm ci against the committed lockfile: production builds use exactly the
# dependency versions verified locally (an unpinned install once pulled a
# newer vite/h3 stack that broke POST body parsing in production).
COPY package.json package-lock.json ./
RUN npm ci
COPY . .
ENV SETTLESIDE_DEPLOY_TARGET=node
RUN npm run build

FROM node:24-slim
WORKDIR /app
ENV NODE_ENV=production
COPY --from=build /app/.output ./.output
EXPOSE 3000
CMD ["node", ".output/server/index.mjs"]
