# Settera

Settings don't sell software. They're seldom refactored, rarely considered, and perpetually growing until they become unmanageable. Designers, engineers, PMs—nobody wants to work on settings. Yet, the quality of software can often be determined by the settings that govern it.

Settera is a schema-driven settings framework. Define your settings in a schema, and Settera renders a complete settings UI—keyboard navigation, search, validation, conditional visibility, and responsive layout. Stop spending cycles planning and building settings infrastructure, and focus on your core product.

## Why Settera?

Building a settings page seems simple until you need keyboard navigation, search filtering, conditional visibility, compound settings with scoped editing, validation, and responsive layouts. Settera handles all of this from a single schema definition.

```tsx
import { SetteraProvider, SetteraRenderer } from "@settera/react";

function AppSettings() {
  const [values, setValues] = useState(initialValues);

  return (
    <SetteraProvider schema={schema}>
      <SetteraRenderer
        values={values}
        onChange={(key, value) => {
          setValues((prev) => ({ ...prev, [key]: value }));
        }}
      />
    </SetteraProvider>
  );
}
```

## Architecture

Settera is split into three independent packages. Use only what you need.

| Package | Purpose | Dependencies |
|---------|---------|-------------|
| `@settera/schema` | Pure TypeScript types and schema validation. No React. | None |
| `@settera/react` | Headless hooks and unstyled primitives. Handles navigation, search, keyboard nav, validation, and focus management. | `@settera/schema`, React |
| `@settera/ui` | Styled components using Tailwind CSS and shadcn/ui patterns. Drop-in settings UI. | `@settera/react`, Tailwind |

**Building with your own design system?** Use `@settera/schema` + `@settera/react` and write your own components.

**Want settings working in an afternoon?** Use `@settera/ui` which includes everything.

## Schema Example

Settings are defined as a JSON/TypeScript schema. The schema drives the entire UI — sidebar navigation, sections, controls, validation, and conditional visibility.

```typescript
const schema: SetteraSchema = {
  version: "1.0",
  meta: { title: "Settings" },
  pages: [
    {
      key: "general",
      title: "General",
      icon: "settings",
      sections: [
        {
          key: "behavior",
          title: "Behavior",
          settings: [
            {
              key: "general.autoSave",
              title: "Auto Save",
              description: "Automatically save changes.",
              type: "boolean",
              default: true,
            },
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
          ],
        },
      ],
    },
  ],
};
```

## Setting Types

| Type | Description | Apply behavior |
|------|-------------|---------------|
| `boolean` | Toggle switch | Instant |
| `text` | Single-line text input | On blur / Enter |
| `number` | Numeric input with optional min/max | On blur / Enter |
| `select` | Single-choice dropdown | Instant |
| `multiselect` | Multi-choice selection | Instant |
| `date` | Date picker (native `<input type="date">`) | On blur |
| `compound` | Multi-field group with scoped Save/Cancel | On save |
| `list` | Add/remove/reorder list of items | On save |
| `action` | Button that triggers a callback or modal | On click |
| `custom` | Developer-provided renderer | Developer-defined |

## Features

### Schema-driven rendering
Define settings once in a schema. The sidebar, page layout, sections, and controls are all generated automatically.

### Keyboard navigation
Three-tier keyboard model designed for casual users through power users:
- **Tab** flows linearly through settings
- **F6** cycles between sidebar and content
- **Ctrl+Arrow** jumps between section headings
- **/** or **Cmd+K** opens search
- Full roving tabindex in the sidebar (arrow keys, Home/End)

### Client-side search
Search filters the sidebar and content area by matching against setting titles, descriptions, section titles, and page titles. Substring match, case-insensitive.

### Conditional visibility
Show or hide settings based on other settings' values:

```typescript
{
  key: "sso.provider",
  title: "SSO Provider",
  type: "select",
  options: [
    { value: "okta", label: "Okta" },
    { value: "auth0", label: "Auth0" },
  ],
  visibleWhen: { setting: "sso.enabled", equals: true },
}
```

Supports `equals`, `notEquals`, `oneOf`, and AND conditions (array of conditions).

### Validation
Schema-level validators (required, min/max, pattern, minLength/maxLength, etc.) plus async callback validators for custom logic like API key verification.

### Confirmation dialogs
Any setting can require confirmation before applying, with optional text confirmation for dangerous actions.

### Responsive layout
Desktop shows a sidebar + content layout. Below 768px, it switches to full-screen drill-down navigation with back buttons. The breakpoint is configurable.

### Custom renderers
Register custom components for setting types not covered by the built-ins:

```tsx
<SetteraProvider
  schema={schema}
  renderers={{
    "color-picker": ({ value, onChange, config }) => (
      <MyColorPicker value={value} onChange={onChange} />
    ),
  }}
>
  <SetteraRenderer values={values} onChange={handleChange} />
</SetteraProvider>
```

## Headless Hooks

For developers building custom UIs, the React layer exposes composable hooks:

```tsx
import {
  useSettera,
  useSetteraSetting,
  useSetteraNavigation,
  useSetteraSearch,
} from "@settera/react";

const { schema, values, setValue } = useSettera();
const { value, setValue, error, isVisible } = useSetteraSetting("general.autoSave");
const { activePage, setActivePage } = useSetteraNavigation();
const { query, setQuery, filteredPages } = useSetteraSearch();
```

## Current Status

Settera is in active development. Here's what's been built and what's planned.

### Completed

- **Project scaffold** — pnpm monorepo with Turborepo, tsup builds, Vitest testing, ESLint + Prettier, CI pipeline
- **Schema package** — Full TypeScript types, schema validator, traversal utilities (flattenSettings, getSettingByKey, getPageByKey, resolveDependencies)
- **React headless layer** — SetteraProvider, SetteraRenderer, all core hooks (useSettera, useSetteraSetting, useSetteraAction, useSetteraNavigation, useSetteraSearch, useSetteraGlobalKeys, useSetteraConfirm), visibility engine, validation engine, roving tabindex
- **Styled components** — BooleanSwitch, TextInput, NumberInput, Select, MultiSelect, DateInput, ActionButton, ConfirmDialog, SettingRow
- **Layout** — SetteraLayout (sidebar + content), SetteraSidebar, SetteraPage, SetteraSection, SetteraSetting, SetteraSearch
- **Keyboard navigation** — Linear tab, F6 pane cycling, Ctrl+Arrow section jumping, roving tabindex in sidebar, global shortcuts (/, Cmd+K, Escape)
- **Search** — Client-side filtering across pages, sections, and settings
- **Confirm dialogs** — With optional text confirmation for dangerous actions
- **HelpText** — Expandable inline help blocks

### Planned

- **Compound settings** — Modal, subpage, and inline editing contexts with scoped Save/Cancel and batch onChange
- **List settings** — Add/remove/reorder for text and compound lists
- **Custom renderer registration** — Full integration of the custom setting type extension point
- **Mobile responsive layout** — Full-screen drill-down navigation for narrow viewports
- **Dangerous setting styling** — Warning colors and enhanced confirmation UX
- **Icon mapping** — Lucide icon integration for sidebar navigation
- **Accessibility audit** — Full ARIA structure review and screen reader testing
- **Playwright e2e tests** — Real browser testing for keyboard navigation
- **Examples** — Minimal, enterprise, and headless usage examples
- **Documentation site** — API reference and guides (post-stabilization)
- **shadcn-style CLI** — `npx settera add` for ejecting components (post-API stabilization)

## Development

```bash
# Install dependencies
pnpm install

# Run all tests
pnpm test

# Build all packages
pnpm build

# Start the test app
pnpm dev

# Lint
pnpm lint

# Format
pnpm format
```

## Project Structure

```
packages/
  schema/     @settera/schema — Types, validation, traversal
  react/      @settera/react  — Headless hooks and primitives
  ui/         @settera/ui     — Styled Tailwind components
  test-app/   Internal Vite app for development testing
```

## License

MIT
