# AGENTS.md

## Stack

- Nuxt 4 + Vue 3 + TypeScript
- Tailwind CSS v4 (Vite plugin, not PostCSS) + daisyUI v5
- pnpm 11.9.0 (use `pnpm`, not `npm` or `yarn`)
- ESLint with `@antfu/eslint-config`

## Commands

```bash
pnpm install        # install deps
pnpm dev            # dev server on :3000
pnpm build          # production build
pnpm typecheck      # nuxt prepare + vue-tsc -b --noEmit (generates .nuxt/tsconfig first)
pnpm lint           # eslint
pnpm lint:fix        # eslint --fix
```

No test framework is configured. There is no test script.

## Verification order (matches CI)

```bash
pnpm build && pnpm typecheck && pnpm lint
```

CI runs build first — `pnpm typecheck` depends on `.nuxt/` output from build or `nuxt prepare`.

## Project structure

- `app/` — all application code (Nuxt 4 convention, not root-level)
- `app/app.vue` — root component
- `app/assets/css/main.css` — Tailwind v4 entrypoint (`@import "tailwindcss"` + `@plugin "daisyui"`)
- `nuxt.config.ts` — Tailwind loaded as Vite plugin, not CSS module
- `public/` — static assets

## Conventions

- Single quotes, semicolons, 2-space indent, 1tbs brace style (enforced by ESLint)
- daisyUI skills live under `.agents/skills/daisyui/` — consult component docs there before creating UI
- `tsconfig.json` uses Nuxt-generated references in `.nuxt/`; do not edit manually
- `pnpm-workspace.yaml` disables esbuild and `@parcel/watcher` native builds

## Environment

- Nuxt MCP server is connected (`opencode.jsonc`) — available for Nuxt API/docs questions
