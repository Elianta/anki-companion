# Repository Guidelines

## Project Structure & Module Organization
`src/` holds all application code: `main.tsx` wires Vite + React, `AppShell.tsx` provides layout, `router.tsx` defines routes, `screens/` contains page-level views, `components/` exposes reusable UI built on Radix primitives, `stores/` hosts Zustand state, `lib/` centralizes helpers, and `assets/` stores static media. Keep feature-specific assets colocated with their screen when practical. Global styles live in `src/index.css`. `public/` contains PWA metadata and icons served as-is, while `dist/` is generated output—never edit it manually. Configuration lives in the root (`vite.config.ts`, `tsconfig*.json`, `eslint.config.js`, `components.json` for shadcn exports).

## Build, Test, and Development Commands
- `npm run dev` — start the Vite dev server with Fast Refresh.
- `npm run build` — type-check via `tsc -b` and emit an optimized bundle to `dist/`.
- `npm run preview` — serve the production build locally for smoke testing.
- `npm run lint` — run ESLint across the repo; fix reported issues before pushing.
- `npm run test` — execute the Vitest suite once; append `-- --watch` during local TDD.

## Coding Style & Naming Conventions
Use TypeScript everywhere; prefer typed props/interfaces near their component. Follow functional React component patterns, keep hooks at the top level, and colocate hook logic in `lib/` or `stores/` when reused. Stick to Tailwind utility classes and shadcn variants for styling; define shared variants with `class-variance-authority`. Name files in `PascalCase.tsx` for components/screens, `kebab-case.ts` for helpers, and `useSomething.ts` for hooks or Zustand stores. Run Prettier (integrated via editor or `npx prettier . --write`) and ESLint before committing.

## Testing Guidelines
Vitest + Testing Library power the suite (`src/screens/HomeScreen.spec.tsx` is the reference). Mirror the `*.spec.tsx` naming and place tests beside the feature or in a sibling `__tests__` folder. Leverage `data-test-id` attributes, which are globally configured in `src/setupTests.ts`. Write tests for new screens, store mutations, and complex UI states; aim for meaningful assertions rather than snapshot churn.

## Commit & Pull Request Guidelines
Commits follow a Conventional Commit style (`feat:`, `feat(tests):`, etc.). Use an imperative summary (~50 chars), add context in the body, and group unrelated changes into separate commits. PRs should include: concise description of the change, testing notes (`npm run test`, `npm run lint`), linked issues or task IDs, and screenshots/GIFs for UI tweaks. Keep PRs small enough for a <15 minute review and ensure CI (lint + tests) is green before requesting review.

## Git Usage Policy
Write operations through Git (commit, amend, push, rebase, tag, etc.) are forbidden in this environment; treat the repository as read-only. You may inspect history via commands like `git log`, `git show`, or `git diff` to inform your work, but persist changes only through approved channels (e.g., patches or external tooling) rather than Git state.
