# Theming & Customization

Settera uses CSS custom properties (`--settera-*` tokens) for theming. Set tokens on a parent element to customize colors, spacing, typography, and sizing. No dark mode is built in — override the tokens to create any theme.

All token defaults are defined in a centralized registry (`UI_TOKENS` in `@settera/schema`). The `token()` helper is used internally by `@settera/ui` to generate `var(--settera-<name>, <fallback>)` strings from this registry.

## Applying a theme

Set `--settera-*` properties on any ancestor element. Tokens cascade, so you can scope a theme to a container or apply it globally:

```css
/* Global theme */
:root {
  --settera-primary: #7c3aed;
  --settera-foreground: #1e1b4b;
  --settera-background: #faf5ff;
}

/* Scoped to a container */
.settings-container {
  --settera-primary: #059669;
  --settera-card: #f0fdf4;
}
```

```tsx
<div className="settings-container">
  <Settera schema={schema} values={values} onChange={handleChange}>
    <SetteraLayout />
  </Settera>
</div>
```

## Dark mode

Dark mode is just a different set of token values. Override the tier 1 core tokens plus sidebar tokens for full coverage. Use a CSS class, media query, or any mechanism you prefer:

```css
.dark {
  /* Core surfaces */
  --settera-foreground: #f9fafb;
  --settera-background: #111827;
  --settera-card: #1f2937;
  --settera-card-foreground: #e5e7eb;
  --settera-border: #374151;
  --settera-input: #4b5563;
  --settera-muted: #1f2937;
  --settera-muted-foreground: #9ca3af;

  /* Popover / dialog */
  --settera-popover: #1f2937;
  --settera-popover-foreground: #f9fafb;

  /* Interactive */
  --settera-primary: #60a5fa;
  --settera-primary-foreground: #111827;
  --settera-destructive: #f87171;
  --settera-ring: #3b82f6;

  /* Sidebar */
  --settera-sidebar-background: #0f172a;
  --settera-sidebar-foreground: #e2e8f0;
  --settera-sidebar-accent: #1e293b;
  --settera-sidebar-accent-foreground: #f8fafc;
  --settera-sidebar-muted-foreground: #94a3b8;
  --settera-sidebar-border-color: #334155;

  /* Checkbox */
  --settera-checkbox-checked-bg: #e2e8f0;
  --settera-checkbox-indicator-color: #111827;

  /* Mobile */
  --settera-mobile-overlay-bg: rgba(0, 0, 0, 0.6);
}
```

## `@settera/ui` vs `@settera/shadcn-registry`

Both packages use `--settera-*` tokens, but apply them differently:

| | `@settera/ui` | `@settera/shadcn-registry` |
| --- | --- | --- |
| **Styling** | Inline styles exclusively | Tailwind classes + selective inline styles |
| **Token count** | ~160 tokens | 14 tokens |
| **Token usage** | All colors, spacing, and sizing go through `token()` in inline styles | Standard styling uses Tailwind; tokens via inline `style` for consumer-customizable values |
| **What tokens control** | Everything — colors, borders, shadows, spacing, typography, radii | Consumer-facing overrides — content max-width, page padding, heading sizes, control width |
| **Customization** | Override any visual with tokens | Override tokens for layout/sizing; use Tailwind's theming for standard styles |
| **Token overlap** | `success-color`, `content-max-width`, `page-padding`, `page-padding-mobile`, `page-title-font-size`, `section-title-font-size`, `section-scroll-margin-top` | Same — these 7 tokens are shared between both packages |

## `@settera/ui` token reference

Tokens are organized in tiers by how commonly they need to be overridden. Most consumers only need tier 1. All defaults use `rem` for font sizes, spacing, padding, radii, and dimensions. Border widths (`1px`), shadows, and z-indices stay as `px`/unitless.

### Tier 1 — Core semantic colors

These cascade into most component tokens. Overriding one changes everything downstream.

| Token | Default | Purpose |
| --- | --- | --- |
| `--settera-foreground` | `#111827` | Primary text color |
| `--settera-background` | `#f9fafb` | Page background |
| `--settera-card` | `white` | Card/surface background |
| `--settera-card-foreground` | `#374151` | Text on card backgrounds |
| `--settera-border` | `#e5e7eb` | Default border color |
| `--settera-input` | `#d1d5db` | Input borders and muted elements |
| `--settera-muted` | `#f4f4f5` | Muted background (hover states, tags) |
| `--settera-muted-foreground` | `#6b7280` | Secondary/muted text |
| `--settera-primary` | `#2563eb` | Primary action color (switch, buttons) |
| `--settera-primary-foreground` | `white` | Text on primary backgrounds |
| `--settera-destructive` | `#dc2626` | Error/destructive color |
| `--settera-destructive-foreground` | `white` | Text on destructive backgrounds |
| `--settera-ring` | `#93c5fd` | Focus ring color |
| `--settera-popover` | `white` | Dialog/popover background |
| `--settera-popover-foreground` | `#111827` | Dialog/popover text |
| `--settera-success-color` | `#16a34a` | Saved/success indicator color |

### Tier 2 — Layout & typography

| Token | Default | Purpose |
| --- | --- | --- |
| `--settera-font-family` | System font stack | Base font family |
| `--settera-content-max-width` | `640px` | Max width of settings content area |
| `--settera-sidebar-width` | `17.5rem` | Sidebar width on desktop |
| `--settera-input-width` | `12.5rem` | Input/select control width on desktop |
| `--settera-page-padding` | `1.5rem 2rem` | Content area padding |
| `--settera-page-padding-mobile` | `1rem` | Content area padding on mobile |
| `--settera-page-title-font-size` | `1.25rem` | Page heading size |
| `--settera-page-title-color` | `var(--settera-foreground)` | Page heading color |
| `--settera-section-title-font-size` | `1rem` | Section heading size |
| `--settera-section-title-font-weight` | `600` | Section heading weight |
| `--settera-section-title-color` | `var(--settera-foreground)` | Section heading color |
| `--settera-section-title-margin-bottom` | `0.5rem` | Space below section headings |
| `--settera-section-margin-top` | `1.5rem` | Top margin between sections |
| `--settera-title-font-size` | `0.875rem` | Setting title size |
| `--settera-title-font-weight` | `500` | Setting title weight |
| `--settera-description-font-size` | `0.8125rem` | Description text size |
| `--settera-input-font-size` | `0.875rem` | Input text size |
| `--settera-space-50` | `0.25rem` | Extra small spacing |
| `--settera-space-75` | `0.375rem` | Small spacing |
| `--settera-space-100` | `0.5rem` | Base spacing unit |
| `--settera-space-125` | `0.625rem` | Medium spacing |

### Tier 3 — Component tokens

These fall back to core tokens, so you only need them when you want a component to differ from the base theme.

#### Input

| Token | Default | Purpose |
| --- | --- | --- |
| `--settera-input-bg` | `var(--settera-card)` | Input background |
| `--settera-input-color` | `var(--settera-foreground)` | Input text color |
| `--settera-input-border` | `1px solid var(--settera-input)` | Input border |
| `--settera-input-border-radius` | `0.25rem` | Input border radius |
| `--settera-input-padding` | `0.375rem 0.625rem` | Input padding |

#### Button

| Token | Default | Purpose |
| --- | --- | --- |
| `--settera-button-bg` | `var(--settera-card)` | Default button background |
| `--settera-button-color` | `var(--settera-card-foreground)` | Default button text |
| `--settera-button-border` | `1px solid var(--settera-input)` | Default button border |
| `--settera-button-border-radius` | `0.25rem` | Button border radius |
| `--settera-button-font-size` | `0.875rem` | Button text size |
| `--settera-button-font-weight` | `500` | Button text weight |
| `--settera-button-padding` | `0.375rem 1rem` | Button padding |
| `--settera-button-primary-bg` | `var(--settera-primary)` | Primary button background |
| `--settera-button-primary-color` | `var(--settera-primary-foreground)` | Primary button text |
| `--settera-button-secondary-bg` | `var(--settera-card)` | Secondary button background |
| `--settera-button-secondary-color` | `var(--settera-card-foreground)` | Secondary button text |
| `--settera-button-dangerous-bg` | `#fef2f2` | Dangerous button background |
| `--settera-button-dangerous-color` | `var(--settera-destructive-foreground)` | Dangerous button text |

#### Switch

| Token | Default | Purpose |
| --- | --- | --- |
| `--settera-switch-active-color` | `var(--settera-primary)` | Checked switch background |
| `--settera-switch-inactive-color` | `var(--settera-input)` | Unchecked switch background |
| `--settera-switch-dangerous-color` | `var(--settera-destructive)` | Dangerous switch background |
| `--settera-switch-thumb-color` | `white` | Switch thumb |
| `--settera-switch-thumb-shadow` | `0 1px 3px rgba(0,0,0,0.2)` | Switch thumb shadow |
| `--settera-switch-width` | `2.75rem` | Switch width |
| `--settera-switch-height` | `1.5rem` | Switch height |
| `--settera-switch-border-radius` | `0.75rem` | Switch border radius |
| `--settera-switch-thumb-size` | `1.25rem` | Thumb diameter |
| `--settera-switch-border` | `1px solid transparent` | Switch border |

#### Checkbox

| Token | Default | Purpose |
| --- | --- | --- |
| `--settera-checkbox-bg` | `var(--settera-card)` | Unchecked background |
| `--settera-checkbox-checked-bg` | `#18181b` | Checked background |
| `--settera-checkbox-indicator-color` | `#ffffff` | Checkmark color |
| `--settera-checkbox-border` | `1px solid var(--settera-input)` | Unchecked border |
| `--settera-checkbox-checked-border` | `1px solid var(--settera-checkbox-checked-bg)` | Checked border |
| `--settera-checkbox-border-radius` | `0.25rem` | Border radius |
| `--settera-checkbox-size` | `1rem` | Checkbox dimensions |
| `--settera-checkbox-gap` | `0.5rem` | Gap between checkbox and label |
| `--settera-checkbox-shadow` | `0 1px 2px rgba(0,0,0,0.05)` | Checkbox shadow |

#### Select

| Token | Default | Purpose |
| --- | --- | --- |
| `--settera-select-trigger-bg` | `var(--settera-input-bg)` | Trigger background |
| `--settera-select-content-bg` | `var(--settera-input-bg)` | Dropdown background |
| `--settera-select-content-border` | `var(--settera-input-border)` | Dropdown border |
| `--settera-select-content-radius` | `var(--settera-input-border-radius)` | Dropdown border radius |
| `--settera-select-content-shadow` | `0 12px 28px rgba(0,0,0,0.12)` | Dropdown shadow |
| `--settera-select-item-highlight-bg` | `var(--settera-muted)` | Highlighted item background |
| `--settera-select-item-radius` | `0.25rem` | Item border radius |
| `--settera-select-item-padding` | `0.375rem 0.5rem` | Item padding |
| `--settera-select-item-font-size` | `0.8125rem` | Item text size |
| `--settera-select-item-color` | `var(--settera-input-color)` | Item text color |
| `--settera-select-item-muted-color` | `var(--settera-muted-foreground)` | Placeholder item color |
| `--settera-select-icon-color` | `var(--settera-muted-foreground)` | Chevron icon color |
| `--settera-select-min-width` | `10rem` | Minimum trigger width |

#### Dialog / modal

| Token | Default | Purpose |
| --- | --- | --- |
| `--settera-dialog-bg` | `var(--settera-popover)` | Dialog background |
| `--settera-dialog-border-radius` | `0.5rem` | Dialog border radius |
| `--settera-dialog-padding` | `1rem` | Dialog padding |
| `--settera-dialog-shadow` | `0 20px 60px rgba(0,0,0,0.15)` | Dialog shadow |
| `--settera-dialog-max-width` | `640px` | Action modal max width |
| `--settera-confirm-max-width` | `420px` | Confirm dialog max width |
| `--settera-dialog-title-color` | `var(--settera-popover-foreground)` | Dialog title color |
| `--settera-dialog-title-font-size` | `1.125rem` | Dialog title size |
| `--settera-dialog-title-font-weight` | `600` | Dialog title weight |
| `--settera-dialog-message-color` | `var(--settera-muted-foreground)` | Dialog message color |
| `--settera-dialog-message-font-size` | `0.875rem` | Dialog message size |
| `--settera-dialog-label-color` | `var(--settera-muted-foreground)` | Dialog label color |
| `--settera-dialog-label-font-size` | `0.8125rem` | Dialog label size |
| `--settera-overlay-bg` | `rgba(0,0,0,0.5)` | Backdrop overlay |

### Tier 4 — Fine-grained tokens

For maximum control over individual elements. Most users will never need these.

#### Card / panel

| Token | Default | Purpose |
| --- | --- | --- |
| `--settera-card-bg` | `var(--settera-card)` | Card background |
| `--settera-card-border` | `1px solid var(--settera-border)` | Card border |
| `--settera-card-border-radius` | `0.5rem` | Card border radius |
| `--settera-page-bg` | `var(--settera-background)` | Main content background |

#### Setting row

| Token | Default | Purpose |
| --- | --- | --- |
| `--settera-title-color` | `var(--settera-foreground)` | Setting title color |
| `--settera-description-color` | `var(--settera-muted-foreground)` | Description text color |
| `--settera-row-border` | `1px solid var(--settera-border)` | Row divider |
| `--settera-row-padding-inline` | `0 1rem` | Row horizontal padding |
| `--settera-row-padding-block` | `0.75rem 0` | Row vertical padding |
| `--settera-row-opacity` | `1` | Row opacity |
| `--settera-row-focus-radius` | `0.5rem` | Row focus ring radius |

#### States

| Token | Default | Purpose |
| --- | --- | --- |
| `--settera-focus-ring-color` | `var(--settera-ring)` | Focus ring color |
| `--settera-error-color` | `var(--settera-destructive)` | Error text color |
| `--settera-error-font-size` | `0.8125rem` | Error text size |
| `--settera-dangerous-color` | `var(--settera-destructive)` | Dangerous element color |
| `--settera-disabled-opacity` | `0.5` | Disabled element opacity |
| `--settera-highlight-color` | `#f59e0b` | Deep-link highlight flash |
| `--settera-ghost-hover-bg` | `#f4f4f5` | Ghost hover background |
| `--settera-ghost-hover-color` | `var(--settera-foreground)` | Ghost hover text |

#### Save status

| Token | Default | Purpose |
| --- | --- | --- |
| `--settera-save-indicator-font-size` | `0.75rem` | Indicator text size |
| `--settera-save-saving-color` | `var(--settera-muted-foreground)` | "Saving..." color |
| `--settera-save-saved-color` | `#16a34a` | "Saved" color |
| `--settera-save-error-color` | `var(--settera-destructive)` | "Save failed" color |
| `--settera-copy-link-color` | `var(--settera-muted-foreground)` | Copy link icon color |

#### Sidebar

| Token | Default | Purpose |
| --- | --- | --- |
| `--settera-sidebar-bg` | `var(--settera-sidebar-background)` | Sidebar background (shorthand) |
| `--settera-sidebar-background` | `var(--settera-background, #fafafa)` | Sidebar background |
| `--settera-sidebar-foreground` | `var(--settera-foreground, #3f3f46)` | Sidebar text |
| `--settera-sidebar-muted-foreground` | `var(--settera-muted-foreground, #71717a)` | Sidebar muted text |
| `--settera-sidebar-border` | `1px solid var(--settera-sidebar-border-color)` | Sidebar right border |
| `--settera-sidebar-border-color` | `var(--settera-border, #e4e4e7)` | Sidebar border color |
| `--settera-sidebar-accent` | `rgba(0,0,0,0.05)` | Active item background |
| `--settera-sidebar-accent-hover` | `#f4f4f5` | Hovered item background |
| `--settera-sidebar-accent-foreground` | `var(--settera-foreground)` | Active item text |
| `--settera-sidebar-font-size` | `0.875rem` | Sidebar font size |
| `--settera-sidebar-padding` | `0.75rem` | Sidebar container padding |
| `--settera-sidebar-gap` | `0.625rem` | Gap between sidebar sections |
| `--settera-sidebar-item-gap` | `0.5rem` | Gap between icon and label |
| `--settera-sidebar-item-height` | `2.125rem` | Min item height |
| `--settera-sidebar-item-padding` | `0.375rem 0.5rem` | Item padding |
| `--settera-sidebar-item-list-gap` | `0.125rem` | Gap between items |
| `--settera-sidebar-item-radius` | `0.5rem` | Item border radius |
| `--settera-sidebar-item-color` | `var(--settera-sidebar-foreground)` | Item text color |
| `--settera-sidebar-active-bg` | `var(--settera-sidebar-accent)` | Active item background |
| `--settera-sidebar-active-color` | `var(--settera-sidebar-accent-foreground)` | Active item text |
| `--settera-sidebar-hover-bg` | `var(--settera-sidebar-accent-hover)` | Hover item background |
| `--settera-sidebar-icon-color` | `var(--settera-sidebar-muted-foreground)` | Icon color |
| `--settera-sidebar-group-color` | `var(--settera-sidebar-muted-foreground)` | Group label color |
| `--settera-sidebar-group-spacing` | `0.75rem` | Top margin for group labels |
| `--settera-sidebar-chevron-color` | `#9ca3af` | Expand/collapse chevron |
| `--settera-sidebar-sub-margin` | `1rem` | Nested list left margin |
| `--settera-sidebar-sub-padding` | `0.5rem` | Nested list left padding |
| `--settera-sidebar-sub-border` | `1px solid var(--settera-sidebar-border-color)` | Nested list left border |
| `--settera-sidebar-sub-gap` | `1px` | Gap between nested items |
| `--settera-sidebar-back-bg` | `transparent` | Back button background |
| `--settera-sidebar-back-hover-bg` | `var(--settera-ghost-hover-bg)` | Back button hover bg |
| `--settera-sidebar-back-color` | `var(--settera-description-color)` | Back button text |
| `--settera-sidebar-back-margin-bottom` | `0px` | Back button bottom margin |
| `--settera-sidebar-input-bg` | `transparent` | Search input background |

#### Search

| Token | Default | Purpose |
| --- | --- | --- |
| `--settera-search-bg` | `var(--settera-sidebar-input-bg)` | Search background |
| `--settera-search-color` | `var(--settera-sidebar-foreground)` | Search text color |
| `--settera-search-placeholder-color` | `var(--settera-sidebar-muted-foreground)` | Placeholder color |
| `--settera-search-font-size` | `0.8125rem` | Search font size |
| `--settera-search-border` | `1px solid var(--settera-input)` | Search border |
| `--settera-search-border-radius` | `0.5rem` | Search border radius |
| `--settera-search-input-padding` | `0.5rem 0.625rem` | Search input padding |
| `--settera-search-margin` | `0 0 0.25rem 0` | Search container margin |

#### Keyboard hints

| Token | Default | Purpose |
| --- | --- | --- |
| `--settera-kbd-font-size` | `0.75rem` | Kbd text size |
| `--settera-kbd-color` | `var(--settera-sidebar-muted-foreground)` | Kbd text color |
| `--settera-kbd-bg` | `var(--settera-sidebar-accent)` | Kbd background |
| `--settera-kbd-border` | `1px solid var(--settera-sidebar-border-color)` | Kbd border |
| `--settera-kbd-border-radius` | `0.25rem` | Kbd border radius |

#### Multiselect / compound

| Token | Default | Purpose |
| --- | --- | --- |
| `--settera-multiselect-gap` | `0.375rem` | Gap between checkboxes |
| `--settera-compound-gap` | `0.625rem` | Gap between compound fields |

#### Mobile

| Token | Default | Purpose |
| --- | --- | --- |
| `--settera-mobile-topbar-height` | `3.25rem` | Mobile header height |
| `--settera-mobile-topbar-bg` | `var(--settera-background)` | Mobile header background |
| `--settera-mobile-topbar-border` | `1px solid var(--settera-border)` | Mobile header border |
| `--settera-mobile-menu-bg` | `transparent` | Hamburger button background |
| `--settera-mobile-menu-border` | `none` | Hamburger button border |
| `--settera-mobile-menu-color` | `var(--settera-foreground)` | Hamburger icon color |
| `--settera-mobile-drawer-width` | `min(85vw, 320px)` | Drawer width |
| `--settera-mobile-drawer-bg` | `var(--settera-background)` | Drawer background |
| `--settera-mobile-drawer-border` | `1px solid var(--settera-input)` | Drawer right border |
| `--settera-mobile-drawer-shadow` | `0 16px 40px rgba(0,0,0,0.18)` | Drawer shadow |
| `--settera-mobile-overlay-bg` | `rgba(17,24,39,0.45)` | Mobile backdrop overlay |
| `--settera-breadcrumb-muted` | `var(--settera-muted-foreground)` | Breadcrumb inactive color |
| `--settera-breadcrumb-current` | `var(--settera-foreground)` | Breadcrumb current color |

#### Z-index

| Token | Default | Purpose |
| --- | --- | --- |
| `--settera-z-overlay` | `1000` | Overlay z-index |
| `--settera-z-dialog` | `1001` | Dialog z-index |

## `@settera/shadcn-registry` token reference

The shadcn registry uses Tailwind for most styling. Tokens are only used for values consumers are likely to customize:

| Token | Default | Purpose |
| --- | --- | --- |
| `--settera-success-color` | `#16a34a` | Save/check icon color |
| `--settera-control-width` | `200px` | Desktop input/select width |
| `--settera-content-max-width` | `640px` | Content area max width |
| `--settera-page-padding` | `1.5rem 2rem` | Content padding (desktop) |
| `--settera-page-padding-mobile` | `1rem` | Content padding (mobile) |
| `--settera-page-padding-bottom` | `4rem` | Content bottom padding (desktop) |
| `--settera-page-padding-bottom-mobile` | `3rem` | Content bottom padding (mobile) |
| `--settera-page-title-font-size` | `1.5rem` | Page heading size |
| `--settera-section-title-font-size` | `1rem` | Section heading size |
| `--settera-section-title-gap` | `0.75rem` | Gap below section title |
| `--settera-section-gap` | `1.5rem` | Gap between sections |
| `--settera-subsection-gap` | `1.5rem` | Gap between subsections |
| `--settera-section-scroll-margin-top` | `1.5rem` | Scroll margin for anchoring |
| `--settera-subpage-title-font-size` | `1rem` | Subpage heading size |
