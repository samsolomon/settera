# Settera

A schema-driven settings framework for React.

<!-- TODO: Add screenshot or GIF of the settings UI here -->

Settings don't sell software and nobody wants to work on settings. Settera solves both those problems.

Define your settings in a schema, and Settera renders a complete settings UI—keyboard navigation, search, form validation, and conditional visibility included. Choose how to integrate: drop in the prebuilt UI (@settera/ui), plug into your existing shadcn/Tailwind stack (@settera/shadcn-registry), or go headless with just hooks and types (@settera/react).

Stop spending cycles on settings infrastructure and focus on your core product.

> **Note:** Settera packages are not yet published to npm.

## Core Concepts

### Schema-driven

One schema defines everything — pages, sections, settings, controls, validation rules, and visibility conditions. The schema is plain data (JSON-serializable), so it can come from a config file, a database, or an API.

### Consistent saving

Settera picks the right save behavior for each setting type. Toggles and selects apply instantly. Text and number inputs apply on blur or Enter. For settings that need grouped submission — like an address or a list of items — compound and repeatable types provide scoped Save/Cancel controls.

Your `onChange(key, value)` callback handles every save. Return a Promise and Settera tracks the lifecycle per setting automatically (`saving → saved → idle`), with built-in race condition safety.

### Flat values

Values are a flat `Record<string, unknown>` keyed by the setting's `key`. No nesting, no path resolution — just a key-value map.

```typescript
{
  "general.theme": "dark",
  "general.autoSave": true,
  "profile.displayName": "Sam"
}
```

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
| [`boolean`](docs/schema.md#boolean) | Toggle switch | Instant |
| [`text`](docs/schema.md#text) | Single-line or multi-line text input | On blur / Enter |
| [`number`](docs/schema.md#number) | Numeric input with optional min/max/step | On blur / Enter |
| [`select`](docs/schema.md#select) | Single-choice dropdown | Instant |
| [`multiselect`](docs/schema.md#multiselect) | Multi-choice selection | Instant |
| [`date`](docs/schema.md#date) | Date picker | On blur |
| [`compound`](docs/schema.md#compound) | Multi-field group (inline, modal, or page) | Field-dependent |
| [`repeatable`](docs/schema.md#repeatable) | Add/remove list of text or compound items | Field-dependent |
| [`action`](docs/schema.md#action) | Button that triggers a callback, modal, or page | On click / submit |
| [`custom`](docs/schema.md#custom) | Developer-provided renderer | Developer-defined |

See the full schema reference in [docs/schema.md](docs/schema.md).

Also included: [conditional visibility](docs/schema.md#conditional-visibility), [confirmation dialogs](docs/schema.md#confirmconfig), [deep-linking](docs/api.md), responsive layout, and [custom setting/page extensions](docs/schema.md#custom).

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

## License

MIT
