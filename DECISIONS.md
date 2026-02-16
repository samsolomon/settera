# Settera — Decision Log

This document tracks implementation decisions that deviate from, extend, or clarify the spec (`settera-spec.md`). It serves as a historical record of _why_ choices were made, so future contributors don't re-litigate resolved questions.

---

## Pre-Implementation Decisions (Planning Phase)

These decisions were made during the implementation planning phase, before any code was written. They are now reflected in the spec.

### D-001: Setting keys are opaque identifiers

**Date:** 2026-02-15
**Spec section:** §2.2
**Decision:** Setting keys and page keys are opaque identifiers. Dot notation is a naming convention, not a structural requirement. The framework does not enforce any relationship between a key and its page position.
**Rationale:** Prevents key churn when reorganizing settings between pages. The spec's intent was always this, but examples were misleading (e.g., `general.closingBehavior` on the `general` page implied structural coupling). Updated examples to demonstrate independence.

### D-002: Styled layer ships as npm package

**Date:** 2026-02-15
**Spec section:** §1.2
**Decision:** `@settera/ui` ships as a traditional npm package for v0.1. The shadcn-style CLI (`npx settera add`) is planned for v1.1+.
**Rationale:** Copy-paste distribution during API stabilization means every breaking change requires users to manually re-apply diffs. Normal npm versioning is the right distribution model until the API surface is stable.

### D-003: Compound field keys are relative

**Date:** 2026-02-15
**Spec section:** §3.7
**Decision:** Field keys inside compound settings are simple identifiers relative to the compound key. A field `host` inside compound `notifications.smtp` is stored as `notifications.smtp.host`. Field keys must not contain dots; the schema validator enforces this.
**Rationale:** Keeps field definitions portable and avoids redundant key prefixing in schema definitions. The framework concatenates `{compound.key}.{field.key}` to derive storage keys.

### D-004: List values are arrays

**Date:** 2026-02-15
**Spec section:** §3.8, §7.2
**Decision:** List-type settings store values as arrays at the list key (e.g., `"notifications.recipients": ["a@b.com", "b@b.com"]`). No indexed flat keys.
**Rationale:** Indexed flat keys (`webhooks.0.url`) are fragile and ugly. Arrays are the natural representation for list data and are what developers expect.

### D-005: onChange + optional onBatchChange

**Date:** 2026-02-15
**Spec section:** §7.1
**Decision:** `onChange(key: string, value: any)` for single-value settings. Optional `onBatchChange(changes: Array<{ key: string; value: any }>)` for compound settings. If `onBatchChange` is provided, compound Save triggers it with all field changes as one batch. If not provided, falls back to individual `onChange` calls per field.
**Rationale:** The simple `onChange(key, value)` signature covers 90% of use cases with minimal boilerplate. The optional `onBatchChange` provides atomicity for compound saves without forcing the complexity on simple cases. This was chosen over an always-array signature which would require destructuring for every single toggle.

### D-006: visibleWhen expanded with oneOf and AND

**Date:** 2026-02-15
**Spec section:** §4.3
**Decision:** Add `oneOf` operator (value is in a set). Allow `visibleWhen` to accept an array of conditions (implicit AND). No OR logic. No query language.
**Rationale:** Covers the most common conditional visibility patterns without building a boolean expression evaluator. OR logic and complex conditions should use the headless layer's callback API or separate settings/subpages.

### D-007: Three-tier keyboard navigation (no per-section tab groups)

**Date:** 2026-02-15
**Spec section:** §5.4
**Decision:** F6 cycles between sidebar and content. Tab flows linearly through all settings in content (no per-section groups). Ctrl+↓/↑ jumps between section headings as progressive enhancement. Modals trap focus.
**Rationale:** Per-section tab groups create invisible walls that confuse users ("why can't I Tab to the next setting?"). Linear Tab is predictable and discoverable. Power users get Ctrl+↓/↑ for efficiency. Search is the fastest way to any specific setting.

### D-008: Scoped npm packages (@settera/\*)

**Date:** 2026-02-15
**Spec section:** §1.2, §11
**Decision:** Package names are `@settera/schema`, `@settera/react`, `@settera/ui`.
**Rationale:** Scoped packages are consistent with Radix (`@radix-ui/*`), prevent name squatting, and signal a cohesive project.

### D-009: Discriminated union for setting types

**Date:** 2026-02-15
**Spec section:** §3
**Decision:** `SettingDefinition = ValueSetting | ActionSetting`. ActionSetting has no `default` and no `validation`. Generic code that operates on "settings with values" uses `ValueSetting`.
**Rationale:** Actions are semantically different from value-bearing settings. The discriminated union makes this explicit in the type system, enabling exhaustive pattern matching and preventing invalid states (e.g., trying to validate an action).

### D-010: Schema validation runs before callbacks

**Date:** 2026-02-15
**Spec section:** §4.5
**Decision:** Schema-level validation runs first. If it fails, `onValidate` callbacks are never invoked. Callbacks can only add constraints, not override schema validation.
**Rationale:** Provides a clear, predictable validation pipeline. Developers can trust that schema constraints are always enforced.

### D-011: Native date input for v1

**Date:** 2026-02-15
**Spec section:** §3.6
**Decision:** The styled layer renders dates with native `<input type="date">`. Custom date pickers should use the `custom` extension point.
**Rationale:** Native date inputs are accessible, keyboard-navigable, and work on mobile. Custom date pickers are scope creep for v0.1.

### D-012: SetteraRenderer is sugar over composable parts

**Date:** 2026-02-15
**Spec section:** §7.1
**Decision:** The headless layer exposes composable primitives (`<SetteraSidebar>`, `<SetteraContent>`, `<SetteraSearch>`, `<SetteraSettingRow>`). `<SetteraRenderer>` composes them into a default layout.
**Rationale:** Developers who need control over layout can use the parts directly instead of fighting a monolithic component. The convenience wrapper handles the common case.

### D-013: Monorepo tooling

**Date:** 2026-02-15
**Spec section:** §11
**Decision:** pnpm workspaces + Turborepo.
**Rationale:** pnpm handles dependency linking. Turborepo adds build caching and task orchestration without Nx's complexity. Most common setup for TypeScript library monorepos.

### D-014: tsup for bundling

**Date:** 2026-02-15
**Spec section:** §11
**Decision:** tsup (wraps esbuild) for library builds. Dual CJS + ESM output, `.d.ts` generation.
**Rationale:** Vite is for applications. Rollup requires more configuration. tsup provides sensible library defaults with minimal config.

### D-015: Testing strategy

**Date:** 2026-02-15
**Spec section:** N/A (implementation concern)
**Decision:** Vitest for unit tests, React Testing Library for component integration, Playwright for keyboard navigation e2e.
**Rationale:** Vitest is fast and native ESM. RTL tests behavior over implementation. Playwright provides real browser testing for keyboard nav, which is the highest-risk feature.

### D-016: No animations in v0.1

**Date:** 2026-02-15
**Spec section:** N/A (styling concern)
**Decision:** Static transitions. No animations for show/hide, modal open/close, or search filtering.
**Rationale:** Animation is easy to add, hard to remove. Adding transitions later is a non-breaking change. Shipping animations now creates API surface (duration props, disable flags) that's hard to walk back.

### D-017: Tablet breakpoint behavior

**Date:** 2026-02-15
**Spec section:** §8.3
**Decision:** Tablets in portrait orientation (e.g., iPad at 768px) receive the mobile layout. The breakpoint is configurable via the styled layer.
**Rationale:** The sidebar is too narrow at this width to be useful alongside content. Better to give tablets the full-screen drill-down navigation.

---

## Template for Future Decisions

```
### D-NNN: [Short title]

**Date:** YYYY-MM-DD
**Spec section:** §X.Y
**Decision:** [What was decided]
**Rationale:** [Why this choice was made]
```
