import React from "react";

/** System font stack used as the concrete fallback for portaled content. */
export const SETTERA_SYSTEM_FONT =
  'var(--settera-font-family, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif)';

type PrimitiveTone = "default" | "destructive";

export interface PrimitiveInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  tone?: PrimitiveTone;
  invalid?: boolean;
  focusVisible?: boolean;
}

export interface PrimitiveButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  tone?: PrimitiveTone;
  focusVisible?: boolean;
}

export const inputBaseStyle: React.CSSProperties = {
  fontSize: "var(--settera-input-font-size, 14px)",
  padding: "var(--settera-input-padding, 6px 10px)",
  borderRadius: "var(--settera-input-border-radius, 6px)",
  width: "var(--settera-input-width, 200px)",
  backgroundColor: "var(--settera-input-bg, var(--settera-card, white))",
  outline: "none",
};

export const buttonBaseStyle: React.CSSProperties = {
  fontSize: "var(--settera-button-font-size, 14px)",
  fontWeight: "var(--settera-button-font-weight, 500)",
  padding: "var(--settera-button-padding, 6px 16px)",
  borderRadius: "var(--settera-button-border-radius, 6px)",
  backgroundColor: "var(--settera-button-bg, var(--settera-card, white))",
  transition: "opacity 0.2s",
  outline: "none",
};

export const PrimitiveInput = React.forwardRef<
  HTMLInputElement,
  PrimitiveInputProps
>(function PrimitiveInput(
  { tone = "default", invalid = false, focusVisible = false, style, ...props },
  ref,
) {
  const isDestructive = tone === "destructive";

  return (
    <input
      {...props}
      ref={ref}
      data-slot="input"
      data-invalid={invalid ? "true" : undefined}
      data-dangerous={isDestructive ? "true" : undefined}
      style={{
        ...inputBaseStyle,
        border: invalid
          ? "1px solid var(--settera-error-color, var(--settera-destructive, #dc2626))"
          : "var(--settera-input-border, 1px solid var(--settera-input, #d1d5db))",
        boxShadow: focusVisible
          ? "0 0 0 2px var(--settera-focus-ring-color, var(--settera-ring, #93c5fd))"
          : "none",
        color: isDestructive
          ? "var(--settera-dangerous-color, var(--settera-destructive, #dc2626))"
          : "var(--settera-input-color, var(--settera-foreground, #111827))",
        ...style,
      }}
    />
  );
});

export const PrimitiveButton = React.forwardRef<
  HTMLButtonElement,
  PrimitiveButtonProps
>(function PrimitiveButton(
  { tone = "default", focusVisible = false, style, ...props },
  ref,
) {
  const isDestructive = tone === "destructive";

  return (
    <button
      {...props}
      ref={ref}
      data-slot="button"
      data-dangerous={isDestructive ? "true" : undefined}
      style={{
        ...buttonBaseStyle,
        border: isDestructive
          ? "1px solid var(--settera-dangerous-color, var(--settera-destructive, #dc2626))"
          : "var(--settera-button-border, 1px solid var(--settera-input, #d1d5db))",
        boxShadow: focusVisible
          ? "0 0 0 2px var(--settera-focus-ring-color, var(--settera-ring, #93c5fd))"
          : "none",
        color: isDestructive
          ? "var(--settera-dangerous-color, var(--settera-destructive, #dc2626))"
          : "var(--settera-button-color, var(--settera-card-foreground, #374151))",
        backgroundColor: isDestructive
          ? "var(--settera-button-dangerous-bg, #fef2f2)"
          : "var(--settera-button-bg, var(--settera-card, white))",
        ...style,
      }}
    />
  );
});
