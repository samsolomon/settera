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
| `pages` | `PageDefinition[]` | Pages array from the schema |
| `subpage` | `SubpageState \| null` | Active subpage, or null |
| `openSubpage` | `(settingKey: string) => void` | Open a subpage for a compound setting |
| `closeSubpage` | `() => void` | Close the active subpage |

The UI packages (`@settera/ui` and `@settera/shadcn-registry`) provide their own `SetteraNavigationProvider` that composes on top of `SetteraNavigation`, adding search, expanded groups, and setting highlight. If you're building a custom UI, use `SetteraNavigation` directly.
