# MarketAI (Soko)

Next.js frontend for Soko Rwanda — a B2B supply-chain marketplace prototype.

## Getting Started

```bash
yarn install
yarn dev
```

Open [http://localhost:3000](http://localhost:3000).

## Scripts

| Command | Description |
| --- | --- |
| `yarn dev` | Start Next.js dev server |
| `yarn build` | Production build |
| `yarn start` | Start production server |
| `yarn lint` | ESLint |
| `yarn format` | Prettier write |
| `yarn test` | Vitest (watch) |
| `yarn test:run` | Vitest once |
| `yarn test:ci` | Vitest with coverage |
| `yarn type-check` | TypeScript check |

## Tooling

Aligned with `hospital-front`:

- Next.js App Router + React Compiler
- Tailwind CSS v4 (PostCSS)
- ESLint (`eslint-config-next`) + Prettier
- Vitest + Testing Library
- Husky + lint-staged (pre-commit)
- GitHub Actions CI (lint, test matrix, build)
