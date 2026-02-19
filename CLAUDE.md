# Settera

A settings UI framework. Declare a schema, provide values, and render a full settings page.

## Packages

```
packages/schema   — Types, validation, and traversal for setting schemas (pure TS, no React)
packages/react    — Unified Settera component, store, and hooks (depends on schema)
packages/ui       — Prebuilt UI components (depends on react + schema)
packages/test-app — Vite dev app for manual testing
```

Dependency graph: `schema → react → ui`

## Commands

```sh
pnpm install              # Install all dependencies
pnpm build                # Build all packages (turbo, respects dependency order)
pnpm test                 # Run all tests
pnpm test:watch           # Run tests in watch mode
pnpm dev                  # Start test-app dev server
pnpm lint                 # ESLint
pnpm typecheck            # TypeScript type checking

# Per-package
pnpm --filter @settera/schema test
pnpm --filter @settera/react test
pnpm --filter @settera/ui test
pnpm --filter @settera/react build
```

## Build Before Test

`@settera/ui` tests import from `@settera/react` which resolves to `dist/` (built output). After changing react or schema source, rebuild before running UI tests:

```sh
pnpm --filter @settera/react build   # Required before UI tests
pnpm --filter @settera/schema build  # Required before react/UI tests
```

## Architecture

### Schema (`@settera/schema`)
- **Types**: `SettingDefinition` is a discriminated union on `type` — text, number, boolean, select, multiselect, date, compound, repeatable, action, custom.
- **Validation**: `validateSchema()` returns an array of errors. Called at provider mount (console warning, not thrown).
- **Traversal**: `flattenSettings()` walks pages/sections/subsections into a flat list. `getSettingByKey()` does O(n) lookup. `buildSettingIndex()` builds an O(1) Map used by the react layer.

### React (`@settera/react`)
- **Unified component** (`Settera`): Provides both schema context and values context. Holds the `SetteraValuesStore` which manages values, save tracking, errors, confirm dialogs, and action loading.
- **Store pipeline**: `store.setValue(key, value)` runs the full pipeline — disabled/readonly guards, sync validation, confirm interception, then `onChange`. Direct store calls and hook calls go through the same path.
- **Save flow**: `onChange(key, value)` is instant-apply. If it returns a Promise, state tracks `idle → saving → saved → idle` (2s auto-reset). Race-safe via generation counter per key.
- **Validation**: Sync validation runs in `store.setValue` on every change (`validateSettingValue`). Async validators (`onValidate`) run via `store.validate` on blur.
- **Navigation** (`SetteraNavigation`): Headless provider that manages `activePage` state and exposes `pages` from schema. `useSetteraNavigation()` returns `{ activePage, setActivePage, pages }`. The UI layer's `SetteraNavigationProvider` composes on top, adding search, expanded groups, and highlight.
- **Callback signatures**: All callbacks use single-function form — `onChange(key, value)`, `onAction(key, payload?)`, `onValidate(key, value)`. No Record-based dispatch.
- **Visibility**: `evaluateVisibility()` resolves `visibleWhen` conditions against current values. Conditions in an array are AND'd. Shared `useVisibility` hook used by setting, action, and section hooks.

### UI (`@settera/ui`)
- All components use **inline styles** exclusively — no CSS files or modules.
- Hover/focus states use React state (`onMouseEnter`/`onMouseLeave`, `onFocus`/`onBlur`) with inline styles.
- Uses Radix UI primitives for select, switch, checkbox, and dialog.

## Testing Conventions

- **Framework**: Vitest with `globals: true`. Schema tests use `node` environment; react/UI tests use `jsdom`.
- **Timers**: Use `act(() => element.click())` instead of `userEvent.click()` when combining with `vi.useFakeTimers()`.
- **Import paths**: React package tests import source directly. UI tests import from `@settera/react` package (built dist).
- Tests live in `src/__tests__/` within each package.

## Style Guide

- TypeScript strict mode
- ESM throughout (`"type": "module"`)
- Dual CJS/ESM output via tsup
- React 18+ (peer dep allows 18 or 19)
