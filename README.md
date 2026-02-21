# Settera

Settings don't sell software—and nobody wants to work on them. They are seldom reconsidered, rarely refactored and grow until they are unmanageable. Yet, the quality of software can often be determined by the settings that govern it.

Settera solves both those problems.

Settera is a schema-driven settings framework. Define your settings in a schema, and it renders a complete settings UI—keyboard navigation, search, form validation and conditional visibility. It makes it fast for teams to ship settings updates, while providing consistency for users.

Stop spending cycles on settings infrastructure and focus on your core product.

## Quick Start

```tsx
import { Settera } from "@settera/react";
import { SetteraLayout } from "@settera/ui";

function AppSettings() {
  const [values, setValues] = useState(initialValues);

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

## Schema

Settings are defined as a JSON/TypeScript schema. The schema drives the entire UI — sidebar navigation, sections, controls, validation, and conditional visibility.

### Schema Structure

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

### Setting Types

| Type | Description | Apply behavior |
| --- | --- | --- |
| [`boolean`](#boolean) | Toggle switch | Instant |
| [`text`](#text) | Single-line or multi-line text input | On blur / Enter |
| [`number`](#number) | Numeric input with optional min/max/step | On blur / Enter |
| [`select`](#select) | Single-choice dropdown | Instant |
| [`multiselect`](#multiselect) | Multi-choice selection | Instant |
| [`date`](#date) | Date picker (native `<input type="date">`) | On blur |
| [`compound`](#compound) | Multi-field group (`inline`, `modal`, or `page`) | Field-dependent |
| [`repeatable`](#repeatable) | Add/remove list of text or compound items | Field-dependent |
| [`action`](#action) | Button that triggers a callback, modal, or page action | On click / submit |
| [`custom`](#custom) | Developer-provided renderer | Developer-defined |

### Common Properties

Every setting type supports these properties:

```typescript
{
  key: string;           // Globally unique identifier (e.g. "general.autoSave")
  title: string;         // Display label
  description?: string;  // Shown below the title
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

Action settings do not store a value in settings state. Each action has an `actionType` that determines its behavior:

- `"callback"` — executes the handler immediately on click
- `"modal"` — opens a draft form dialog; handler receives submitted values as payload
- `"page"` — navigates to a full-page form; handler receives submitted values as payload

**Callback action:**

```typescript
{
  key: "actions.clearCache",
  title: "Clear Cache",
  description: "Remove cached data to free up space.",
  type: "action",
  buttonLabel: "Clear Cache",
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

**Page action** (full-page form with Cancel/Submit):

```typescript
{
  key: "actions.importData",
  title: "Import Data",
  description: "Full-page form for importing data from an external source.",
  type: "action",
  buttonLabel: "Import Data",
  actionType: "page",
  page: {
    title: "Import Data",
    description: "Configure the import source and options.",
    submitLabel: "Start Import",
    cancelLabel: "Cancel",
    fields: [
      {
        key: "source",
        title: "Source",
        type: "select",
        options: [
          { value: "csv", label: "CSV File" },
          { value: "json", label: "JSON File" },
        ],
        default: "csv",
      },
      {
        key: "overwrite",
        title: "Overwrite existing data",
        type: "boolean",
        default: false,
      },
    ],
  },
}
```

Page actions can also use a `renderer` string instead of `fields` to delegate to a custom component registered via `customActionPages` on `SetteraLayout`.

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

**Multi-button actions** — render multiple buttons in a single settings row using the `actions` array instead of `buttonLabel`/`actionType`. Each item has its own `key`, `buttonLabel`, `actionType`, and optional `modal`/`page` config:

```typescript
{
  key: "actions.account",
  title: "Your Account",
  description: "Log in or create a new account.",
  type: "action",
  actions: [
    {
      key: "actions.account.login",
      buttonLabel: "Log in",
      actionType: "modal",
      modal: {
        title: "Log in to your account",
        submitLabel: "Log in",
        fields: [
          { key: "email", title: "Email", type: "text", inputType: "email" },
          { key: "password", title: "Password", type: "text", inputType: "password" },
        ],
      },
    },
    {
      key: "actions.account.signup",
      buttonLabel: "Sign up",
      actionType: "callback",
    },
  ],
}
```

Multi-button actions are wrapped in a standard settings row (showing title and description), unlike single-button actions which render as a standalone button. Each item's `key` must be globally unique and is used as the `key` argument in `onAction`. Items support `dangerous` and `disabled` independently.

Action handlers are provided via the `onAction` prop on `Settera`:

```tsx
<Settera
  schema={schema}
  values={values}
  onChange={handleChange}
  onAction={(key, payload) => {
    switch (key) {
      case "actions.export": {
        // For modal/page actions, payload contains submitted field values.
        // For callback actions, payload is undefined.
        const opts = (payload ?? {}) as { format?: string };
        return fetchUserData().then((data) =>
          downloadAs(data, opts.format ?? "json"),
        );
      }
      case "actions.account.login":
        return login(payload as { email: string; password: string });
      case "actions.account.signup":
        return startSignupFlow();
      case "actions.deleteAccount":
        return deleteAccount();
    }
  }}
>
  <SetteraLayout />
</Settera>
```

If the handler returns a Promise, the button automatically shows a loading state while it resolves. For modal actions, the dialog stays open while submit is in-flight and closes after completion. Multi-button items track loading state independently.

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

### Conditional Visibility

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

| Operator | Description | Example |
| --- | --- | --- |
| `equals` | Value equals the given value | `{ setting: "mode", equals: "advanced" }` |
| `notEquals` | Value does not equal the given value | `{ setting: "mode", notEquals: "basic" }` |
| `oneOf` | Value is one of the given values | `{ setting: "plan", oneOf: ["pro","ent"] }` |
| `greaterThan` | Numeric value is greater than | `{ setting: "count", greaterThan: 5 }` |
| `lessThan` | Numeric value is less than | `{ setting: "count", lessThan: 100 }` |
| `contains` | Array value contains the item (for multiselect) | `{ setting: "tags", contains: "vip" }` |
| `isEmpty` | Value is empty (`true`) or not empty (`false`) | `{ setting: "name", isEmpty: false }` |

**AND conditions** — pass an array. All must be true:

```typescript
visibleWhen: [
  { setting: "mode", equals: "advanced" },
  { setting: "count", greaterThan: 0 },
];
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

## Features

- **Schema-driven rendering** — sidebar, page layout, sections, and controls are all generated from a single schema definition
- **Keyboard navigation** — Tab flows through settings, F6 cycles sidebar/content, Ctrl+Arrow jumps sections, / or Cmd+K opens search
- **Client-side search** — filters sidebar and content by matching setting titles, descriptions, section titles, and page titles
- **Conditional visibility** — show or hide settings, sections, or subsections based on other values
- **Validation** — schema-level validators (required, min/max, pattern, etc.) plus async callback validators for custom logic
- **Confirmation dialogs** — any setting can require confirmation before applying, with optional text confirmation for dangerous actions
- **Responsive layout** — desktop sidebar + content; below 768px switches to full-screen drill-down with back buttons (breakpoint is configurable)
- **Collapsible sections** — sections support `collapsible` and `defaultCollapsed` to reduce visual clutter
- **Deep-linking** — query params for page + setting with copy-link affordance
- **Custom registries** — `customSettings` and `customPages` on `SetteraLayout` for app-specific extensions

## React API

### Settera Component

The main provider component. Wraps your settings UI and manages all state.

```tsx
<Settera
  schema={schema}
  values={values}
  onChange={(key, value) => { /* save */ }}
  onAction={(key, payload?) => { /* handle action */ }}
  onValidate={(key, value) => { /* async validation */ }}
  validationMode="valid-only"
>
  {children}
</Settera>
```

| Prop | Type | Description |
| --- | --- | --- |
| `schema` | `SetteraSchema` | The settings schema |
| `values` | `Record<string, unknown>` | Current values (flat keys) |
| `onChange` | `(key: string, value: unknown) => void \| Promise<void>` | Called on every change. Return a Promise for async save tracking. |
| `onAction` | `(key: string, payload?: unknown) => void \| Promise<void>` | Handler for action-type settings. Return a Promise for loading state. |
| `onValidate` | `(key: string, value: unknown) => string \| null \| Promise<string \| null>` | Async validation callback, called on blur. Return an error string or null. |
| `validationMode` | `"valid-only" \| "eager-save"` | `"valid-only"` (default) blocks saves with sync errors. `"eager-save"` allows invalid values through. |

### Hooks

#### useSettera()

Access the full schema and raw values.

```typescript
const { schema, values, setValue } = useSettera();
```

| Return | Type | Description |
| --- | --- | --- |
| `schema` | `SetteraSchema` | The full schema object |
| `values` | `Record<string, unknown>` | Current values merged with defaults |
| `setValue` | `(key: string, value: unknown) => void` | Set a value (runs full pipeline) |

#### useSetteraSetting(key)

Read and write a single setting.

```typescript
const {
  value, setValue, error, isVisible,
  isReadonly, definition, saveStatus, validate,
} = useSetteraSetting("general.autoSave");
```

| Return | Type | Description |
| --- | --- | --- |
| `value` | `unknown` | Current value (falls back to schema default) |
| `setValue` | `(value: unknown) => void` | Set new value (validation, confirm, onChange) |
| `error` | `string \| null` | Current validation error |
| `isVisible` | `boolean` | Whether `visibleWhen` resolves to true |
| `isReadonly` | `boolean` | Whether the setting is readonly |
| `definition` | `ValueSetting` | The setting definition from the schema |
| `saveStatus` | `"idle" \| "saving" \| "saved" \| "error"` | Async save tracking state |
| `validate` | `(valueOverride?: unknown) => Promise<string \| null>` | Run sync + async validation (call on blur) |

#### useSetteraAction(key)

Access an action setting.

```typescript
const { definition, isVisible, onAction, isLoading, items } =
  useSetteraAction("actions.export");
```

| Return | Type | Description |
| --- | --- | --- |
| `definition` | `ActionSetting` | The action definition from the schema |
| `isVisible` | `boolean` | Whether `visibleWhen` resolves to true |
| `onAction` | `(payload?: unknown) => void` | Invoke the action (single-button form) |
| `isLoading` | `boolean` | True while an async handler is in-flight (single-button form) |
| `items` | `UseSetteraActionItemResult[]` | Per-item results for multi-button actions (empty array for single-button) |

Each item in `items` contains `{ item: ActionItem, onAction, isLoading }` with independent loading state.

#### useSetteraConfirm()

Render confirmation dialogs.

```typescript
const { pendingConfirm, resolveConfirm } = useSetteraConfirm();
```

| Return | Type | Description |
| --- | --- | --- |
| `pendingConfirm` | `PendingConfirm \| null` | The pending confirm dialog, or null |
| `resolveConfirm` | `(confirmed: boolean, text?: string) => void` | Confirm or cancel. Pass typed text when `requireText` is set. |

#### useSetteraSection(pageKey, sectionKey)

Check section visibility.

```typescript
const { isVisible, definition } =
  useSetteraSection("general", "behavior");
```

| Return | Type | Description |
| --- | --- | --- |
| `isVisible` | `boolean` | Whether the section is visible |
| `definition` | `SectionDefinition` | The section definition from the schema |

### Navigation

`SetteraNavigation` manages page state. Nest it inside `Settera`:

```tsx
<Settera schema={schema} values={values} onChange={handleChange}>
  <SetteraNavigation>
    <YourUI />
  </SetteraNavigation>
</Settera>
```

Access navigation state with `useSetteraNavigation()`:

```typescript
const {
  activePage, setActivePage, pages,
  subpage, openSubpage, closeSubpage,
} = useSetteraNavigation();
```

| Return | Type | Description |
| --- | --- | --- |
| `activePage` | `string` | Key of the active page |
| `setActivePage` | `(key: string) => void` | Navigate to a page (auto-closes subpages) |
| `pages` | `PageDefinition[]` | Pages array from the schema |
| `subpage` | `SubpageState \| null` | Active subpage, or null |
| `openSubpage` | `(settingKey: string) => void` | Open a subpage for a compound setting |
| `closeSubpage` | `() => void` | Close the active subpage |

## Architecture

Settera is split into three independent packages. Use only what you need.

| Package | Purpose | Dependencies |
| --- | --- | --- |
| `@settera/schema` | Pure TypeScript types and schema validation. No React. | None |
| `@settera/react` | Unified `Settera` component, store, and headless hooks. Handles validation, save tracking, confirm dialogs, and visibility. | `@settera/schema`, React |
| `@settera/ui` | Prebuilt UI components with inline styles and Radix primitives. Drop-in settings UI. | `@settera/react`, `@radix-ui/*` |

**Building with your own design system?** Use `@settera/schema` + `@settera/react` and write your own components.

**Want settings working in an afternoon?** Use `@settera/ui` which includes everything.

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
  schema/           @settera/schema          — Types, validation, traversal
  react/            @settera/react           — Headless hooks and primitives
  ui/               @settera/ui              — Prebuilt components (inline styles + Radix)
  shadcn-registry/  @settera/shadcn-registry — shadcn-style components (Tailwind + shadcn primitives)
  test-app/         Internal Vite app for development testing (ui)
  shadcn-test-app/  Internal Vite app for development testing (shadcn)
```

## License

MIT
