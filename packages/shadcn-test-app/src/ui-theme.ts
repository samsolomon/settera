import type React from "react";

export function getSetteraThemeVars(isDark: boolean): React.CSSProperties {
  if (isDark) {
    return {
      colorScheme: "dark",
      background: "#09090b",
      color: "#e4e4e7",
      "--settera-background": "#09090b",
      "--settera-foreground": "#f4f4f5",
      "--settera-card": "#18181b",
      "--settera-card-foreground": "#e4e4e7",
      "--settera-popover": "#18181b",
      "--settera-popover-foreground": "#f4f4f5",
      "--settera-muted": "#27272a",
      "--settera-muted-foreground": "#a1a1aa",
      "--settera-primary": "#f4f4f5",
      "--settera-primary-foreground": "#18181b",
      "--settera-destructive": "#dc2626",
      "--settera-destructive-foreground": "white",
      "--settera-border": "#27272a",
      "--settera-input": "#3f3f46",
      "--settera-ring": "rgba(161, 161, 170, 0.45)",
      "--settera-input-bg": "#09090b",
      "--settera-dialog-shadow": "0 20px 60px rgba(0, 0, 0, 0.4)",
      "--settera-sidebar-accent-hover": "#27272a",
    } as React.CSSProperties;
  }

  return {
    colorScheme: "light",
    background: "#ffffff",
    color: "#111827",
    "--settera-page-bg": "#ffffff",
    "--settera-sidebar-background": "#fafafa",
    "--settera-sidebar-foreground": "#18181b",
    "--settera-sidebar-muted-foreground": "#71717a",
    "--settera-sidebar-border-color": "#e4e4e7",
    "--settera-sidebar-accent": "#f4f4f5",
    "--settera-sidebar-accent-hover": "#f4f4f5",
    "--settera-sidebar-accent-foreground": "#18181b",
  } as React.CSSProperties;
}
