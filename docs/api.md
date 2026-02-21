# React API Reference

## Settera Component

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

### Validation Modes

- **`"valid-only"`** (default) — `onChange` is only called when the value passes sync validation. Invalid values are stored locally and shown to the user with an error, but never passed to `onChange`.
- **`"eager-save"`** — `onChange` is called even when the value fails sync validation. Use this when you want to persist invalid values (e.g. for draft/autosave scenarios) and handle validation server-side.

In both modes, async validation (`onValidate`) runs on blur and is independent of the save pipeline.

## Hooks

### useSettera()

Access the full schema and raw values.

```typescript
const { schema, values, setValue } = useSettera();
```

| Return | Type | Description |
| --- | --- | --- |
| `schema` | `SetteraSchema` | The full schema object |
| `values` | `Record<string, unknown>` | Current values merged with defaults |
| `setValue` | `(key: string, value: unknown) => void` | Set a value (runs full pipeline) |

### useSetteraSetting(key)

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

### useSetteraAction(key)

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

### useSetteraConfirm()

Render confirmation dialogs.

```typescript
const { pendingConfirm, resolveConfirm } = useSetteraConfirm();
```

| Return | Type | Description |
| --- | --- | --- |
| `pendingConfirm` | `PendingConfirm \| null` | The pending confirm dialog, or null |
| `resolveConfirm` | `(confirmed: boolean, text?: string) => void` | Confirm or cancel. Pass typed text when `requireText` is set. |

### useSetteraSection(pageKey, sectionKey)

Check section visibility.

```typescript
const { isVisible, definition } =
  useSetteraSection("general", "behavior");
```

| Return | Type | Description |
| --- | --- | --- |
| `isVisible` | `boolean` | Whether the section is visible |
| `definition` | `SectionDefinition` | The section definition from the schema |

## Navigation

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
| `pages` | `PageItem[]` | Pages from the schema (see note below) |
| `subpage` | `SubpageState \| null` | Active subpage, or null |
| `openSubpage` | `(settingKey: string) => void` | Open a subpage for a compound setting |
| `closeSubpage` | `() => void` | Close the active subpage |

`PageItem` is `PageDefinition | PageGroup`. A `PageGroup` is `{ label: string; pages: PageDefinition[] }` — see [Page groups](schema.md#page-groups) in the schema reference.

The UI packages (`@settera/ui` and `@settera/shadcn-registry`) provide their own `SetteraNavigationProvider` that composes on top of `SetteraNavigation`, adding search, expanded groups, and setting highlight. If you're building a custom UI, use `SetteraNavigation` directly.

## SetteraLayout

The prebuilt layout component. Renders a sidebar, page content area, and mobile navigation. Nest it inside `Settera` and `SetteraNavigation`:

```tsx
<Settera schema={schema} values={values} onChange={handleChange}>
  <SetteraNavigation>
    <SetteraLayout
      renderIcon={(name) => <MyIcon name={name} />}
      mobileTitle="Settings"
      backToApp={{ label: "Back to app", href: "/" }}
      syncActivePageWithUrl
    />
  </SetteraNavigation>
</Settera>
```

| Prop | Type | Description |
| --- | --- | --- |
| `renderIcon` | `(iconName: string) => ReactNode` | Render function for page icons in the sidebar |
| `mobileBreakpoint` | `number` | Viewport width below which layout switches to mobile mode (default: `768`) |
| `showBreadcrumbs` | `boolean` | Show breadcrumb navigation on mobile |
| `mobileTitle` | `string` | Title shown in the mobile top bar |
| `backToApp` | `SetteraBackToAppConfig` | Back-to-app link in the sidebar |
| `syncActivePageWithUrl` | `boolean` | Sync active page with URL query params |
| `activePageQueryParam` | `string` | Query param name for active page (default: `"page"`) |
| `activeSectionQueryParam` | `string` | Query param name for active section |
| `activeSettingQueryParam` | `string` | Query param name for highlighted setting |
| `customPages` | `Record<string, ComponentType<SetteraCustomPageProps>>` | Custom page renderers keyed by `renderer` string |
| `customSettings` | `Record<string, ComponentType<SetteraCustomSettingProps>>` | Custom setting renderers keyed by `renderer` string |
| `customActionPages` | `Record<string, ComponentType<SetteraActionPageProps>>` | Custom action page renderers keyed by `renderer` string |
| `activePage` | `string` | Controlled active page key (for router integration) |
| `onPageChange` | `(key: string) => void` | Called when the user navigates to a different page (required with `activePage`) |
| `getPageUrl` | `(pageKey: string) => string` | Returns path for a page key; enables `<a href>` links in the sidebar |
| `children` | `ReactNode` | Optional children rendered below the settings content |

### Router integration

Use `activePage`, `onPageChange`, and `getPageUrl` together for framework router integration:

```tsx
// Next.js App Router example
function SettingsPage({ params }: { params: { page: string } }) {
  const router = useRouter();

  return (
    <SetteraLayout
      activePage={params.page}
      onPageChange={(key) => router.push(`/settings/${key}`)}
      getPageUrl={(key) => `/settings/${key}`}
    />
  );
}
```

When `getPageUrl` is provided, sidebar links render as `<a href>` elements instead of buttons, enabling standard browser navigation (cmd-click, right-click menu, etc.).

### SetteraBackToAppConfig

```typescript
interface SetteraBackToAppConfig {
  label?: string;    // Link text (e.g. "Back to app")
  href?: string;     // URL to navigate to
  onClick?: () => void;  // Click handler (use instead of href for SPA navigation)
}
```

### Custom component prop types

**SetteraCustomPageProps** — passed to components registered in `customPages`:

```typescript
interface SetteraCustomPageProps {
  page: PageDefinition;  // The page definition from the schema
  pageKey: string;       // The page's key
}
```

**SetteraCustomSettingProps** — passed to components registered in `customSettings`:

```typescript
interface SetteraCustomSettingProps {
  settingKey: string;        // The setting's key
  definition: CustomSetting; // The setting definition from the schema
}
```

**SetteraActionPageProps** — passed to components registered in `customActionPages`:

```typescript
interface SetteraActionPageProps {
  settingKey: string;         // The setting's key
  definition: ActionSetting;  // The action definition from the schema
  onBack: () => void;         // Close the action page and return to settings
}
```
