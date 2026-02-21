# Theming & Customization

Settera uses CSS custom properties (`--settera-*` tokens) for theming. Set tokens on a parent element to customize colors, spacing, typography, and sizing. No dark mode is built in — override the tokens to create any theme.

## Applying a Theme

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

## Dark Mode

Dark mode is just a different set of token values. Use a CSS class, media query, or any mechanism you prefer:

```css
.dark {
  --settera-foreground: #f9fafb;
  --settera-background: #111827;
  --settera-card: #1f2937;
  --settera-card-foreground: #e5e7eb;
  --settera-border: #374151;
  --settera-input: #4b5563;
  --settera-muted: #1f2937;
  --settera-muted-foreground: #9ca3af;
  --settera-primary: #60a5fa;
  --settera-primary-foreground: #111827;
  --settera-destructive: #f87171;
  --settera-ring: #3b82f6;
  --settera-sidebar-background: #0f172a;
  --settera-sidebar-foreground: #e2e8f0;
  --settera-sidebar-accent: #1e293b;
  --settera-sidebar-muted-foreground: #94a3b8;
  --settera-sidebar-border-color: #334155;
}
```

## `@settera/ui` vs `@settera/shadcn-registry`

Both packages use `--settera-*` tokens, but apply them differently:

| | `@settera/ui` | `@settera/shadcn-registry` |
| --- | --- | --- |
| **Styling** | Inline styles exclusively | Tailwind classes + selective inline styles |
| **Token usage** | All colors, spacing, and sizing go through `var()` in inline styles | Standard styling uses Tailwind; tokens via inline `style` for consumer-customizable values |
| **What tokens control** | Everything — colors, borders, shadows, spacing, typography, radii | Consumer-facing overrides — content max-width, page padding, heading sizes, control width |
| **Customization** | Override any visual with tokens | Override tokens for layout/sizing; use Tailwind's theming for standard styles |

## Core Tokens

These semantic tokens form the foundation. Most component-level tokens derive from these, so overriding a core token cascades through the entire UI.

| Token | Default | Purpose |
| --- | --- | --- |
| `--settera-foreground` | `#111827` | Primary text color |
| `--settera-background` | `#f9fafb` | Page background |
| `--settera-card` | `#ffffff` | Card/surface background |
| `--settera-card-foreground` | `#374151` | Text on card backgrounds |
| `--settera-border` | `#e5e7eb` | Default border color |
| `--settera-input` | `#d1d5db` | Input borders and muted elements |
| `--settera-muted` | `#f4f4f5` | Muted background (hover states, tags) |
| `--settera-muted-foreground` | `#6b7280` | Secondary/muted text |
| `--settera-primary` | `#2563eb` | Primary action color |
| `--settera-primary-foreground` | `#ffffff` | Text on primary backgrounds |
| `--settera-destructive` | `#dc2626` | Error/destructive color |
| `--settera-destructive-foreground` | `#ffffff` | Text on destructive backgrounds |
| `--settera-ring` | `#93c5fd` | Focus ring color |
| `--settera-success-color` | `#16a34a` | Saved/success indicator color |

## Layout Tokens

| Token | Default | Purpose |
| --- | --- | --- |
| `--settera-content-max-width` | `640px` | Max width of settings content area |
| `--settera-sidebar-width` | `280px` | Sidebar width on desktop |
| `--settera-input-width` | `200px` | Input/select control width on desktop |
| `--settera-control-width` | `200px` | Control width (shadcn variant) |
| `--settera-page-padding` | `24px 32px` | Content area padding |
| `--settera-page-padding-mobile` | `16px` | Content area padding on mobile |

## Typography Tokens

| Token | Default | Purpose |
| --- | --- | --- |
| `--settera-font-family` | System font stack | Base font family |
| `--settera-title-font-size` | `14px` | Setting title size |
| `--settera-title-font-weight` | `500` | Setting title weight |
| `--settera-description-font-size` | `13px` | Description text size |
| `--settera-section-title-font-size` | `16px` | Section heading size |
| `--settera-section-title-font-weight` | `600` | Section heading weight |
| `--settera-page-title-font-size` | `20px` | Page heading size |
| `--settera-input-font-size` | `14px` | Input text size |

## Spacing Tokens

| Token | Default | Purpose |
| --- | --- | --- |
| `--settera-space-50` | `4px` | Extra small spacing |
| `--settera-space-75` | `6px` | Small spacing |
| `--settera-space-100` | `8px` | Base spacing unit |
| `--settera-space-125` | `10px` | Medium spacing |
| `--settera-section-margin-top` | `24px` | Top margin between sections |
| `--settera-section-title-margin-bottom` | `8px` | Space below section headings |

## Border Radius Tokens

| Token | Default | Purpose |
| --- | --- | --- |
| `--settera-input-border-radius` | `4px` | Inputs and selects |
| `--settera-card-border-radius` | `8px` | Cards and panels |
| `--settera-button-border-radius` | `4px` | Buttons |
| `--settera-dialog-border-radius` | `8px` | Modals and dialogs |
| `--settera-sidebar-item-radius` | `8px` | Sidebar navigation items |

## Component Tokens

Beyond the core tokens, individual components expose their own tokens for fine-grained control. These all fall back to core tokens, so you only need to set them when you want a component to differ from the base theme.

### Sidebar

| Token | Default | Purpose |
| --- | --- | --- |
| `--settera-sidebar-background` | `#fafafa` | Sidebar background |
| `--settera-sidebar-foreground` | `#18181b` | Sidebar text |
| `--settera-sidebar-muted-foreground` | `#71717a` | Sidebar muted text |
| `--settera-sidebar-border-color` | `#e4e4e7` | Sidebar border |
| `--settera-sidebar-accent` | `#f4f4f5` | Sidebar active/hover background |
| `--settera-sidebar-accent-foreground` | `#18181b` | Sidebar active text |

### Switch

| Token | Default | Purpose |
| --- | --- | --- |
| `--settera-switch-active-color` | `var(--settera-primary)` | Checked switch background |
| `--settera-switch-inactive-color` | `var(--settera-input)` | Unchecked switch background |
| `--settera-switch-thumb-color` | `#ffffff` | Switch thumb |
| `--settera-switch-width` | `44px` | Switch width |
| `--settera-switch-height` | `24px` | Switch height |

### Checkbox

| Token | Default | Purpose |
| --- | --- | --- |
| `--settera-checkbox-bg` | `var(--settera-card)` | Unchecked background |
| `--settera-checkbox-checked-bg` | `#18181b` | Checked background |
| `--settera-checkbox-indicator-color` | `#ffffff` | Checkmark color |
| `--settera-checkbox-size` | `16px` | Checkbox dimensions |

### Dialog

| Token | Default | Purpose |
| --- | --- | --- |
| `--settera-dialog-bg` | `var(--settera-popover)` | Dialog background |
| `--settera-dialog-shadow` | `0 20px 60px rgba(0,0,0,0.15)` | Dialog shadow |
| `--settera-dialog-max-width` | `640px` | Action modal max width |
| `--settera-confirm-max-width` | `420px` | Confirm dialog max width |
| `--settera-overlay-bg` | `rgba(0,0,0,0.5)` | Backdrop overlay |

### Other

| Token | Default | Purpose |
| --- | --- | --- |
| `--settera-highlight-color` | `#f59e0b` | Deep-link highlight flash |
| `--settera-disabled-opacity` | `0.5` | Disabled element opacity |
| `--settera-z-overlay` | `1000` | Overlay z-index |
| `--settera-z-dialog` | `1001` | Dialog z-index |
