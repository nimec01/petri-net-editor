# Contributing

Thanks for your interest in contributing to the Petri Net Editor! This project is under active development, so contributions, bug reports, and feature ideas are all welcome.

## Getting started

Requirements: Node.js 20+ and [pnpm](https://pnpm.io/).

```bash
pnpm install
pnpm dev
```

The dev server runs at <http://localhost:3000>.

## Project structure

- `app/` — Nuxt 4 application code
  - `components/editor/` — editor UI (canvas, toolbar, panels, modals)
  - `extensions/` — pluggable analysis extensions (reachability, liveness, ...)
  - `composables/` — core state: `usePetriNet`, `useExtensions`
  - `pages/` — routes (`/editor`)
- `tests/unit/` — Vitest unit tests
- `e2e/` — Playwright end-to-end tests

## Code style

- TypeScript throughout, single quotes, semicolons, 2-space indent
- Use existing components and patterns; consult daisyUI docs before introducing new UI
- ESLint (`@antfu/eslint-config`) enforces style — prefer `pnpm lint:fix` over manual formatting

## Verification

Run these before submitting a pull request, in the same order as CI:

```bash
pnpm build
pnpm typecheck
pnpm lint
pnpm test
```

- `pnpm test` runs unit (Vitest) and end-to-end (Playwright) tests
- For a faster unit-test loop: `pnpm test:unit:watch`
- End-to-end tests use Playwright; run `pnpm exec playwright install` once if browsers are missing

## Committing

- Keep changes focused and write clear, descriptive commit messages
- If a change affects behavior, update the README and the CHANGELOG (`CHANGELOG.md`) accordingly

## Reporting bugs and proposing features

- Open an issue describing the problem, the expected behavior, and steps to reproduce
- For feature requests, describe the use case so the maintainers can evaluate scope

## License

By contributing, you agree that your contributions are licensed under the [GNU Affero General Public License v3.0 or later](LICENSE).
