# Settera

A schema-driven settings framework for React.

<!-- TODO: Add screenshot or GIF of the settings UI here -->

Settings don't sell software—and nobody wants to work on them. They are seldom reconsidered, rarely refactored and grow until they are unmanageable. Yet, the quality of software can often be determined by the settings that govern it.

Settera solves both those problems.

Settera is a schema-driven settings framework. Define your settings in a schema, and it renders a complete settings UI—keyboard navigation, search, form validation and conditional visibility. It makes it fast for teams to ship settings updates, while providing consistency for users.

Stop spending cycles on settings infrastructure and focus on your core product.

> **Note:** Settera packages are not yet published to npm.

## Quick Start

```tsx
import { useState } from "react";
import { Settera, type SetteraSchema } from "@settera/react";
import { SetteraLayout } from "@settera/ui";

const schema: SetteraSchema = {
  version: "1.0",
  pages: [
    {
      key: "general",
      title: "General",
      sections: [
        {
          key: "preferences",
          title: "Preferences",
          settings: [
            {
              key: "general.theme",
              title: "Theme",
              type: "select",
              options: [
                { value: "system", label: "System" },
                { value: "light", label: "Light" },
                { value: "dark", label: "Dark" },
              ],
              default: "system",
            },
            {
              key: "general.autoSave",
              title: "Auto Save",
              description: "Automatically save changes.",
              type: "boolean",
              default: true,
            },
          ],
        },
      ],
    },
  ],
};

function AppSettings() {
  const [values, setValues] = useState({});

  return (
    <Settera
      schema={schema}
      values={values}
      onChange={(key, value) => {
        setValues((prev) => ({ ...prev, [key]: value }));
      }}
    >
      <SetteraLayout />
    </Settera>
  );
}
```

## Core Concepts

### Instant-apply

There's no form submit. Each setting change fires `onChange(key, value)` immediately. Toggles and selects apply on click. Text and number inputs apply on blur or Enter.

### Flat values

Values are a flat `Record<string, unknown>` keyed by the setting's `key`. No nesting, no path resolution — just a key-value map.

```typescript
{
  "general.theme": "dark",
  "general.autoSave": true,
  "profile.displayName": "Sam"
}
```

### Async save tracking

Return a Promise from `onChange` and Settera tracks the save lifecycle automatically:

```
idle → saving → saved → idle
```

Each setting shows its own save indicator. Race conditions are handled — only the latest save per key affects UI state.

```tsx
<Settera
  schema={schema}
  values={values}
  onChange={async (key, value) => {
    setValues((prev) => ({ ...prev, [key]: value }));
    await api.saveSetting(key, value);
  }}
>
  <SetteraLayout />
</Settera>
```

### Schema-driven

One schema defines everything — pages, sections, settings, controls, validation rules, and visibility conditions. The schema is plain data (JSON-serializable), so it can come from a config file, a database, or an API.

## Choose Your UI

Settera offers two UI packages. Pick the one that fits your stack.

### `@settera/ui` — Drop-in components

Prebuilt components with inline styles. No CSS framework required. Themeable via `--settera-*` CSS custom properties.

```bash
pnpm add @settera/react @settera/ui
```

Best when you want a complete settings UI without existing design system constraints.

### `@settera/shadcn-registry` — shadcn components

Distributed via [shadcn registry](https://ui.shadcn.com/docs/registry), not npm. Components install into your codebase and use your existing shadcn primitives (Button, Dialog, Input, etc.) with Tailwind styling.

```bash
npx shadcn add <your-registry-url>/settera-layout.json
```

Best when you're already using shadcn/ui and Tailwind, and want settings that match your app's design system.

### Build your own

Use `@settera/schema` + `@settera/react` for types, validation, and headless hooks. Write your own components on top.

## Schema at a Glance

| Type | Description | Apply behavior |
| --- | --- | --- |
| `boolean` | Toggle switch | Instant |
| `text` | Single-line or multi-line text input | On blur / Enter |
| `number` | Numeric input with optional min/max/step | On blur / Enter |
| `select` | Single-choice dropdown | Instant |
| `multiselect` | Multi-choice selection | Instant |
| `date` | Date picker | On blur |
| `compound` | Multi-field group (inline, modal, or page) | Field-dependent |
| `repeatable` | Add/remove list of text or compound items | Field-dependent |
| `action` | Button that triggers a callback, modal, or page | On click / submit |
| `custom` | Developer-provided renderer | Developer-defined |

```typescript
// Example: a few setting types together
{
  key: "general.autoSave",
  title: "Auto Save",
  type: "boolean",
  default: true,
},
{
  key: "appearance.fontSize",
  title: "Font Size",
  type: "number",
  default: 14,
  validation: { min: 10, max: 24, step: 1 },
},
{
  key: "appearance.theme",
  title: "Theme",
  type: "select",
  options: [
    { value: "light", label: "Light" },
    { value: "dark", label: "Dark" },
    { value: "system", label: "System" },
  ],
  default: "system",
}
```

See the full schema reference in [docs/schema.md](docs/schema.md).

## Features

- **Schema-driven rendering** — sidebar, page layout, sections, and controls are all generated from a single schema definition
- **Keyboard navigation** — Tab flows through settings, F6 cycles sidebar/content, Ctrl+Arrow jumps sections, / or Cmd+K opens search
- **Client-side search** — filters sidebar and content by matching setting titles, descriptions, section titles, and page titles
- **Conditional visibility** — show or hide settings, sections, or subsections based on other values
- **Validation** — schema-level validators (required, min/max, pattern, etc.) plus async callback validators for custom logic
- **Confirmation dialogs** — any setting can require confirmation before applying, with optional text confirmation for dangerous actions
- **Responsive layout** — desktop sidebar + content; below 768px switches to full-screen drill-down (breakpoint is configurable)
- **Collapsible sections** — sections support `collapsible` and `defaultCollapsed` to reduce visual clutter
- **Deep-linking** — query params for page + setting with copy-link affordance
- **Custom registries** — `customSettings` and `customPages` for app-specific extensions

## Architecture

Settera is split into three layers. Use only what you need.

| Package | Purpose | Dependencies |
| --- | --- | --- |
| `@settera/schema` | Pure TypeScript types and schema validation. No React. | None |
| `@settera/react` | Unified `Settera` component, store, and headless hooks. Handles validation, save tracking, confirm dialogs, and visibility. | `@settera/schema`, React |
| `@settera/ui` | Prebuilt UI components with inline styles and Radix primitives. Drop-in settings UI. | `@settera/react`, `@radix-ui/*` |

The `@settera/shadcn-registry` package distributes components via shadcn's registry format, using your own shadcn primitives and Tailwind.

## Documentation

- [Schema Reference](docs/schema.md) — All setting types, common properties, conditional visibility, custom pages
- [React API Reference](docs/api.md) — `Settera` component, hooks, navigation
- [Theming & Customization](docs/theming.md) — CSS custom properties, dark mode, token reference

## Development

```bash
pnpm install       # Install all dependencies
pnpm build         # Build all packages
pnpm test          # Run all tests
pnpm dev           # Start test-app dev server (ui)
pnpm dev:shadcn    # Start shadcn-test-app dev server
pnpm lint          # ESLint
pnpm typecheck     # TypeScript type checking
```

## Project Structure

```
packages/
  schema/           @settera/schema          — Types, validation, traversal
  react/            @settera/react           — Headless hooks and primitives
  ui/               @settera/ui              — Prebuilt components (inline styles + Radix)
  shadcn-registry/  @settera/shadcn-registry — shadcn-style components (Tailwind + shadcn primitives)
  test-app/         Internal Vite app for development testing (ui)
  shadcn-test-app/  Internal Vite app for development testing (shadcn)
```

## License

MIT
