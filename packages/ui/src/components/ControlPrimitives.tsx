import React from "react";

interface ControlInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  hasError: boolean;
  isDangerous: boolean;
  isFocusVisible: boolean;
}

export const ControlInput = React.forwardRef<
  HTMLInputElement,
  ControlInputProps
>(function ControlInput(
  { hasError, isDangerous, isFocusVisible, style, ...props },
  ref,
) {
  return (
    <input
      {...props}
      ref={ref}
      data-slot="input"
      data-invalid={hasError ? "true" : undefined}
      data-dangerous={isDangerous ? "true" : undefined}
      style={{
        fontSize: "var(--settera-input-font-size, 14px)",
        padding: "var(--settera-input-padding, 6px 10px)",
        borderRadius: "var(--settera-input-border-radius, 6px)",
        border: hasError
          ? "1px solid var(--settera-error-color, #dc2626)"
          : "var(--settera-input-border, 1px solid #d1d5db)",
        outline: "none",
        boxShadow: isFocusVisible
          ? "0 0 0 2px var(--settera-focus-ring-color, #93c5fd)"
          : "none",
        width: "var(--settera-input-width, 200px)",
        color: isDangerous
          ? "var(--settera-dangerous-color, #dc2626)"
          : "var(--settera-input-color, #111827)",
        backgroundColor: "var(--settera-input-bg, white)",
        ...style,
      }}
    />
  );
});

interface ControlButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  isDangerous: boolean;
  isFocusVisible: boolean;
}

export const ControlButton = React.forwardRef<
  HTMLButtonElement,
  ControlButtonProps
>(function ControlButton(
  { isDangerous, isFocusVisible, style, ...props },
  ref,
) {
  return (
    <button
      {...props}
      ref={ref}
      data-slot="button"
      data-dangerous={isDangerous ? "true" : undefined}
      style={{
        fontSize: "var(--settera-button-font-size, 14px)",
        fontWeight: "var(--settera-button-font-weight, 500)",
        padding: "var(--settera-button-padding, 6px 16px)",
        borderRadius: "var(--settera-button-border-radius, 6px)",
        border: isDangerous
          ? "1px solid var(--settera-dangerous-color, #dc2626)"
          : "var(--settera-button-border, 1px solid #d1d5db)",
        outline: "none",
        boxShadow: isFocusVisible
          ? "0 0 0 2px var(--settera-focus-ring-color, #93c5fd)"
          : "none",
        color: isDangerous
          ? "var(--settera-dangerous-color, #dc2626)"
          : "var(--settera-button-color, #374151)",
        backgroundColor: isDangerous
          ? "var(--settera-button-dangerous-bg, #fef2f2)"
          : "var(--settera-button-bg, white)",
        transition: "opacity 0.2s",
        ...style,
      }}
    />
  );
});
