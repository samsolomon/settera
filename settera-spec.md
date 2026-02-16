# Settera — Settings Framework Specification v0.1

## 1. Overview

Settera is an open-source, schema-driven settings framework for React applications. It provides a complete system for building settings UIs — from small startups to enterprise applications — with keyboard navigation, search, nested layouts, and responsive design built in.

### 1.1 Design Goals

- **Easy, quick, and predictable** for teams to create settings pages
- **Schema-driven**: developers define settings in JSON; the framework renders the UI
- **Keyboard-first**: every setting discoverable and operable via keyboard alone
- **No dirty state on the main settings page**: instant-apply by default, scoped editing for compound settings
- **Responsive**: works on desktop (with full keyboard support) and mobile (with drill-down navigation)

### 1.2 Three-Layer Architecture

Settera consists of three independent layers. Developers choose which layers they adopt.

| Layer        | Package           | Purpose                                                                                                                                                        | Dependencies               |
| ------------ | ----------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------- |
| **Schema**   | `@settera/schema` | Pure JSON/TypeScript spec for defining settings trees. Technology-agnostic. No React.                                                                          | None                       |
| **Headless** | `@settera/react`  | React hooks and unstyled primitives that consume a schema. Handles keyboard nav, focus management, search, apply/confirm logic.                                | `@settera/schema`, React   |
| **Styled**   | `@settera/ui`     | Default styled components using Tailwind CSS and shadcn/ui patterns. Ships as an npm package for v0.1; shadcn-style CLI (`npx settera add`) planned for v1.1+. | `@settera/react`, Tailwind |

A developer building with their own design system uses Schema + Headless. A startup wanting settings in an afternoon uses Schema + Styled (which includes Headless).

---

## 2. Schema Specification

The schema is a JSON document (or TypeScript object) that serves as the single source of truth for all settings. If a setting isn't in the schema, it doesn't exist in the UI.

### 2.1 Top-Level Structure

```typescript
interface SetteraSchema {
  /** Schema version for future compatibility */
  version: "1.0";

  /** Application-level metadata */
  meta?: {
    title?: string; // e.g., "Application Settings"
    description?: string;
  };

  /** Top-level navigation pages (appear in sidebar) */
  pages: PageDefinition[];
}
```

### 2.2 Pages (Navigation Hierarchy)

Pages define the sidebar navigation tree. Pages can nest arbitrarily deep.

```typescript
interface PageDefinition {
  /** Unique dot-notation key for this page. Developer-defined. */
  key: string; // e.g., "general", "network.proxy"

  /** Display title in the sidebar */
  title: string;

  /** Optional icon identifier (top-level pages only) */
  icon?: string; // e.g., "settings", "shield", "palette"

  /** Content sections displayed on this page */
  sections?: SectionDefinition[];

  /** Nested child pages (appear as sub-items in sidebar) */
  pages?: PageDefinition[];
}
```

**Key semantics:** Setting keys and page keys are **opaque identifiers**. Dot notation is a naming convention, not a structural requirement. The framework does not enforce any relationship between a key and its position in the page hierarchy. A setting keyed `editor.fontSize` can live on the `appearance` page. Moving a setting between pages does not require changing its key.

**Icon behavior:** The schema supports an optional icon string on navigation pages. The styled layer maps these to Lucide icons by default. The headless layer exposes the string so developers can map it to their own icon library. When using the React component library directly, developers can also pass icon components as props, overriding the schema string.

**Canonical icon names (styled layer ships mappings for these):** `settings`, `shield`, `palette`, `code`, `globe`, `bell`, `lock`, `user`, `monitor`, `terminal`, `git-branch`, `puzzle`, `wifi`, `keyboard`, `layers`, `database`, `mail`, `eye`, `folder`, `zap`

### 2.3 Sections (Content Structure Within a Page)

Sections organize settings within a page. They render as labeled groups with optional subsections.

```typescript
interface SectionDefinition {
  /** Unique key within the page */
  key: string; // e.g., "generalSettings", "security"

  /** Section heading displayed above the group */
  title: string;

  /** Optional section description */
  description?: string;

  /** Settings within this section */
  settings?: SettingDefinition[];

  /** Optional subsections (one level deep only) */
  subsections?: SubsectionDefinition[];
}

interface SubsectionDefinition {
  key: string;
  title: string;
  description?: string;
  settings: SettingDefinition[];
}
```

**Nesting constraints:**

- Navigation pages can nest arbitrarily deep (sidebar tree grows)
- Content sections within a page support exactly one level of subsections
- A page is always a full replacement of the content area
- A section is a scroll target within a page

### 2.4 Full Structural Example

```json
{
  "version": "1.0",
  "meta": { "title": "Settings" },
  "pages": [
    {
      "key": "general",
      "title": "General",
      "icon": "settings",
      "sections": [
        {
          "key": "behavior",
          "title": "General Settings",
          "settings": [
            {
              "key": "general.closingBehavior",
              "title": "When Closing With No Tabs",
              "description": "What to do when using the 'close active item' action with no tabs.",
              "type": "select",
              "options": [
                { "value": "platform_default", "label": "Platform Default" },
                { "value": "close_window", "label": "Close Window" },
                { "value": "keep_open", "label": "Keep Open" }
              ],
              "default": "platform_default"
            }
          ]
        },
        {
          "key": "security",
          "title": "Security",
          "settings": [
            {
              "key": "general.security.trustAllProjects",
              "title": "Trust All Projects By Default",
              "description": "Avoid Restricted Mode by auto-trusting all projects.",
              "type": "boolean",
              "default": false
            }
          ]
        }
      ],
      "pages": [
        {
          "key": "general.privacy",
          "title": "Privacy",
          "sections": [
            {
              "key": "dataCollection",
              "title": "Data Collection",
              "settings": []
            }
          ]
        }
      ]
    },
    {
      "key": "appearance",
      "title": "Appearance",
      "icon": "palette",
      "sections": [
        {
          "key": "editor",
          "title": "Editor",
          "settings": [
            {
              "key": "editor.fontSize",
              "title": "Font Size",
              "description": "Base font size in pixels.",
              "type": "number",
              "default": 14,
              "validation": { "min": 8, "max": 72 }
            },
            {
              "key": "editor.fontFamily",
              "title": "Font Family",
              "type": "select",
              "options": [
                { "value": "system", "label": "System Default" },
                { "value": "mono", "label": "Monospace" },
                { "value": "serif", "label": "Serif" }
              ],
              "default": "system"
            }
          ]
        }
      ]
    }
  ]
}
```

---

## 3. Setting Types

All setting types form a discriminated union:

```typescript
/** All setting types. Actions are separated from value-bearing settings. */
type SettingDefinition = ValueSetting | ActionSetting;

/** Settings that hold a value. */
type ValueSetting =
  | BooleanSetting
  | TextSetting
  | NumberSetting
  | SelectSetting
  | MultiSelectSetting
  | DateSetting
  | CompoundSetting
  | ListSetting
  | CustomSetting;
```

### 3.1 Boolean (Switch)

A toggle switch. Instant-apply by default.

```typescript
interface BooleanSetting {
  key: string;
  title: string;
  description?: string;
  helpText?: string; // Extended description, shown in expandable inline block
  type: "boolean";
  default?: boolean;
  confirm?: ConfirmConfig; // Optional confirmation before applying
  dangerous?: boolean; // Renders with warning styling
  visibleWhen?: VisibilityCondition | VisibilityCondition[]; // Conditional visibility
  validation?: never; // Booleans don't need validation
}
```

### 3.2 Text Input

A single-line text field. Instant-apply on blur or Enter.

```typescript
interface TextSetting {
  key: string;
  title: string;
  description?: string;
  helpText?: string;
  type: "text";
  default?: string;
  placeholder?: string;
  inputType?: "text" | "email" | "url" | "password"; // Maps to HTML input type
  confirm?: ConfirmConfig;
  dangerous?: boolean;
  visibleWhen?: VisibilityCondition | VisibilityCondition[];
  validation?: {
    required?: boolean;
    minLength?: number;
    maxLength?: number;
    pattern?: string; // Regex pattern
    message?: string; // Error message when validation fails
  };
}
```

### 3.3 Number Input

```typescript
interface NumberSetting {
  key: string;
  title: string;
  description?: string;
  helpText?: string;
  type: "number";
  default?: number;
  placeholder?: string;
  confirm?: ConfirmConfig;
  dangerous?: boolean;
  visibleWhen?: VisibilityCondition | VisibilityCondition[];
  validation?: {
    required?: boolean;
    min?: number;
    max?: number;
    message?: string;
  };
}
```

### 3.4 Select (Single Choice)

A dropdown select. Instant-apply on selection.

```typescript
interface SelectSetting {
  key: string;
  title: string;
  description?: string;
  helpText?: string;
  type: "select";
  options: Array<{ value: string; label: string }>;
  default?: string;
  confirm?: ConfirmConfig;
  dangerous?: boolean;
  visibleWhen?: VisibilityCondition | VisibilityCondition[];
  validation?: {
    required?: boolean;
    message?: string;
  };
}
```

### 3.5 Multi-Select

Multiple choice selection. Instant-apply on change.

```typescript
interface MultiSelectSetting {
  key: string;
  title: string;
  description?: string;
  helpText?: string;
  type: "multiselect";
  options: Array<{ value: string; label: string }>;
  default?: string[];
  confirm?: ConfirmConfig;
  dangerous?: boolean;
  visibleWhen?: VisibilityCondition | VisibilityCondition[];
  validation?: {
    required?: boolean;
    minSelections?: number;
    maxSelections?: number;
    message?: string;
  };
}
```

### 3.6 Date

```typescript
interface DateSetting {
  key: string;
  title: string;
  description?: string;
  helpText?: string;
  type: "date";
  default?: string; // ISO 8601 date string
  confirm?: ConfirmConfig;
  dangerous?: boolean;
  visibleWhen?: VisibilityCondition | VisibilityCondition[];
  validation?: {
    required?: boolean;
    minDate?: string;
    maxDate?: string;
    message?: string;
  };
}
```

**Implementation note:** The styled layer renders dates with native `<input type="date">`. Custom date pickers should use the `custom` extension point.

### 3.7 Compound (Multi-Field Atomic Setting)

A group of related fields that save together. Renders as a single row on the main page with a button to open the editing context.

```typescript
interface CompoundSetting {
  key: string;
  title: string;
  description?: string;
  helpText?: string;
  type: "compound";

  /**
   * How the compound fields are displayed:
   * - "modal": Single row with "Configure" button, fields open in a modal with Save/Cancel
   * - "page": Single row with arrow/link, fields open in a nested subpage with Save/Cancel
   * - "inline": Fields render directly on the main page with a scoped Save/Cancel
   */
  displayStyle: "modal" | "page" | "inline";

  /** The sub-fields within this compound setting */
  fields: Array<
    | TextSetting
    | NumberSetting
    | SelectSetting
    | MultiSelectSetting
    | DateSetting
    | BooleanSetting
  >;

  /** Cross-field validation rules */
  validation?: {
    rules?: Array<{
      when: string; // Field key (relative to compound)
      require?: string; // Another field key that becomes required
      message: string;
    }>;
  };

  confirm?: ConfirmConfig;
  dangerous?: boolean;
  visibleWhen?: VisibilityCondition | VisibilityCondition[];
}
```

**Field key semantics:** Field keys are **relative** to the compound key. A field with key `host` inside compound `notifications.smtp` is stored as `notifications.smtp.host` in the values object. Field keys must be simple identifiers — no dots allowed. The schema validator enforces this. The framework concatenates `{compound.key}.{field.key}` to derive the storage key.

### 3.8 List (Basic CRUD List)

A simple list of items with add/remove. For up to ~50–100 items. Not a data grid.

```typescript
interface ListSetting {
  key: string;
  title: string;
  description?: string;
  helpText?: string;
  type: "list";

  /** Shape of each list item */
  itemType: "text" | "compound";

  /** For compound items, define the fields per item */
  itemFields?: Array<
    TextSetting | NumberSetting | SelectSetting | BooleanSetting
  >;

  default?: any[];
  confirm?: ConfirmConfig;
  dangerous?: boolean;
  visibleWhen?: VisibilityCondition | VisibilityCondition[];
  validation?: {
    minItems?: number;
    maxItems?: number;
    message?: string;
  };
}
```

**Value format:** List values are stored as arrays at the list key. For text lists: `string[]`. For compound lists: `Array<Record<string, any>>`. Example:

```typescript
const values = {
  "notifications.recipients": ["a@b.com", "b@b.com"],           // text list
  "webhooks.endpoints": [{ url: "...", method: "POST" }, ...],  // compound list
};
```

The `default` field type depends on `itemType`: `string[]` for text lists, `Record<string, any>[]` for compound lists. The interface keeps `default?: any[]` since `itemType` determines the shape.

### 3.9 Action (Modal/Dialog Trigger)

A button in the settings row that triggers a modal, dialog, or external action. Does not hold a value — it's an action trigger.

```typescript
interface ActionSetting {
  key: string;
  title: string;
  description?: string;
  helpText?: string;
  type: "action";

  /** Button label */
  buttonLabel: string; // e.g., "Edit in settings.json", "Clear Cache", "Export Data"

  /**
   * What happens on click:
   * - "modal": Opens a modal (developer provides modal content via React)
   * - "callback": Calls the developer's onAction handler
   */
  actionType: "modal" | "callback";

  dangerous?: boolean;
  visibleWhen?: VisibilityCondition | VisibilityCondition[];
}
```

**No value:** Action settings do not hold values. They have no `default` and no `validation`. In the TypeScript types, `ActionSetting` is separate from `ValueSetting` in the discriminated union.

### 3.10 Extension Point (Custom Setting Type)

For setting types not covered by the built-in types. The developer registers a custom renderer.

```typescript
interface CustomSetting {
  key: string;
  title: string;
  description?: string;
  helpText?: string;
  type: "custom";

  /** Identifier for the custom renderer to use */
  renderer: string; // e.g., "color-picker", "code-editor", "file-upload"

  /** Arbitrary config passed to the custom renderer */
  config?: Record<string, any>;

  default?: any;
  confirm?: ConfirmConfig;
  dangerous?: boolean;
  visibleWhen?: VisibilityCondition | VisibilityCondition[];
  validation?: {
    required?: boolean;
    message?: string;
  };
}
```

---

## 4. Shared Behaviors

### 4.1 Save Behavior

| Scenario                                                   | Behavior                                                            | Dirty State?                |
| ---------------------------------------------------------- | ------------------------------------------------------------------- | --------------------------- |
| Single-value setting (boolean, select, text, number, date) | Instant-apply on change (blur/Enter for text, immediate for others) | No                          |
| Compound setting (modal or page)                           | Save/Cancel buttons within the modal or subpage                     | Scoped to modal/page only   |
| Compound setting (inline)                                  | Scoped Save/Cancel rendered below the inline fields                 | Scoped to inline group only |
| Dangerous setting                                          | Confirmation dialog appears before apply                            | No                          |

**The main settings page never has dirty state.** All multi-field editing is scoped to a modal, subpage, or inline editing group.

### 4.2 Confirmation Dialog

```typescript
interface ConfirmConfig {
  /** Title of the confirmation dialog */
  title?: string; // Default: "Confirm Change"

  /** Message body */
  message: string; // e.g., "This will revoke all existing API keys."

  /** Label for the confirm button */
  confirmLabel?: string; // Default: "Confirm"

  /** Label for the cancel button */
  cancelLabel?: string; // Default: "Cancel"

  /**
   * For dangerous actions, require typing a confirmation string.
   * e.g., "Type DELETE to confirm"
   */
  requireText?: string;
}
```

### 4.3 Conditional Visibility (Dependencies)

Simple show/hide dependencies are handled at the schema level. Complex configuration flows should use subpages.

```typescript
interface VisibilityCondition {
  /** The key of the setting this depends on */
  setting: string;

  /** Visible when value equals this */
  equals?: any;

  /** Visible when value does not equal this */
  notEquals?: any;

  /** Visible when value is one of these */
  oneOf?: any[];
}
```

The `visibleWhen` property on all setting interfaces accepts a single condition OR an array (implicit AND):

```typescript
visibleWhen?: VisibilityCondition | VisibilityCondition[];
```

When `visibleWhen` is an array, ALL conditions must be true (implicit AND). For OR logic, use separate settings or subpages. For complex conditions beyond what the schema supports, use the headless layer's callback API.

**Example — single condition:** SSO settings that appear only when SSO is enabled:

```json
{
  "key": "general.security.ssoEnabled",
  "title": "Enable SSO",
  "type": "boolean",
  "default": false
},
{
  "key": "general.security.ssoProvider",
  "title": "SSO Provider",
  "type": "select",
  "options": [
    { "value": "okta", "label": "Okta" },
    { "value": "auth0", "label": "Auth0" }
  ],
  "visibleWhen": { "setting": "general.security.ssoEnabled", "equals": true }
}
```

**Example — AND condition:** SSO domain field visible only when SSO is enabled AND the provider is Okta:

```json
{
  "key": "general.security.ssoDomain",
  "title": "Okta Domain",
  "type": "text",
  "placeholder": "yourcompany.okta.com",
  "visibleWhen": [
    { "setting": "general.security.ssoEnabled", "equals": true },
    { "setting": "general.security.ssoProvider", "equals": "okta" }
  ]
}
```

**Guideline:** Use `visibleWhen` for 1–3 dependent settings. For larger dependent groups (4+ settings), use a nested subpage instead.

### 4.4 Extended Description (Help Text)

Settings can include a `helpText` field for extended explanations. This renders as:

- A small help icon (?) or "Learn more" link next to the short description
- When activated, expands an inline text block below the description
- The block stays visible until the user collapses it
- Works on all devices (no tooltips)
- Keyboard accessible (focusable, toggle with Enter/Space)

### 4.5 Validation

Schema-level validation covers the common cases. The React layer provides a callback escape hatch for complex logic.

**Built-in validators (schema-level):**

| Validator                         | Applies to    | Behavior                              |
| --------------------------------- | ------------- | ------------------------------------- |
| `required`                        | All types     | Value must be set / non-empty         |
| `min` / `max`                     | `number`      | Numeric bounds                        |
| `minLength` / `maxLength`         | `text`        | String length bounds                  |
| `pattern`                         | `text`        | Regex pattern match                   |
| `minDate` / `maxDate`             | `date`        | Date bounds                           |
| `minSelections` / `maxSelections` | `multiselect` | Selection count bounds                |
| `minItems` / `maxItems`           | `list`        | List length bounds                    |
| `oneOf`                           | `select`      | Validated implicitly by options array |
| `rules`                           | `compound`    | Cross-field dependency rules          |

Each validator supports a `message` string for the error displayed to the user.

**Developer callback (React layer):**

```tsx
<SetteraRenderer
  schema={schema}
  values={values}
  onChange={handleChange}
  onValidate={{
    "integrations.apiKey": async (value) => {
      const valid = await verifyApiKey(value);
      return valid ? null : "This API key is invalid or expired.";
    },
  }}
/>
```

The callback runs after schema-level validation passes. It can be synchronous or asynchronous.

**Precedence:** Schema-level validation runs first. If it fails, the error is shown and the developer's `onValidate` callback is never invoked. Callbacks can only add constraints on top of schema validation — they cannot override it.

---

## 5. Keyboard Navigation

### 5.1 Global Shortcuts

| Shortcut            | Action                                    |
| ------------------- | ----------------------------------------- |
| `/` or `Cmd+K`      | Focus the search input                    |
| `Escape`            | Clear search / close modal / exit subpage |
| `Tab` / `Shift+Tab` | Move focus between interactive elements   |

### 5.2 Sidebar Navigation

| Shortcut       | Action                                |
| -------------- | ------------------------------------- |
| `↑` / `↓`      | Move between sidebar items            |
| `Enter` or `→` | Navigate into a page / expand a group |
| `←`            | Collapse a group / navigate to parent |
| `Home` / `End` | Jump to first / last sidebar item     |

### 5.3 Settings Content

| Shortcut    | Action                                                                        |
| ----------- | ----------------------------------------------------------------------------- |
| `Tab`       | Move focus to the next setting's control                                      |
| `Shift+Tab` | Move focus to the previous setting's control                                  |
| `Space`     | Toggle a boolean switch                                                       |
| `Enter`     | Open a select dropdown, open a compound modal/page, activate an action button |
| `Escape`    | Close dropdown, cancel modal                                                  |

### 5.4 Focus Model

The framework uses a three-tier keyboard navigation model:

| Tier             | Mechanism                                        | Who uses it                             |
| ---------------- | ------------------------------------------------ | --------------------------------------- |
| **Casual**       | Tab through settings linearly                    | Everyone, no learning curve             |
| **Intermediate** | F6 to switch between sidebar and content         | Users who know pane-cycling conventions |
| **Power user**   | Ctrl+↓ / Ctrl+↑ to jump between section headings | Keyboard-heavy users                    |

Implementation details:

- **F6** cycles between sidebar and content area
- **Tab** flows linearly through all settings in the content area (no per-section tab groups)
- Section headings are focusable landmarks (`tabindex="-1"`) for screen readers and programmatic focus
- **Ctrl+↓ / Ctrl+↑** jumps between section headings (progressive enhancement)
- Modals and inline compound editors trap focus
- Search (`/` or `Cmd+K`) is the fastest way to any specific setting

### 5.5 Mobile

Keyboard shortcuts are not relevant on mobile. Touch navigation replaces keyboard:

- Sidebar becomes a drill-down navigation (tap to enter, back button to return)
- Each page is full-screen
- All controls use native-feeling touch targets

---

## 6. Search

### 6.1 Behavior

Search filters the navigation tree to show only pages/sections containing matching settings. It matches against:

- Setting `title`
- Setting `description`
- Section `title`
- Page `title`

Search is **client-side** and **exact substring match** (case-insensitive). No fuzzy matching. If a developer wants a setting discoverable by a term not in the title or description, they should include that term in the description text.

### 6.2 UI Behavior

- Search input is at the top of the sidebar
- As the user types, the sidebar tree filters to show only pages containing matches
- The content area highlights or filters to show only matching settings
- Clearing the search restores the full tree
- Pressing `Escape` clears the search and returns focus to the content area

---

## 7. React API (Headless Layer)

### 7.1 Core Component

```tsx
import { SetteraProvider, SetteraRenderer } from "@settera/react";

function AppSettings() {
  const [values, setValues] = useState(initialValues);

  return (
    <SetteraProvider schema={schema}>
      <SetteraRenderer
        values={values}
        onChange={(key: string, value: any) => {
          // Called on every setting change (instant-apply)
          // Called per-field for compound settings ONLY if onBatchChange is not provided
          setValues((prev) => ({ ...prev, [key]: value }));
          saveToBackend(key, value);
        }}
        onBatchChange={(changes: Array<{ key: string; value: any }>) => {
          // Optional. Called for compound settings on Save.
          // If provided, onChange is NOT called for compound fields.
          saveBatchToBackend(changes);
          setValues((prev) => {
            const next = { ...prev };
            for (const { key, value } of changes) next[key] = value;
            return next;
          });
        }}
        onAction={{
          // Handlers for action-type settings
          "data.clearCache": async () => {
            await clearCache();
          },
        }}
        onValidate={{
          // Custom validation callbacks (async supported)
          "integrations.apiKey": async (value) => {
            const valid = await verifyApiKey(value);
            return valid ? null : "Invalid API key";
          },
        }}
      />
    </SetteraProvider>
  );
}
```

The headless layer also exposes composable primitives (`<SetteraSidebar>`, `<SetteraContent>`, `<SetteraSearch>`, `<SetteraSettingRow>`). `<SetteraRenderer>` composes them into a default layout. Developers who need control over layout use the parts directly.

### 7.2 Values Format

Values are passed as a **flat object** with dot-notation keys matching the schema:

```typescript
const values = {
  "general.closingBehavior": "platform_default",
  "general.security.trustAllProjects": false,
  "general.security.ssoEnabled": true,
  "general.security.ssoProvider": "okta",
  "notifications.smtp.host": "smtp.example.com",
  "notifications.smtp.port": 587,
};
```

Flat keys are simpler to work with than nested objects — no deep merge logic, easy to diff, straightforward to serialize.

**Compound fields** are stored as flat keys derived from `{compound.key}.{field.key}`. A compound `notifications.smtp` with fields `host` and `port` produces keys `notifications.smtp.host` and `notifications.smtp.port` in the values object. When a compound setting is saved, each field is stored individually at its derived key.

**List values** are an exception to the flat-key convention: their values are arrays stored at the list key.

```typescript
const values = {
  "general.closingBehavior": "platform_default", // select — flat primitive
  "notifications.smtp.host": "smtp.example.com", // compound field — flat key
  "notifications.smtp.port": 587, // compound field — flat key
  "notifications.recipients": ["a@b.com", "b@b.com"], // text list — array
  "webhooks.endpoints": [
    // compound list — array of objects
    { url: "https://...", method: "POST" },
  ],
};
```

The flat-key convention applies to settings. List-type settings are an exception: their values are arrays.

### 7.3 Headless Hooks (for Custom Renderers)

```tsx
import {
  useSettera,
  useSetteraSearch,
  useSetteraNavigation,
  useSetteraSetting,
} from "@settera/react";

// Access the full schema and state
const { schema, values, setValue, validate } = useSettera();

// Search
const { query, setQuery, filteredPages } = useSetteraSearch();

// Sidebar navigation state
const { activePage, setActivePage, expandedGroups, toggleGroup } =
  useSetteraNavigation();

// Individual setting state and controls
const { value, setValue, error, isVisible } =
  useSetteraSetting("general.autoSave");
```

### 7.4 Custom Setting Type Registration

```tsx
import { SetteraProvider } from "@settera/react";

const customRenderers = {
  "color-picker": ({ value, onChange, config }) => (
    <MyColorPicker
      value={value}
      onChange={onChange}
      swatches={config.swatches}
    />
  ),
  "code-editor": ({ value, onChange, config }) => (
    <MonacoEditor
      value={value}
      onChange={onChange}
      language={config.language}
    />
  ),
};

<SetteraProvider schema={schema} renderers={customRenderers}>
  <SetteraRenderer ... />
</SetteraProvider>
```

---

## 8. Responsive Layout

### 8.1 Desktop (≥768px)

- **Sidebar** on the left: fixed width, scrollable, shows full navigation tree with search
- **Content area** on the right: scrollable, shows settings for the active page
- Full keyboard navigation active
- Sidebar and content are both visible simultaneously

### 8.2 Mobile (<768px)

- **Sidebar becomes full-screen navigation**: each page tap replaces the view
- **Back button** at the top of each page to return to parent navigation
- All controls use appropriate touch targets (minimum 44px)
- Keyboard shortcuts disabled
- Search is accessible from the navigation view

### 8.3 Breakpoint

The 768px breakpoint is the default. The styled layer allows overriding this. The headless layer exposes a `useSetteraLayout()` hook that returns `"desktop" | "mobile"` so custom renderers can adapt.

**Note:** Tablets in portrait orientation (e.g., iPad at 768px) receive the mobile layout. This is intentional — the sidebar is too narrow at this width to be useful alongside content. The breakpoint is configurable via the styled layer.

---

## 9. Accessibility

### 9.1 Requirements

- All controls have proper ARIA labels derived from setting `title` and `description`
- Focus is always visible (focus ring on all interactive elements)
- Screen reader announces setting title, description, current value, and any validation errors
- Color is never the sole indicator of state (switches use position + label, errors use icon + text)
- Modals trap focus and return focus to the trigger on close
- All interactive elements reachable via Tab
- Section headings use proper heading hierarchy (`h2` for sections, `h3` for subsections)

### 9.2 ARIA Structure

```
role="navigation"        → Sidebar
  role="tree"            → Navigation tree
    role="treeitem"      → Each page link
role="main"              → Content area
  role="region"          → Each section (aria-labelledby section heading)
    role="group"         → Each setting row
```

---

## 10. Scope and Non-Goals

### 10.1 In Scope (v1)

- Schema definition and parsing
- All setting types defined above (boolean, text, number, select, multiselect, date, compound, list, action, custom)
- Sidebar navigation with nested pages
- Content sections and subsections
- Search (substring match on title/description)
- Full keyboard navigation
- Responsive desktop/mobile layout
- Schema-level validation
- Instant-apply with optional confirmation
- Conditional visibility (simple dependencies)
- Styled layer with Tailwind/shadcn defaults
- Custom setting type extension point

### 10.2 Out of Scope (v1)

- Permissions / role-based visibility (developer handles externally)
- Reset to default
- Undo/redo
- Wizard/stepper flows
- Data grids or complex table UIs
- Fuzzy search or search synonyms
- Settings import/export
- Backend persistence (UI-only; developer provides onChange callback)
- Non-React renderers (Vue, Svelte, etc. — future consideration)
- Slider, color picker, file upload (use custom extension point)

---

## 11. File/Package Structure (Recommended)

```
settera/
├── packages/
│   ├── schema/              # Pure TypeScript types + validation
│   │   ├── src/
│   │   │   ├── types.ts     # All TypeScript interfaces
│   │   │   ├── validate.ts  # Schema validation (is this a valid schema?)
│   │   │   └── index.ts
│   │   └── package.json     # @settera/schema
│   │
│   ├── react/               # Headless React layer
│   │   ├── src/
│   │   │   ├── provider.tsx          # SetteraProvider context
│   │   │   ├── renderer.tsx          # SetteraRenderer component
│   │   │   ├── hooks/
│   │   │   │   ├── useSettera.ts
│   │   │   │   ├── useSetteraSearch.ts
│   │   │   │   ├── useSetteraNavigation.ts
│   │   │   │   ├── useSetteraSetting.ts
│   │   │   │   └── useSetteraLayout.ts
│   │   │   ├── components/
│   │   │   │   ├── SetteraSidebar.tsx
│   │   │   │   ├── SetteraContent.tsx
│   │   │   │   ├── SetteraSearch.tsx
│   │   │   │   └── SetteraSettingRow.tsx
│   │   │   ├── keyboard/            # Focus management, keyboard handlers
│   │   │   └── index.ts
│   │   └── package.json     # @settera/react
│   │
│   └── ui/                  # Styled components
│       ├── src/
│       │   ├── components/
│       │   │   ├── Sidebar.tsx
│       │   │   ├── SearchInput.tsx
│       │   │   ├── SettingRow.tsx
│       │   │   ├── BooleanSwitch.tsx
│       │   │   ├── TextInput.tsx
│       │   │   ├── SelectInput.tsx
│       │   │   ├── CompoundModal.tsx
│       │   │   ├── CompoundPage.tsx
│       │   │   ├── CompoundInline.tsx
│       │   │   ├── ListEditor.tsx
│       │   │   ├── ActionButton.tsx
│       │   │   ├── ConfirmDialog.tsx
│       │   │   ├── HelpText.tsx
│       │   │   └── ValidationError.tsx
│       │   ├── icons.ts             # Lucide icon mapping
│       │   └── index.ts
│       └── package.json     # @settera/ui
│
├── docs/                    # Documentation site
├── examples/
│   ├── minimal/             # Simplest possible example
│   ├── enterprise/          # Complex nested settings with compounds
│   └── headless/            # Custom-styled example
└── package.json             # Monorepo root
```

---

## 12. Resolved Decisions (from Implementation Planning)

These decisions were resolved during the implementation planning phase. See `DECISIONS.md` for the full log.

1. **Monorepo tooling** → pnpm workspaces + Turborepo. pnpm handles dependency linking; Turborepo adds build caching and task orchestration.
2. **Package naming** → `@settera/schema`, `@settera/react`, `@settera/ui` (scoped npm). Consistent with Radix (`@radix-ui/*`), prevents name squatting.
3. **Bundling** → tsup (wraps esbuild). Dual CJS + ESM output, `.d.ts` generation, minimal config.
4. **Testing** → Vitest + React Testing Library + Playwright. Vitest for unit tests, RTL for component integration, Playwright for keyboard navigation e2e.
5. **Documentation** → Deferred to post-M4. README + examples first. Starlight (Astro-based) when the time comes.
6. **onChange API** → `onChange(key: string, value: any)` for single-value settings. Optional `onBatchChange(changes: Array<{ key: string; value: any }>)` for compound settings. If `onBatchChange` is provided, compound Save triggers it instead of per-field `onChange` calls.
7. **Animation** → No animations in v0.1. Static transitions. Animation is easy to add later as a non-breaking change.
