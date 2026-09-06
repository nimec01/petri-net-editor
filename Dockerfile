FROM node:24-alpine AS build

WORKDIR /app

RUN corepack enable

COPY pnpm-lock.yaml pnpm-workspace.yaml package.json ./

RUN pnpm install --frozen-lockfile

COPY . .

# The project's default Nitro preset is Cloudflare Workers; request the
# Node.js server preset here so the image runs the app as a Node service.
RUN NITRO_PRESET=node-server pnpm build


FROM node:24-alpine AS run

WORKDIR /app

ENV NODE_ENV=production
ENV HOST=0.0.0.0
ENV PORT=3000

COPY --from=build /app/.output .output

# Install only the production dependencies that Nuxt's node-server output
# declares in .output/server/package.json. Uses npm instead of pnpm because
# pnpm relies on symlinks that fail across Docker overlay devices after COPY.
RUN cd .output/server \
    && NODE_ENV=production npm install --omit=dev

# Run as an unprivileged user
RUN addgroup --system --gid 1001 app \
    && adduser --system --uid 1001 --ingroup app app
USER app

EXPOSE 3000

CMD ["node", ".output/server/index.mjs"]
