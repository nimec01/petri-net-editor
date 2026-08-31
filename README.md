# Petri Net Editor

An interactive, browser-based [Petri net](https://en.wikipedia.org/wiki/Petri_net) editor with simulation and analysis tooling. Build nets visually, fire transitions, inspect reachability and liveness, and share models via URL.

Built with [Nuxt](https://nuxt.com/) 4, Vue 3, TypeScript, [Cytoscape.js](https://js.cytoscape.org/), Tailwind CSS v4, and [daisyUI](https://daisyui.com/) 5.

> [!WARNING]
> This project is a work in progress. Breaking changes can happen at any time, and the application is not optimized for performance — expect rough edges, especially with large nets.

> [!NOTE]
> This project made heavy use of AI coding agents.

## Features

- **Editing** — create, edit, and delete places, transitions, and weighted arcs; set tokens on places; drag elements anywhere on the canvas
- **History** — full undo/redo for every editing action
- **Visualization** — canvas zoom, pan, and fit-to-view; automatic (DAG-based) layouts; labels for places, transitions, and initial markings
- **Simulation** — manually fire enabled transitions, run automatic random firing, step through executions, and inspect the firing history / trace
- **Analysis** — extensions for reachability, reachability graphs, boundedness, liveness, safeness, and deadlock detection
- **Math notation** — render state equations and formulas with KaTeX
- **Persistence** — save/load nets to JSON, share a net as an encoded URL, or load it by sending it to the server with a POST request
- **Enabled-transition highlighting** — see at a glance which transitions can fire

## Deployment

There is currently **no public instance** available. You can self-host the application using Docker.

```bash
docker run -p 3000:3000 ghcr.io/nimec01/petri-net-editor:latest
```

You can also build the Docker image yourself:

```bash
docker build -t petri-net-editor .
docker run -p 3000:3000 petri-net-editor
```

The editor is then available at <http://localhost:3000>.

## Getting started

Requirements: Node.js 20+ and [pnpm](https://pnpm.io/).

```bash
pnpm install
pnpm dev
```

The dev server runs at <http://localhost:3000>.

A [Devcontainer](.devcontainer/) is set up for this project, so you can also develop inside a ready-made container using VS Code's Dev Containers support.

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

## Loading a net via POST

Besides shareable links, the editor can be opened with a pre-defined net by sending a `POST` request to `/editor`. The request body is the JSON representation of the net (the same format produced by **Save**), either as a raw object or wrapped in a `net` field:

```bash
curl -X POST http://localhost:3000/editor \
  -H 'Content-Type: application/json' \
  -d '{
    "net": {
      "elements": [
        { "id": "p1", "type": "place", "label": "P1", "tokens": 2, "x": 100, "y": 200 },
        { "id": "t1", "type": "transition", "label": "T1", "x": 250, "y": 200 },
        { "id": "a1", "type": "arc", "label": "", "source": "p1", "target": "t1" }
      ]
    }
  }'
```

A successful request responds with a `303 See Other` redirect to `/editor#<encoded-net>`, and the editor loads the net. An invalid body (no `elements` array) is rejected with a `400 Bad Request`.

FormData is supported as well — send the same JSON in a `net` field:

```js
const form = new FormData();
form.append('net', JSON.stringify({ elements: [{ id: 'p1', type: 'place', label: 'P1', tokens: 2, x: 100, y: 200 }] }));
await fetch('/editor', { method: 'POST', body: form });
```

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
