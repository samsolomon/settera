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

| Package           | Purpose                                                                                                             | Dependencies                    |
| ----------------- | ------------------------------------------------------------------------------------------------------------------- | ------------------------------- |
| `@settera/schema` | Pure TypeScript types and schema validation. No React.                                                              | None                            |
| `@settera/react`  | Headless hooks and unstyled primitives. Handles navigation, search, keyboard nav, validation, and focus management. | `@settera/schema`, React        |
| `@settera/ui`     | Prebuilt UI components with inline styles and Radix primitives. Drop-in settings UI.                                | `@settera/react`, `@radix-ui/*` |

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

| Type          | Description                                               | Apply behavior                                              |
| ------------- | --------------------------------------------------------- | ----------------------------------------------------------- |
| `boolean`     | Toggle switch                                             | Instant                                                     |
| `text`        | Single-line or multi-line text input                      | On blur / Enter                                             |
| `number`      | Numeric input with optional min/max/step                  | On blur / Enter                                             |
| `select`      | Single-choice dropdown                                    | Instant                                                     |
| `multiselect` | Multi-choice selection                                    | Instant                                                     |
| `date`        | Date picker (native `<input type="date">`)                | On blur                                                     |
| `color`       | Color picker (native `<input type="color">`)              | Instant                                                     |
| `compound`    | Multi-field group (`inline`, `modal`, or `page`)          | Field-dependent (text/number on blur/Enter; others instant) |
| `repeatable`  | Add/remove list of text or compound items                 | Field-dependent (text/number on blur/Enter; others instant) |
| `action`      | Button that triggers callback or submit-only modal action | Callback: on click; Modal: on submit                        |
| `custom`      | Developer-provided renderer                               | Developer-defined                                           |

### Common Properties

Every setting type supports these properties:

```typescript
{
  key: string;           // Globally unique identifier (e.g. "general.autoSave")
  title: string;         // Display label
  description?: string;  // Shown below the title
  helpText?: string;     // Expandable help block below the description
  dangerous?: boolean;   // Renders the title in a warning style
  disabled?: boolean;    // Prevents interaction, grays out the control
  badge?: string;        // Short label displayed next to the setting title
  deprecated?: string | boolean;  // Marks the setting as deprecated (string provides a message)
  visibleWhen?: VisibilityRule | VisibilityRule[];  // Conditional visibility
  confirm?: ConfirmConfig;  // Require confirmation before applying a change
}
```

Text, number, and date settings also support `readonly?: boolean`, which shows the value but prevents editing (the user can still select and copy text).

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

A text input. Changes apply on blur or Enter.

```typescript
{
  key: "profile.displayName",
  title: "Display Name",
  description: "Your name as shown to other users.",
  type: "text",
  default: "",
  placeholder: "Enter your name",
  inputType: "text",  // "text" | "email" | "url" | "password" | "textarea"
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

Use `inputType: "textarea"` with `rows` for multi-line text:

```typescript
{
  key: "profile.bio",
  title: "Bio",
  type: "text",
  inputType: "textarea",
  rows: 4,
  placeholder: "Tell us about yourself...",
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
  displayHint: "input",  // "input" (default) or "slider"
  validation: {
    required: true,
    min: 10,
    max: 24,
    step: 1,  // Step increment; use 1 to enforce integers
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
  placeholder: "Choose a theme",
  options: [
    { value: "light", label: "Light" },
    { value: "dark", label: "Dark", description: "Reduces eye strain in low-light environments" },
    { value: "system", label: "System", group: "Automatic" },
  ],
  default: "system",
  validation: {
    required: true,
  },
}
```

`default` must be one of the option `value`s. Option values must be unique.

Options support optional `description` (shown below the label) and `group` (for grouped option lists).

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

### Color

A native color picker. Changes apply instantly.

```typescript
{
  key: "appearance.accentColor",
  title: "Accent Color",
  description: "Primary accent color for the UI.",
  type: "color",
  default: "#3b82f6",
  format: "hex",  // "hex" | "rgb" | "hsl" (hint for expected format)
  validation: {
    required: true,
  },
}
```

The value is a string. `format` is an optional hint indicating the expected color format.

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

When `itemType` is `"text"`, the value is `string[]`. When `itemType` is `"compound"`, the value is `Array<Record<string, unknown>>` and `itemFields` is required. Item fields support text, number, select, multiselect, date, and boolean types.

### Action

Action settings do not store a value in settings state. They either execute a callback immediately or open a submit-only modal draft form.

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

**Modal action** (draft values are local until Submit):

```typescript
{
  key: "actions.export",
  title: "Export Data",
  description: "Choose export options before starting.",
  type: "action",
  buttonLabel: "Export",
  actionType: "modal",
  modal: {
    title: "Export data",
    description: "Configure the export payload.",
    submitLabel: "Start export",
    cancelLabel: "Cancel",
    fields: [
      {
        key: "format",
        title: "Format",
        type: "select",
        options: [
          { value: "json", label: "JSON" },
          { value: "csv", label: "CSV" },
        ],
        default: "json",
      },
      {
        key: "includePrivate",
        title: "Include private notes",
        type: "boolean",
        default: false,
      },
    ],
  },
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
    "actions.export": async (payload) => {
      // For callback actions, payload is undefined.
      // For modal actions, payload contains submitted modal field values.
      const opts = (payload ?? {}) as { format?: string };
      const data = await fetchUserData();
      downloadAs(data, opts.format ?? "json");
    },
    "actions.deleteAccount": async () => {
      await deleteAccount();
    },
  }}
/>
```

If the handler returns a Promise, the button automatically shows a loading state while it resolves.
For modal actions, the dialog stays open while submit is in-flight and closes after completion.

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
/>;
```

The component receives `{ settingKey: string; definition: CustomSetting }` and uses hooks like `useSetteraSetting` to read/write the value.

### Custom Pages

Use custom pages for app-specific screens (for example Users, Billing, Audit Logs) while keeping Settera navigation/layout.

**Schema page definition:**

```typescript
{
  key: "users",
  title: "Users",
  mode: "custom",
  renderer: "usersPage",
}
```

**Register custom page component:**

```tsx
<SetteraLayout
  customPages={{
    usersPage: ({ page }) => <UsersTable title={page.title} />,
  }}
/>
```

## Features

### Schema-driven rendering

Define settings once in a schema. The sidebar, page layout, sections, and controls are all generated automatically.

### Collapsible sections

Sections can be collapsed to reduce visual clutter:

```typescript
{
  key: "advanced",
  title: "Advanced Options",
  collapsible: true,
  defaultCollapsed: true,  // Starts collapsed
  settings: [/* ... */],
}
```

Set `collapsible: true` to allow the user to toggle the section. When `defaultCollapsed` is also `true`, the section renders collapsed on first load.

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

Show or hide settings, sections, or subsections based on other settings' values:

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

**Condition operators:**

| Operator      | Description                                        | Example                                    |
| ------------- | -------------------------------------------------- | ------------------------------------------ |
| `equals`      | Value equals the given value                       | `{ setting: "mode", equals: "advanced" }`  |
| `notEquals`   | Value does not equal the given value               | `{ setting: "mode", notEquals: "basic" }`  |
| `oneOf`       | Value is one of the given values                   | `{ setting: "plan", oneOf: ["pro","ent"] }`|
| `greaterThan` | Numeric value is greater than                      | `{ setting: "count", greaterThan: 5 }`     |
| `lessThan`    | Numeric value is less than                         | `{ setting: "count", lessThan: 100 }`      |
| `contains`    | Array value contains the item (for multiselect)    | `{ setting: "tags", contains: "vip" }`     |
| `isEmpty`     | Value is empty (`true`) or not empty (`false`)     | `{ setting: "name", isEmpty: false }`      |

**AND conditions** — pass an array. All must be true:

```typescript
visibleWhen: [
  { setting: "mode", equals: "advanced" },
  { setting: "count", greaterThan: 0 },
]
```

**OR conditions** — use a `{ or: [...] }` group. At least one must be true:

```typescript
visibleWhen: {
  or: [
    { setting: "plan", equals: "pro" },
    { setting: "plan", equals: "enterprise" },
  ],
}
```

Sections and subsections also support `visibleWhen` to conditionally show or hide entire groups of settings.

### Validation

Schema-level validators (required, min/max, pattern, minLength/maxLength, etc.) plus async callback validators for custom logic like API key verification.

### Confirmation dialogs

Any setting can require confirmation before applying, with optional text confirmation for dangerous actions.

### Responsive layout

Desktop shows a sidebar + content layout. Below 768px, it switches to full-screen drill-down navigation with back buttons. The breakpoint is configurable.

### Custom registries

`@settera/ui` supports two extension registries:

- `customSettings` on `SetteraLayout` for `type: "custom"` settings
- `customPages` on `SetteraLayout` for pages with `mode: "custom"`

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
const { value, setValue, error, isVisible } =
  useSetteraSetting("general.autoSave");
const { activePage, setActivePage } = useSetteraNavigation();
const { query, setQuery, filteredPages } = useSetteraSearch();
```

## Current Status

Settera is in active development. Here's what's been built and what's planned.

### Implemented

- Core setting types: boolean, text, number, select, multiselect, date, color, compound, repeatable, action, custom
- Compound `displayStyle` modes: `inline`, `modal`, `page`
- Repeatable item types: `text`, `compound`
- Action modes: `callback` and submit-only `modal`
- Custom extension points: `customSettings` and `customPages`
- Deep-linking to page + setting query params and copy-link affordance
- `disabled` and `readonly` setting states
- Collapsible sections with `collapsible` / `defaultCollapsed`
- `badge` and `deprecated` setting metadata
- Extended visibility operators: `notEquals`, `oneOf`, `greaterThan`, `lessThan`, `contains`, `isEmpty`, OR groups

### In progress / next

- Additional repeatable UX polish (for example reorder controls)
- Accessibility and keyboard polish passes for complex nested modal content
- Documentation site/API reference

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
  ui/         @settera/ui     — Prebuilt components (inline styles + Radix)
  test-app/   Internal Vite app for development testing
```

## License

MIT
