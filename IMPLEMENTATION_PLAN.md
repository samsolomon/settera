# Settera Implementation Plan

## Prior Art

Three projects inform Settera's design. Understanding what to borrow (and what to avoid) from each prevents reinventing solved problems.

### Zed Settings

Zed generates its settings schema dynamically from Rust types — the types _are_ the schema, no translation layer. Their "tab groups" concept is the key innovation Settera borrows: container-level scopes that reset tab indexing, enabling keyboard navigation through complex forms with near-zero boilerplate. Their insight that "the file is the organizing principle" is worth noting — Settera's schema-driven approach is philosophically similar, but the schema sits between the developer and the UI rather than being the UI itself.

**Borrow:** Tab group scoping model, keyboard-first design, search-first settings discovery.
**Diverge:** Zed's schema is runtime-generated from types. Settera's is static/declarative JSON — a different tradeoff (portability over dynamism).

### Radix UI (Headless Patterns)

Radix separates behavior from styling through a four-layer architecture: core utilities → behavioral primitives → state management → high-level components. Two patterns matter for Settera:

1. **Composable parts**: `Dialog.Root`, `Dialog.Trigger`, `Dialog.Content` — consumers assemble pieces rather than configuring a monolith.
2. **Roving focus**: Radix's `@radix-ui/react-roving-focus` handles keyboard navigation within component groups. Settera's focus management should study this rather than building from scratch.

**Borrow:** Part-based composition, roving focus patterns, `asChild` polymorphism for DOM flexibility.
**Diverge:** Radix builds individual components. Settera builds a coordinated system (sidebar + content + search + keyboard nav all work together).

### shadcn/ui (Philosophy, Not Distribution)

shadcn's copy-paste model (`npx shadcn add button` copies source into your project) is great for stable libraries but terrible during API stabilization — every breaking change means users manually re-apply diffs to copied files. The inspiration from shadcn is philosophical: own your code, Tailwind-based, composable, CVA for variant management, CSS variable theming.

**v0.1:** `@settera/ui` ships as a traditional npm package. The API is still changing; users need version bumps, not manual diffs.
**Post-stabilization:** Offer `npx settera add` CLI that ejects components into the developer's project. At that point the API surface is stable enough that copy-paste ownership makes sense.

**Borrow:** Tailwind + CVA styling, CSS variable theming, composable component philosophy.
**Defer:** CLI-based copy-paste distribution until API stabilizes.

---

## Build Order

### schema → react → ui (confirmed, with caveats)

The dependency chain dictates this order. But pure bottom-up development produces APIs nobody wants to use. The real approach is iterative vertical slices:

```
M0: Scaffold all three packages simultaneously
M1: Schema types + validation for ONE setting type (boolean)
     → Immediately build the react hook that consumes it
     → Immediately build a minimal styled component to validate the DX
M2: Expand schema to cover all types, guided by what felt wrong in M1
M3: Build out the full react layer
M4: Build out the full styled layer
```

The point: **don't ship the schema package and call it done before writing a single React hook.** The schema API will have blind spots that only surface when you try to consume it. Build thin vertical slices first, then widen.

**Practical build order within each package:**

| Order | Schema                                    | React                       | UI                                          |
| ----- | ----------------------------------------- | --------------------------- | ------------------------------------------- |
| 1     | TypeScript interfaces                     | `SetteraProvider` + context | Sidebar + page layout                       |
| 2     | Schema validator                          | `useSetteraSetting` hook    | `SettingRow` container                      |
| 3     | Utility functions (traversal, flattening) | `useSetteraNavigation`      | Individual controls (boolean, text, select) |
| 4     | —                                         | `useSetteraSearch`          | Compound/list/action editors                |
| 5     | —                                         | Keyboard navigation system  | Responsive layout                           |
| 6     | —                                         | Focus management            | Modals, confirm dialogs                     |

---

## Technical Decisions (Section 12)

### 1. Monorepo tooling → **pnpm workspaces + Turborepo**

pnpm workspaces handle dependency linking. Turborepo adds build caching and task orchestration without Nx's complexity. This is the most common setup for TypeScript library monorepos in 2026.

```
pnpm-workspace.yaml
turbo.json
packages/
  schema/
  react/
  ui/
```

### 2. Package naming → **`@settera/schema`, `@settera/react`, `@settera/ui`**

Scoped packages. Consistent with Radix (`@radix-ui/*`), prevents name squatting, signals a cohesive project. Register the `@settera` npm org before writing code.

### 3. Bundling → **tsup**

tsup wraps esbuild with sensible library defaults: dual CJS + ESM output, `.d.ts` generation, minimal config. Vite is for applications. Rollup is more powerful but more configuration. tsup is the right tool for library builds.

```typescript
// packages/schema/tsup.config.ts
export default defineConfig({
  entry: ["src/index.ts"],
  format: ["cjs", "esm"],
  dts: true,
  clean: true,
});
```

### 4. Testing → **Vitest + React Testing Library + Playwright**

- **Vitest** for unit tests (schema validation, hook logic). Fast, native ESM, works with the pnpm/Turborepo setup.
- **React Testing Library** for component integration tests (hook behavior, render output).
- **Playwright** for keyboard navigation and responsive layout e2e tests. Keyboard nav is the highest-risk feature — it needs real browser testing, not jsdom simulation.

### 5. Documentation → **Defer to post-M4**

Documentation tooling is a bikeshed. Don't pick one until you have something to document. When the time comes, Starlight (Astro-based) is the current best option for library docs. But a well-written README and a few examples are more valuable than an empty docs site.

### 6. onChange API → **`onChange(key, value)` + optional `onBatchChange`**

**Note:** This section was updated to match the binding decision from the implementation kickoff. The original always-array proposal was replaced.

The primary callback is `onChange(key: string, value: any)` — the simplest possible signature for the 90% case. For compound settings that need atomic batch saves, an optional `onBatchChange` callback is provided.

```tsx
<SetteraRenderer
  schema={schema}
  values={values}
  onChange={(key: string, value: any) => {
    // Called for single-value settings (always)
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
/>
```

**Why not always-array?** The simple `onChange(key, value)` signature covers 90% of use cases with minimal boilerplate. Requiring developers to destructure an array for every toggle adds friction without benefit. The optional `onBatchChange` provides atomicity for compound saves without forcing the complexity on simple cases.

### 7. Animation → **No animations in v1**

Static transitions. Animation is easy to add, hard to remove. Adding `framer-motion` or CSS transitions later is a non-breaking change. Shipping animations now creates API surface (duration props, disable flags) that's hard to walk back.

---

## Resolved Spec Issues

Issues identified during planning, now resolved. These should be folded back into the spec before implementation.

### Setting keys are opaque identifiers (not structural paths)

The spec already defines keys as "developer-defined" and independent of page structure. But the examples are misleading — `general.closingBehavior` on the `general` page implies dots encode page hierarchy. This will cause developers to assume moving a setting between pages requires changing its key.

**Resolution:** The spec's intent is correct. Update examples to make the independence obvious — e.g., put a setting keyed `editor.fontSize` on the `appearance` page. Add an explicit note: "Setting keys are opaque identifiers. Dot notation is a naming convention, not a structural requirement. The framework does not enforce any relationship between a setting's key and its position in the page hierarchy."

### Styled layer ships as npm package (shadcn CLI deferred)

The shadcn inspiration is about philosophy — own your code, Tailwind-based, composable — not the distribution mechanism. A copy-paste CLI during API stabilization means every breaking change requires users to manually re-apply diffs to copied source files. Ship `@settera/ui` as a normal npm package for v0.1. Plan `npx settera add` for post-stabilization.

### Compound field keys are relative

Field keys in compound settings are simple identifiers relative to the compound key. A field with key `host` inside compound `notifications.smtp` is stored as `notifications.smtp.host` in the values object. The schema validator enforces that field keys contain no dots.

### List values are arrays at the list key

The "flat primitives" rule gets one exception: list-type settings store arrays. Text lists store `string[]`. Compound lists store `Array<Record<string, any>>`. This is the pragmatic answer — indexed flat keys (`webhooks.0.url`) are fragile and ugly.

```typescript
const values = {
  "general.autoSave": true, // boolean — flat primitive
  "notifications.recipients": ["a@b.com", "c@d"], // text list — array of strings
  "webhooks.endpoints": [
    // compound list — array of objects
    { url: "https://...", method: "POST" },
    { url: "https://...", method: "GET" },
  ],
};
```

### onChange uses `onChange(key, value)` + optional `onBatchChange`

See Technical Decisions §6 above. `onChange(key: string, value: any)` for single-value settings. Optional `onBatchChange` for compound settings that need atomic batch saves.

### `visibleWhen` expanded with `oneOf` and AND conditions

Add `oneOf` (value is in a set). Allow `visibleWhen` to accept an array of conditions (implicit AND). For anything more complex (OR, nested boolean logic), push developers to a runtime callback. Don't build a query language.

```typescript
// Single condition (unchanged):
visibleWhen: { setting: "sso.enabled", equals: true }

// oneOf:
visibleWhen: { setting: "auth.method", oneOf: ["oauth", "saml"] }

// AND (array of conditions, all must be true):
visibleWhen: [
  { setting: "sso.enabled", equals: true },
  { setting: "sso.provider", oneOf: ["okta", "auth0"] }
]
```

### SetteraRenderer is sugar over composable parts

The headless layer exposes composable primitives (`<SetteraSidebar>`, `<SetteraContent>`, `<SetteraSearch>`, `<SetteraSettingRow>`). `<SetteraRenderer>` is a convenience wrapper that composes them with a default layout. Developers who need control over layout use the parts directly.

### Action settings use a discriminated union

Actions are kept in the schema (pragmatic — developers expect "Clear Cache" in settings) but the TypeScript types separate them:

```typescript
type SettingDefinition = ValueSetting | ActionSetting;
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

Generic code that operates on "settings with values" uses `ValueSetting`.

### Schema validation runs before callback validation

Schema validators execute first. If they fail, the error is shown and the developer's `onValidate` callback is never invoked. Callbacks can only add constraints on top of schema validation, not override it.

### Date setting uses native `<input type="date">`

For v1, the styled layer renders dates with the native HTML date input. Accessible, keyboard-navigable, works on mobile. Custom date pickers are scope creep — developers who need one use the `custom` extension point.

---

## Open Discussion: Keyboard Navigation Scope

### The tradeoff

**Linear Tab (current recommendation):** Tab flows through all settings on the page sequentially. Simple, predictable, no invisible walls. But on a page with 40 settings across 6 sections, reaching the last section means 40+ Tab presses.

**Per-section tab groups:** Tab cycles within a section, a different key moves between sections. Efficient for large pages. But creates invisible walls — "why can't I Tab to the next setting?" — and requires an extra keyboard shortcut that users need to discover.

### Proposed middle ground: three tiers

| Tier             | Mechanism                                        | Who uses it                             |
| ---------------- | ------------------------------------------------ | --------------------------------------- |
| **Casual**       | Tab through settings linearly                    | Everyone, no learning curve             |
| **Intermediate** | F6 to switch between sidebar ↔ content           | Users who know pane-cycling conventions |
| **Power user**   | Ctrl+↓ / Ctrl+↑ to jump between section headings | Keyboard-heavy users, enterprise admins |

Implementation details:

- Tab flows linearly through all settings (no per-section groups)
- F6 cycles between sidebar and content area
- Section headings get `tabindex="-1"` (programmatically focusable, not in Tab order) — screen readers navigate them via heading shortcuts
- Ctrl+↓ / Ctrl+↑ jumps focus to the next/previous section heading, then Tab resumes from there
- Modals and inline compound editors trap focus (standard behavior)
- Search (`/` or `Cmd+K`) is the fastest way to any specific setting
- Optional `?` keyboard shortcut overlay shows available shortcuts

The headless layer exposes all three behaviors as composable hooks. The styled layer wires them up by default. Enterprise developers who want stricter per-section groups can compose the hooks differently.

**Question:** Is the three-tier model sufficient for enterprise use cases, or do you want configurable per-section tab groups as a first-class option in the headless layer?

---

## Milestone Breakdown

### M0: Project Scaffold

**Goal:** Empty packages that build, test, lint, and publish.

- [ ] Initialize pnpm monorepo with `pnpm-workspace.yaml`
- [ ] Configure Turborepo (`turbo.json`) for build/test/lint pipelines
- [ ] Create `packages/schema`, `packages/react`, `packages/ui` with tsup configs
- [ ] Set up Vitest (shared config at root, per-package test files)
- [ ] Set up TypeScript project references (composite builds)
- [ ] ESLint + Prettier config
- [ ] GitHub Actions: CI pipeline (build + test + lint on PR)
- [ ] Register `@settera` npm org
- [ ] Add a `packages/test-app` Vite app for manual testing during development

**Exit criteria:** `pnpm build` and `pnpm test` succeed across all packages. The test app renders "hello world" and imports from all three packages.

### M1: Schema Package + Vertical Slice

**Goal:** Complete schema types, schema validator, and a thin vertical proof through all three layers for boolean + text + select settings.

- [ ] Define all TypeScript interfaces (§2–4 of spec), incorporating resolved issues above
- [ ] Implement `validateSchema()` — takes a schema object, returns errors
  - Validate structural rules (keys unique, pages nest correctly, subsections one level deep)
  - Validate setting definitions (required fields present, correct types)
  - Validate cross-references (`visibleWhen` points to existing settings)
  - Validate compound field keys are simple identifiers (no dots)
- [ ] Implement schema traversal utilities:
  - `flattenSettings(schema)` → flat array of all settings with resolved paths
  - `getSettingByKey(schema, key)` → look up a setting definition
  - `getPageByKey(schema, key)` → look up a page
  - `resolveDependencies(schema)` → dependency graph for `visibleWhen`
- [ ] **Vertical slice:** Build a minimal `SetteraProvider` + `useSetteraSetting` hook + styled `BooleanSwitch` to validate the schema → react → ui pipeline works end-to-end
- [ ] Write a reference example schema (~20 settings across 3 pages) for use in all subsequent development

**Exit criteria:** A developer can define a schema with boolean/text/select settings, pass it to the vertical slice components, and see them render with working instant-apply behavior.

### M2: React Headless Core

**Goal:** All hooks, navigation state, search, keyboard nav. No styled components yet — test with a minimal unstyled test harness.

- [ ] `SetteraProvider` — context that holds schema, values, renderers, callbacks
- [ ] `useSettera()` — access schema, values, setValue, validate
- [ ] `useSetteraSetting(key)` — value, setValue, error, isVisible, metadata
- [ ] `useSetteraNavigation()` — activePage, setActivePage, expandedGroups, breadcrumbs
- [ ] `useSetteraSearch()` — query, setQuery, filteredPages, highlighted settings
- [ ] `useSetteraLayout()` — returns "desktop" | "mobile" based on breakpoint
- [ ] Composable primitives: `<SetteraSidebar>`, `<SetteraContent>`, `<SetteraSearch>`, `<SetteraSettingRow>`
- [ ] `<SetteraRenderer>` convenience wrapper that composes the primitives
- [ ] Visibility engine — evaluates `visibleWhen` conditions (equals, notEquals, oneOf, AND arrays)
- [ ] Validation engine — schema validators first, then async callbacks; manages error state
- [ ] onChange handler — `onChange(key, value)` + optional `onBatchChange` for compound settings
- [ ] Focus management:
  - Linear Tab through content settings
  - F6 to cycle sidebar ↔ content
  - Roving focus within sidebar (↑/↓/→/←/Home/End)
  - Ctrl+↓/↑ section jumping (progressive enhancement)
- [ ] Global keyboard shortcuts (`/` and `Cmd+K` for search, `Escape` to clear/close)
- [ ] Compound editing state management (open/close, dirty tracking, save/cancel, batch onChange)
- [ ] List editing state management (add/remove/reorder items, array value format)

**Exit criteria:** All hooks work correctly in unit tests. The unstyled test harness demonstrates navigation, search, keyboard nav, compound editing, and validation. Playwright tests cover keyboard navigation end-to-end.

### M3: Styled Layer — Core

**Goal:** Ship the styled layer for all simple setting types + layout.

- [ ] `SetteraLayout` — sidebar + content area responsive container
- [ ] `SetteraSidebar` — navigation tree with expand/collapse, active state, icons (Lucide)
- [ ] `SetteraSearch` — search input integrated with sidebar filtering
- [ ] `SetteraPage` — content area for a page, renders sections
- [ ] `SetteraSection` / `SetteraSubsection` — section containers with headings
- [ ] `SettingRow` — layout container for a single setting (title, description, control)
- [ ] Controls: `BooleanSwitch`, `TextInput`, `NumberInput`, `SelectInput`, `MultiSelect`, `DateInput` (native)
- [ ] `HelpText` — expandable inline help
- [ ] `ValidationError` — error message display
- [ ] `ConfirmDialog` — confirmation modal with optional text confirmation
- [ ] Mobile responsive layout (drill-down navigation, back button)
- [ ] Tailwind + CVA setup, CSS variable theming

**Exit criteria:** A complete settings UI renders from schema for all simple setting types. Desktop and mobile layouts work. Keyboard navigation works end-to-end.

### M4: Styled Layer — Complex Types + Polish

**Goal:** Compound settings, list settings, action settings, custom renderers. Polish.

- [ ] `CompoundModal` — modal editing context for compound settings
- [ ] `CompoundPage` — subpage editing context for compound settings
- [ ] `CompoundInline` — inline editing with scoped Save/Cancel
- [ ] `ListEditor` — add/remove/reorder for text and compound lists
- [ ] `ActionButton` — action trigger with callback/modal support
- [ ] Custom renderer registration and rendering
- [ ] Dangerous setting styling (warning colors, enhanced confirm)
- [ ] Icon mapping (Lucide icons for canonical names, fallback for unknown)
- [ ] Full a11y audit (ARIA structure per §9, screen reader testing)
- [ ] Complete Playwright e2e test suite covering all interactions

**Exit criteria:** All setting types from the spec work end-to-end. The example schemas (minimal, enterprise, headless) all render correctly. Accessibility audit passes.

### M5: Examples + Documentation + Release Prep

**Goal:** Ship v0.1.

- [ ] `examples/minimal` — simplest possible settings page (~5 settings)
- [ ] `examples/enterprise` — complex nested settings with compounds, lists, conditional visibility, actions
- [ ] `examples/headless` — custom-styled example using only `@settera/react`
- [ ] README for each package with quick-start guide
- [ ] API reference documentation (generated from TSDoc comments)
- [ ] CHANGELOG, LICENSE, CONTRIBUTING
- [ ] npm publish workflow (manual trigger, semver)
- [ ] Landing page / docs site (if time permits — otherwise README is enough)

**Exit criteria:** A developer can install, configure, and render a settings UI in under 30 minutes by following the README. All examples work.

---

## Remaining Decisions

1. **Keyboard nav scope** — Is the three-tier model (linear Tab + F6 pane cycling + Ctrl+↓/↑ section jumping) sufficient, or do you want configurable per-section tab groups as a first-class option?
2. **Mobile breakpoint** — Keep 768px default (iPad portrait = mobile layout), or lower to 640px? Make it configurable either way.
