# Settera

A settings UI framework. Declare a schema, provide values, and render a full settings page.

## Packages

```
packages/schema          — Types, validation, and traversal for setting schemas (pure TS, no React)
packages/react           — Unified Settera component, store, and hooks (depends on schema)
packages/ui              — Prebuilt UI components with inline styles (depends on react + schema)
packages/shadcn-registry — shadcn-style components distributed via registry (depends on react + schema)
packages/test-app        — Vite dev app for manual testing (ui package)
packages/shadcn-test-app — Vite dev app for manual testing (shadcn registry)
```

Dependency graph: `schema → react → ui / shadcn-registry`

## Commands

```sh
pnpm install              # Install all dependencies
pnpm build                # Build all packages (turbo, respects dependency order)
pnpm test                 # Run all tests
pnpm test:watch           # Run tests in watch mode
pnpm dev                  # Start test-app dev server (ui)
pnpm dev:shadcn           # Start shadcn-test-app dev server
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
- **Theming**: Components reference `--settera-*` CSS custom properties with light-mode fallback values (e.g. `color: "var(--settera-title-color, #111827)"`). Consumers set tokens on a parent element to theme — no dark mode built in, just token overrides. All color, spacing, and sizing values should use tokens; never hardcode colors without a `var()` wrapper.
- **Shared primitives**: `SetteraPrimitives.tsx` exports `PrimitiveInput`/`PrimitiveButton` (base slot components with token-aware styles). `SetteraFieldPrimitives.tsx` exports shared style objects (`cardShellStyle`, `sectionTitleStyle`, `descriptionTextStyle`, etc.).

### shadcn Registry (`@settera/shadcn-registry`)
- Distributed via shadcn registry, not npm — consumers install components into their own codebase.
- **Styling**: Use **Tailwind classes** for all layout, spacing, and standard styling. Prefer Tailwind utilities over inline styles.
- **Tokens**: Use `--settera-*` CSS custom properties (via inline `style`) only for values consumers are likely to customize (content max-width, page padding, heading font sizes, section spacing). Standard utility styling that doesn't need consumer override should use Tailwind classes directly.
- **Primitives**: Import Radix UI from the `radix-ui` monorepo package (not individual `@radix-ui/*` packages). Import shadcn components from `@/components/ui/` — these resolve to the consumer's own shadcn primitives (Button, Dialog, Input, etc.).
- **Icons**: Uses `lucide-react` by default (configurable via shadcn's `components.json` `iconLibrary` setting). Inside `icon-xs` buttons, always put `className="size-4"` on the icon component — the button variant defaults to `size-3` (12px) via a `:not([class*='size-'])` selector, so without an explicit class the icon will be too small.
- **Known tokens**: `--settera-success-color` (default `#16a34a`) for check/confirmation icons (save indicator, copy feedback, link copy). `--settera-control-width` (default `200px`) sets the desktop width of all input/select controls — applied via `w-full md:w-[var(--settera-control-width,200px)]`.
- **Navigation contexts**: `SetteraNavigationProvider` wraps two separate contexts — `SetteraNavigationContext` (activePage, subpage, expandedGroups, highlight, focus) and `SetteraSearchContext` (searchQuery, matchingSettingKeys, matchingPageKeys). Use `useSetteraNavigation()` for nav state, `useSetteraSearch()` for search state. Split to avoid re-rendering nav-only consumers on every search keystroke.
- **Shared utilities**: `settera-select-utils.ts` exports `EMPTY_OPTION_VALUE_BASE` and `useEmptyOptionValue()` — used by both `settera-select.tsx` and `settera-field-control.tsx` for select empty-option sentinel logic.
- **No own `node_modules`**: Registry source files live in the consumer's project. They rely on the consumer's dependencies for React, Radix, Tailwind, etc.
- **React 18 compat**: shadcn generates React 19-style components (no `forwardRef`). When the consumer uses React 18 and passes refs, wrap with `React.forwardRef` (see `dialog.tsx`, `button.tsx` in shadcn-test-app for examples).

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
- **Dev-only code**: Use `process.env.NODE_ENV !== "production"` directly — not `globalThis` indirection — so bundlers can tree-shake. Ambient types are declared in `packages/react/src/env.d.ts` and `packages/ui/src/env.d.ts`.
