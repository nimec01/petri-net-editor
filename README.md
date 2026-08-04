# Petri Net Editor

An interactive, browser-based [Petri net](https://en.wikipedia.org/wiki/Petri_net) editor with simulation and analysis tooling. Build nets visually, fire transitions, inspect reachability and liveness, and share models via URL.

Built with [Nuxt](https://nuxt.com/) 4, Vue 3, TypeScript, [Cytoscape.js](https://js.cytoscape.org/), Tailwind CSS v4, and [daisyUI](https://daisyui.com/) 5.

> **Status: under active development.** This project is a work in progress. Breaking changes can happen at any time, and the application is not optimized for performance — expect rough edges, especially with large nets.

## Features

- **Editing** — create, edit, and delete places, transitions, and weighted arcs; set tokens on places; drag elements anywhere on the canvas
- **History** — full undo/redo for every editing action
- **Visualization** — canvas zoom, pan, and fit-to-view; automatic (DAG-based) layouts; labels for places, transitions, and initial markings
- **Simulation** — manually fire enabled transitions, run automatic random firing, step through executions, and inspect the firing history / trace
- **Analysis** — extensions for reachability, reachability graphs, boundedness, liveness, safeness, and deadlock detection
- **Math notation** — render state equations and formulas with KaTeX
- **Persistence** — save/load nets to JSON and share a net as an encoded URL
- **Enabled-transition highlighting** — see at a glance which transitions can fire

## Getting started

Requirements: Node.js 20+ and [pnpm](https://pnpm.io/).

```bash
pnpm install
pnpm dev
```

The dev server runs at <http://localhost:3000>.

## Production

```bash
pnpm build
pnpm preview
```

Or generate a static site:

```bash
pnpm generate
```

## Quality checks

```bash
pnpm test           # unit + end-to-end tests
pnpm test:unit      # Vitest unit tests (tests/unit)
pnpm test:e2e       # Playwright end-to-end tests (e2e)
pnpm typecheck      # Vue TypeScript checks (app + tests)
pnpm lint           # ESLint
```

Continuous integration runs build, typecheck, lint, unit tests, and Playwright tests on every push to `main` and on pull requests.

## Project structure

- `app/` — Nuxt 4 application code
  - `components/editor/` — editor UI (canvas, toolbar, panels, modals)
  - `extensions/` — pluggable analysis extensions (reachability, liveness, ...)
  - `composables/` — core state: `usePetriNet`, `useExtensions`
  - `pages/` — routes (`/editor`)
- `tests/unit/` — Vitest unit tests
- `e2e/` — Playwright end-to-end tests
- `.github/workflows/ci.yaml` — CI pipeline

## License

This project is licensed under the [GNU Affero General Public License v3.0 or later](LICENSE).

## Contributing

Contributions are welcome — see [CONTRIBUTING.md](CONTRIBUTING.md) for setup, style, and verification guidelines.
