FROM node:24-alpine AS build

WORKDIR /app

RUN corepack enable

COPY pnpm-lock.yaml pnpm-workspace.yaml package.json ./

RUN pnpm install --frozen-lockfile

COPY . .

RUN pnpm build


FROM node:24-alpine AS run

WORKDIR /app

ENV NODE_ENV=production
ENV HOST=0.0.0.0
ENV PORT=3000

COPY --from=build /app/.output .output

# Install only the production dependencies that Nuxt's node-server output
# declares in .output/server/package.json. corepack provides the pinned
# pnpm, and is disabled again so the final image keeps just the runtime.
RUN corepack enable \
    && cd .output/server \
    && NODE_ENV=production pnpm install --prod \
    && corepack disable

# Run as an unprivileged user
RUN addgroup --system --gid 1001 app \
    && adduser --system --uid 1001 --ingroup app app
USER app

EXPOSE 3000

CMD ["node", ".output/server/index.mjs"]
