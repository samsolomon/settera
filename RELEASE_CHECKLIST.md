# Settera Release Checklist

## Target

- First public release: `0.1.0`

## Contract Decisions

- `@settera/ui` layout internals (`useSetteraLayout*`) are private and not exported.
- Navigation/search hooks are strict in non-production (throw without provider).
- Navigation/search hooks keep no-op fallback behavior in production.
- Tailwind/shadcn integration is optional; runtime styling is framework-agnostic.

## Pre-Release Gates

1. Test suite is green.
   - `pnpm vitest run packages/ui/src/__tests__`
2. Workspace build succeeds.
   - `pnpm build`
3. Workspace typecheck succeeds.
   - `pnpm typecheck`
4. Export surface is unchanged except intended additions/removals.
   - Verify `packages/ui/src/__tests__/index.test.ts` passes.
5. Docs reflect current contract.
   - `README.md` includes styling approach and optional Tailwind guidance.
6. Change summary is ready for release notes.
   - Include:
     - section/subsection `visibleWhen` enforcement,
     - section `collapsible` / `defaultCollapsed` behavior,
     - `SetteraLayout` internal refactor (no public API change),
     - provider hook strictness policy.

## Release Execution

1. Bump versions to `0.1.0` for publishable packages.
2. Build distributables.
3. Publish packages.
4. Tag release in git.

## Post-Release Validation

1. Install from published registry in a clean sample app.
2. Verify `@settera/react` + `@settera/ui` integration renders and deep-linking works.
3. Verify consumers not using Tailwind can still use defaults without breakage.
