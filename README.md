# Settera

Settings don't sell software—and nobody wants to work on them. They are seldom reconsidered, rarely refactored and grow until they are unmanageable. Yet, the quality of software can often be determined by the settings that govern it.

Settera solves both those problems.

Settera is a schema-driven settings framework. Define your settings in a schema, and it renders a complete settings UI—keyboard navigation, search, form validation and conditional visibility. It makes it fast for teams to ship settings updates, while providing consistency for users.

Stop spending cycles on settings infrastructure and focus on your core product.

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
| `repeatable` | Add/remove/reorder list of items | On save |
| `action` | Button that triggers a callback or modal | On click |
| `custom` | Developer-provided renderer | Developer-defined |

### Common Properties

Every setting type supports these properties:

```typescript
{
  key: string;           // Globally unique identifier (e.g. "general.autoSave")
  title: string;         // Display label
  description?: string;  // Shown below the title
  helpText?: string;     // Expandable help block below the description
  dangerous?: boolean;   // Renders the title in a warning style
  visibleWhen?: VisibilityCondition | VisibilityCondition[];  // Conditional visibility
  confirm?: ConfirmConfig;  // Require confirmation before applying a change
}
```

### Boolean

A toggle switch. Changes apply instantly.

```typescript
{
  key: "general.autoSave",
  title: "Auto Save",
  description: "Automatically save changes when you leave a field.",
  helpText: "Changes are saved to local storage automatically.",
  type: "boolean",
  default: true,
}
```

Boolean settings do not support `validation`. Use `confirm` for dangerous toggles:

```typescript
{
  key: "advanced.experimental",
  title: "Enable Experimental Features",
  description: "Turn on features that are still in development.",
  type: "boolean",
  default: false,
  dangerous: true,
  confirm: {
    title: "Enable Experimental Features?",
    message: "Experimental features may cause instability. Proceed?",
  },
}
```

### Text

A single-line text input. Changes apply on blur or Enter.

```typescript
{
  key: "profile.displayName",
  title: "Display Name",
  description: "Your name as shown to other users.",
  type: "text",
  default: "",
  placeholder: "Enter your name",
  inputType: "text",  // "text" | "email" | "url" | "password"
  validation: {
    required: true,
    minLength: 2,
    maxLength: 50,
    pattern: "^[a-zA-Z ]+$",  // Regex string
    message: "Custom error message",  // Overrides all default error messages
  },
}
```

Use `inputType` to get browser-native behavior for email, URL, or password fields:

```typescript
{
  key: "profile.email",
  title: "Email Address",
  type: "text",
  inputType: "email",
  placeholder: "you@example.com",
  validation: {
    required: true,
    pattern: "^[^@]+@[^@]+\\.[^@]+$",
    message: "Please enter a valid email address",
  },
}
```

### Number

A numeric input. Changes apply on blur or Enter.

```typescript
{
  key: "appearance.fontSize",
  title: "Font Size",
  description: "Base font size in pixels.",
  type: "number",
  default: 14,
  placeholder: "14",
  validation: {
    required: true,
    min: 10,
    max: 24,
    message: "Font size must be between 10 and 24",
  },
}
```

### Select

A single-choice dropdown. Changes apply instantly.

```typescript
{
  key: "appearance.theme",
  title: "Theme",
  description: "Choose the visual theme for the application.",
  type: "select",
  options: [
    { value: "light", label: "Light" },
    { value: "dark", label: "Dark" },
    { value: "system", label: "System" },
  ],
  default: "system",
  validation: {
    required: true,
  },
}
```

`default` must be one of the option `value`s. Option values must be unique.

### Multiselect

A multi-choice selection. Changes apply instantly.

```typescript
{
  key: "general.channels",
  title: "Notification Channels",
  description: "Choose how you want to receive notifications.",
  type: "multiselect",
  options: [
    { value: "email", label: "Email" },
    { value: "sms", label: "SMS" },
    { value: "push", label: "Push Notifications" },
    { value: "in-app", label: "In-App" },
  ],
  default: ["email", "in-app"],
  validation: {
    required: true,
    minSelections: 1,
    maxSelections: 3,
  },
}
```

The value is a `string[]`. Each default value must be one of the option `value`s.

### Date

A date picker using native `<input type="date">`. Changes apply on blur.

```typescript
{
  key: "profile.birthday",
  title: "Birthday",
  description: "Your date of birth (used for age verification).",
  type: "date",
  default: "2000-01-15",  // ISO date string
  validation: {
    required: true,
    minDate: "1900-01-01",
    maxDate: "2010-01-01",
  },
}
```

All date values use ISO format (`YYYY-MM-DD`).

### Compound

A multi-field group with scoped Save/Cancel. Groups related fields into a single setting that stores an object value.

`displayStyle` controls how the editor appears:
- `"inline"` — fields render directly in the settings row
- `"modal"` — fields open in a dialog
- `"page"` — fields expand into a page-style panel

**Inline compound:**

```typescript
{
  key: "profile.preferences",
  title: "Profile Preferences",
  description: "Edit multiple profile fields together.",
  type: "compound",
  displayStyle: "inline",
  fields: [
    {
      key: "pronouns",
      title: "Pronouns",
      type: "text",
      default: "",
    },
    {
      key: "profileVisibility",
      title: "Public Profile",
      type: "boolean",
      default: false,
    },
    {
      key: "timezone",
      title: "Timezone",
      type: "select",
      options: [
        { value: "utc", label: "UTC" },
        { value: "pst", label: "Pacific" },
        { value: "est", label: "Eastern" },
      ],
      default: "utc",
    },
  ],
}
```

**Modal compound:**

```typescript
{
  key: "profile.contactCard",
  title: "Emergency Contact",
  description: "Opens a dialog to edit contact details.",
  type: "compound",
  displayStyle: "modal",
  fields: [
    {
      key: "name",
      title: "Contact Name",
      type: "text",
    },
    {
      key: "phone",
      title: "Phone Number",
      type: "text",
    },
    {
      key: "methods",
      title: "Preferred Contact Methods",
      type: "multiselect",
      options: [
        { value: "call", label: "Call" },
        { value: "sms", label: "SMS" },
        { value: "email", label: "Email" },
      ],
      default: ["call"],
    },
  ],
}
```

**Page compound:**

```typescript
{
  key: "profile.publicCard",
  title: "Public Card",
  description: "Expands into a page-style panel for editing.",
  type: "compound",
  displayStyle: "page",
  fields: [
    {
      key: "headline",
      title: "Headline",
      type: "text",
      default: "",
    },
    {
      key: "showLocation",
      title: "Show Location",
      type: "boolean",
      default: true,
    },
  ],
}
```

The stored value is a `Record<string, unknown>` keyed by field keys. Field keys must not contain dots. Fields support text, number, select, multiselect, date, and boolean types.

Compound settings support cross-field validation rules:

```typescript
{
  type: "compound",
  // ...fields
  validation: {
    rules: [
      {
        when: "phone",         // When this field has a value...
        require: "name",       // ...require this other field
        message: "Name is required when phone is provided",
      },
    ],
  },
}
```

### Repeatable

An add/remove/reorder list. Changes apply on save.

**Text list** — each item is a string:

```typescript
{
  key: "profile.aliases",
  title: "Aliases",
  description: "Alternative names for your account.",
  type: "repeatable",
  itemType: "text",
  default: ["Sam"],
  validation: {
    minItems: 1,
    maxItems: 4,
  },
}
```

**Compound list** — each item is a multi-field object:

```typescript
{
  key: "profile.socialLinks",
  title: "Social Links",
  description: "Links to your social profiles.",
  type: "repeatable",
  itemType: "compound",
  itemFields: [
    {
      key: "label",
      title: "Label",
      type: "text",
      default: "",
    },
    {
      key: "url",
      title: "URL",
      type: "text",
      inputType: "url",
      default: "",
    },
    {
      key: "visibility",
      title: "Visibility",
      type: "select",
      options: [
        { value: "public", label: "Public" },
        { value: "private", label: "Private" },
      ],
      default: "public",
    },
    {
      key: "featured",
      title: "Featured",
      type: "boolean",
      default: false,
    },
  ],
  default: [],
  validation: {
    maxItems: 5,
  },
}
```

When `itemType` is `"text"`, the value is `string[]`. When `itemType` is `"compound"`, the value is `Array<Record<string, unknown>>` and `itemFields` is required. Item fields support text, number, select, and boolean types.

### Action

A button that triggers a callback. Does not store a value.

```typescript
{
  key: "actions.export",
  title: "Export Data",
  description: "Download all your data as a JSON file.",
  type: "action",
  buttonLabel: "Export",
  actionType: "callback",
}
```

Mark destructive actions with `dangerous`:

```typescript
{
  key: "actions.deleteAccount",
  title: "Delete Account",
  description: "Permanently delete your account. This cannot be undone.",
  type: "action",
  buttonLabel: "Delete Account",
  actionType: "callback",
  dangerous: true,
}
```

Action handlers are provided via the `onAction` prop on `SetteraRenderer`:

```tsx
<SetteraRenderer
  values={values}
  onChange={handleChange}
  onAction={{
    "actions.export": async () => {
      const data = await fetchUserData();
      downloadAsJson(data);
    },
    "actions.deleteAccount": async () => {
      await deleteAccount();
    },
  }}
/>
```

If the handler returns a Promise, the button automatically shows a loading state while it resolves.

### Custom

A developer-provided renderer for setting types not covered by the built-ins.

**Schema definition:**

```typescript
{
  key: "profile.signatureCard",
  title: "Signature Card",
  description: "Custom-rendered setting surface for app-specific UI.",
  type: "custom",
  renderer: "signatureCard",     // Must match a key in the customSettings registry
  config: {                       // Arbitrary config passed to your component
    label: "Public signature",
  },
  default: null,
  validation: {
    required: true,
  },
}
```

**Register the custom component:**

```tsx
import { SetteraLayout } from "@settera/ui";
import { useSetteraSetting } from "@settera/react";

function SignatureCard({ settingKey, definition }) {
  const { value, setValue } = useSetteraSetting(settingKey);

  return (
    <div>
      <label>{definition.config?.label}</label>
      <canvas /* your custom UI */ />
    </div>
  );
}

<SetteraLayout
  customSettings={{
    signatureCard: SignatureCard,
  }}
/>
```

The component receives `{ settingKey: string; definition: CustomSetting }` and uses hooks like `useSetteraSetting` to read/write the value.

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
