/**
 * Centralized token registry for @settera CSS custom properties.
 *
 * `UI_TOKENS` holds canonical defaults for every `--settera-*` token used by
 * `@settera/ui`. `SHADCN_TOKENS` holds the smaller set used by the shadcn
 * registry. The `token()` helper builds a `var(--settera-<name>, <fallback>)`
 * string suitable for use in inline styles.
 */

// ---------------------------------------------------------------------------
// UI tokens — canonical defaults for @settera/ui (~160 entries)
// ---------------------------------------------------------------------------
//
// Keys are token names WITHOUT the `--settera-` prefix.
// Values are the fallback used in var() expressions.
//
// Nested var() cascades appear as-is (e.g. "var(--settera-card, white)").
// Units use rem for font sizes, spacing, padding, radii, and dimensions.
// Border widths (1px), box-shadow offsets/blurs, and z-indices stay as px/unitless.

export const UI_TOKENS: Record<string, string> = {
  // ── Core semantic colors ──────────────────────────────────────────────
  "foreground": "#111827",
  "background": "#f9fafb",
  "card": "white",
  "card-foreground": "#374151",
  "border": "#e5e7eb",
  "input": "#d1d5db",
  "muted": "#f4f4f5",
  "muted-foreground": "#6b7280",
  "primary": "#2563eb",
  "primary-foreground": "white",
  "destructive": "#dc2626",
  "destructive-foreground": "white",
  "ring": "#93c5fd",
  "popover": "white",
  "popover-foreground": "#111827",
  "success-color": "#16a34a",

  // ── Font family ───────────────────────────────────────────────────────
  "font-family":
    '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',

  // ── Layout ────────────────────────────────────────────────────────────
  "content-max-width": "640px",
  "sidebar-width": "17.5rem",
  "input-width": "12.5rem",
  "page-padding": "1.5rem 2rem",
  "page-padding-mobile": "1rem",
  "mobile-topbar-height": "3.25rem",
  "mobile-drawer-width": "min(85vw, 320px)",

  // ── Z-index ───────────────────────────────────────────────────────────
  "z-overlay": "1000",
  "z-dialog": "1001",

  // ── Page title ────────────────────────────────────────────────────────
  "page-title-color": "var(--settera-foreground, #111827)",
  "page-title-font-size": "1.25rem",
  "page-bg": "var(--settera-background, #f9fafb)",

  // ── Section title ─────────────────────────────────────────────────────
  "section-title-color": "var(--settera-foreground, #111827)",
  "section-title-font-size": "1rem",
  "section-title-font-weight": "600",
  "section-title-margin-bottom": "0.5rem",
  "section-margin-top": "1.5rem",
  "section-scroll-margin-top": "1.5rem",

  // ── Setting row ───────────────────────────────────────────────────────
  "title-color": "var(--settera-foreground, #111827)",
  "title-font-size": "0.875rem",
  "title-font-weight": "500",
  "description-color": "var(--settera-muted-foreground, #6b7280)",
  "description-font-size": "0.8125rem",
  "row-border": "1px solid var(--settera-border, #e5e7eb)",
  "row-padding-inline": "0 1rem",
  "row-padding-block": "0.75rem 0",
  "row-opacity": "1",
  "row-focus-radius": "0.5rem",

  // ── Card / panel ──────────────────────────────────────────────────────
  "card-bg": "var(--settera-card, white)",
  "card-border": "1px solid var(--settera-border, #e5e7eb)",
  "card-border-radius": "0.5rem",

  // ── Input ─────────────────────────────────────────────────────────────
  "input-bg": "var(--settera-card, white)",
  "input-color": "var(--settera-foreground, #111827)",
  "input-border": "1px solid var(--settera-input, #d1d5db)",
  "input-border-color": "var(--settera-input, #d1d5db)",
  "input-border-radius": "0.25rem",
  "input-font-size": "0.875rem",
  "input-padding": "0.375rem 0.625rem",

  // ── Button ────────────────────────────────────────────────────────────
  "button-bg": "var(--settera-card, white)",
  "button-color": "var(--settera-card-foreground, #374151)",
  "button-border": "1px solid var(--settera-input, #d1d5db)",
  "button-border-color": "var(--settera-input, #d1d5db)",
  "button-border-radius": "0.25rem",
  "button-font-size": "0.875rem",
  "button-font-weight": "500",
  "button-padding": "0.375rem 1rem",
  "button-primary-bg": "var(--settera-primary, #2563eb)",
  "button-primary-color": "var(--settera-primary-foreground, white)",
  "button-secondary-bg": "var(--settera-card, white)",
  "button-secondary-color": "var(--settera-card-foreground, #374151)",
  "button-dangerous-bg": "#fef2f2",
  "button-dangerous-color": "var(--settera-destructive-foreground, white)",

  // ── Focus / ring ──────────────────────────────────────────────────────
  "focus-ring-color": "var(--settera-ring, #93c5fd)",

  // ── Errors / states ───────────────────────────────────────────────────
  "error-color": "var(--settera-destructive, #dc2626)",
  "error-font-size": "0.8125rem",
  "dangerous-color": "var(--settera-destructive, #dc2626)",
  "disabled-opacity": "0.5",
  "highlight-color": "#f59e0b",

  // ── Save status ───────────────────────────────────────────────────────
  "save-indicator-font-size": "0.75rem",
  "save-saving-color": "var(--settera-muted-foreground, #6b7280)",
  "save-saved-color": "#16a34a",
  "save-error-color": "var(--settera-destructive, #dc2626)",

  // ── Copy link ─────────────────────────────────────────────────────────
  "copy-link-color": "var(--settera-muted-foreground, #9ca3af)",

  // ── Ghost / hover ─────────────────────────────────────────────────────
  "ghost-hover-bg": "#f4f4f5",
  "ghost-hover-color": "var(--settera-foreground, #18181b)",

  // ── Spacing scale ─────────────────────────────────────────────────────
  "space-50": "0.25rem",
  "space-75": "0.375rem",
  "space-100": "0.5rem",
  "space-125": "0.625rem",

  // ── Sidebar ───────────────────────────────────────────────────────────
  "sidebar-bg":
    "var(--settera-sidebar-background, var(--settera-background, #fafafa))",
  "sidebar-background": "var(--settera-background, #fafafa)",
  "sidebar-foreground": "var(--settera-foreground, #3f3f46)",
  "sidebar-muted-foreground": "var(--settera-muted-foreground, #71717a)",
  "sidebar-border":
    "1px solid var(--settera-sidebar-border-color, var(--settera-border, #e4e4e7))",
  "sidebar-border-color": "var(--settera-border, #e4e4e7)",
  "sidebar-accent": "rgba(0, 0, 0, 0.05)",
  "sidebar-accent-hover": "#f4f4f5",
  "sidebar-accent-foreground": "var(--settera-foreground, #18181b)",
  "sidebar-font-size": "0.875rem",
  "sidebar-padding": "0.75rem",
  "sidebar-gap": "0.625rem",
  "sidebar-item-gap": "0.5rem",
  "sidebar-item-height": "2.125rem",
  "sidebar-item-padding": "0.375rem 0.5rem",
  "sidebar-item-list-gap": "0.125rem",
  "sidebar-item-radius": "0.5rem",
  "sidebar-item-color":
    "var(--settera-sidebar-foreground, var(--settera-foreground, #3f3f46))",
  "sidebar-active-bg":
    "var(--settera-sidebar-accent, var(--settera-muted, #f4f4f5))",
  "sidebar-active-color":
    "var(--settera-sidebar-accent-foreground, var(--settera-foreground, #18181b))",
  "sidebar-hover-bg":
    "var(--settera-sidebar-accent-hover, #f4f4f5)",
  "sidebar-icon-color":
    "var(--settera-sidebar-muted-foreground, var(--settera-muted-foreground, #71717a))",
  "sidebar-group-color":
    "var(--settera-sidebar-muted-foreground, var(--settera-muted-foreground, #71717a))",
  "sidebar-group-spacing": "0.75rem",
  "sidebar-chevron-color": "#9ca3af",
  "sidebar-sub-margin": "1rem",
  "sidebar-sub-padding": "0.5rem",
  "sidebar-sub-border":
    "1px solid var(--settera-sidebar-border-color, var(--settera-border, #e4e4e7))",
  "sidebar-sub-gap": "1px",
  "sidebar-back-bg": "transparent",
  "sidebar-back-hover-bg": "var(--settera-ghost-hover-bg, #f4f4f5)",
  "sidebar-back-color":
    "var(--settera-description-color, var(--settera-muted-foreground, #6b7280))",
  "sidebar-back-margin-bottom": "0px",
  "sidebar-input-bg": "transparent",

  // ── Search ────────────────────────────────────────────────────────────
  "search-bg": "var(--settera-sidebar-input-bg, transparent)",
  "search-color": "var(--settera-sidebar-foreground, #3f3f46)",
  "search-placeholder-color": "var(--settera-sidebar-muted-foreground, #9ca3af)",
  "search-font-size": "0.8125rem",
  "search-border": "1px solid var(--settera-input, #d1d5db)",
  "search-border-radius": "0.5rem",
  "search-input-padding": "0.5rem 0.625rem",
  "search-margin": "0 0 0.25rem 0",

  // ── Kbd ───────────────────────────────────────────────────────────────
  "kbd-font-size": "0.75rem",
  "kbd-color": "var(--settera-sidebar-muted-foreground, #9ca3af)",
  "kbd-bg": "var(--settera-sidebar-accent, rgba(0, 0, 0, 0.05))",
  "kbd-border":
    "1px solid var(--settera-sidebar-border-color, rgba(0, 0, 0, 0.08))",
  "kbd-border-radius": "0.25rem",

  // ── Select ────────────────────────────────────────────────────────────
  "select-min-width": "10rem",
  "select-trigger-bg":
    "var(--settera-input-bg, var(--settera-card, white))",
  "select-content-bg":
    "var(--settera-input-bg, var(--settera-card, white))",
  "select-content-border":
    "var(--settera-input-border, 1px solid var(--settera-input, #d1d5db))",
  "select-content-radius":
    "var(--settera-input-border-radius, 0.25rem)",
  "select-content-shadow": "0 12px 28px rgba(0, 0, 0, 0.12)",
  "select-item-highlight-bg": "var(--settera-muted, #f4f4f5)",
  "select-item-radius": "0.25rem",
  "select-item-padding": "0.375rem 0.5rem",
  "select-item-font-size": "0.8125rem",
  "select-item-color":
    "var(--settera-input-color, var(--settera-foreground, #111827))",
  "select-item-muted-color": "var(--settera-muted-foreground, #6b7280)",
  "select-icon-color": "var(--settera-muted-foreground, #6b7280)",

  // ── Checkbox ──────────────────────────────────────────────────────────
  "checkbox-bg": "var(--settera-card, #ffffff)",
  "checkbox-checked-bg": "var(--settera-primary, #2563eb)",
  "checkbox-indicator-color": "var(--settera-primary-foreground, white)",
  "checkbox-border": "1px solid var(--settera-input, #d1d5db)",
  "checkbox-checked-border":
    "1px solid var(--settera-checkbox-checked-bg, var(--settera-primary, #2563eb))",
  "checkbox-border-radius": "0.25rem",
  "checkbox-size": "1rem",
  "checkbox-gap": "0.5rem",
  "checkbox-shadow": "0 1px 2px rgba(0, 0, 0, 0.05)",

  // ── Switch ────────────────────────────────────────────────────────────
  "switch-active-color": "var(--settera-primary, #2563eb)",
  "switch-inactive-color": "var(--settera-input, #d1d5db)",
  "switch-dangerous-color": "var(--settera-destructive, #dc2626)",
  "switch-border": "1px solid transparent",
  "switch-width": "2.75rem",
  "switch-height": "1.5rem",
  "switch-border-radius": "0.75rem",
  "switch-thumb-size": "1.25rem",
  "switch-thumb-color": "white",
  "switch-thumb-shadow": "0 1px 3px rgba(0,0,0,0.2)",

  // ── Multiselect ───────────────────────────────────────────────────────
  "multiselect-gap": "0.375rem",

  // ── Compound ──────────────────────────────────────────────────────────
  "compound-gap": "0.625rem",

  // ── Dialog / Modal ────────────────────────────────────────────────────
  "dialog-bg": "var(--settera-popover, white)",
  "dialog-border-radius": "0.5rem",
  "dialog-padding": "1rem",
  "dialog-shadow": "0 20px 60px rgba(0, 0, 0, 0.15)",
  "dialog-max-width": "640px",
  "dialog-title-color": "var(--settera-popover-foreground, #111827)",
  "dialog-title-font-size": "1.125rem",
  "dialog-title-font-weight": "600",
  "dialog-message-color": "var(--settera-muted-foreground, #6b7280)",
  "dialog-message-font-size": "0.875rem",
  "dialog-label-color": "var(--settera-muted-foreground, #6b7280)",
  "dialog-label-font-size": "0.8125rem",
  "confirm-max-width": "420px",
  "overlay-bg": "rgba(0, 0, 0, 0.5)",

  // ── Mobile ────────────────────────────────────────────────────────────
  "mobile-topbar-bg": "var(--settera-background, #f9fafb)",
  "mobile-topbar-border": "1px solid var(--settera-border, #e5e7eb)",
  "mobile-menu-bg": "transparent",
  "mobile-menu-border": "none",
  "mobile-menu-color": "var(--settera-foreground, #111827)",
  "mobile-drawer-bg": "var(--settera-background, #f9fafb)",
  "mobile-drawer-border": "1px solid var(--settera-input, #d1d5db)",
  "mobile-drawer-shadow": "0 16px 40px rgba(0, 0, 0, 0.18)",
  "mobile-overlay-bg": "rgba(17, 24, 39, 0.45)",

  // ── Breadcrumb ────────────────────────────────────────────────────────
  "breadcrumb-muted": "var(--settera-muted-foreground, #6b7280)",
  "breadcrumb-current": "var(--settera-foreground, #111827)",
};

// ---------------------------------------------------------------------------
// shadcn-registry tokens — the 14 tokens used by @settera/shadcn-registry
// ---------------------------------------------------------------------------

export const SHADCN_TOKENS: Record<string, string> = {
  "success-color": "#16a34a",
  "page-title-font-size": "1.5rem",
  "control-width": "200px",
  "page-padding-mobile": "1rem",
  "page-padding": "1.5rem 2rem",
  "page-padding-bottom-mobile": "3rem",
  "page-padding-bottom": "4rem",
  "content-max-width": "640px",
  "subpage-title-font-size": "1rem",
  "subsection-gap": "1.5rem",
  "section-gap": "1.5rem",
  "section-scroll-margin-top": "1.5rem",
  "section-title-gap": "0.75rem",
  "section-title-font-size": "1rem",
};

// ---------------------------------------------------------------------------
// token() helper
// ---------------------------------------------------------------------------

/**
 * Returns `"var(--settera-<name>, <fallback>)"` using the canonical fallback
 * from `UI_TOKENS`. Dev-only console warning for unknown keys.
 *
 * @example
 *   token("input-font-size") // "var(--settera-input-font-size, 0.875rem)"
 */
export function token(name: string): string {
  const fallback = UI_TOKENS[name];

  if (fallback === undefined) {
    if (process.env.NODE_ENV !== "production") {
      console.warn(
        `[settera] Unknown token "${name}". ` +
          `Check UI_TOKENS in @settera/schema for available token names.`,
      );
    }
    return `var(--settera-${name})`;
  }

  return `var(--settera-${name}, ${fallback})`;
}
