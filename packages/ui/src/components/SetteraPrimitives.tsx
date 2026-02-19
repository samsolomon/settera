import React, { useCallback, useRef, useState } from "react";

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
  borderRadius: "var(--settera-input-border-radius, 4px)",
  width: "var(--settera-input-width, 200px)",
  backgroundColor: "var(--settera-input-bg, var(--settera-card, white))",
  outline: "none",
};

export const buttonBaseStyle: React.CSSProperties = {
  fontSize: "var(--settera-button-font-size, 14px)",
  fontWeight: "var(--settera-button-font-weight, 500)",
  padding: "var(--settera-button-padding, 6px 16px)",
  borderRadius: "var(--settera-button-border-radius, 4px)",
  backgroundColor: "var(--settera-button-bg, var(--settera-card, white))",
  transition: "opacity 200ms",
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
  {
    tone = "default",
    focusVisible = false,
    style,
    disabled,
    onMouseEnter,
    onMouseLeave,
    onPointerDown,
    onPointerUp,
    onFocus,
    onBlur,
    ...props
  },
  ref,
) {
  const isDestructive = tone === "destructive";
  const [isHovered, setIsHovered] = useState(false);
  const [isPressed, setIsPressed] = useState(false);
  const [isFocusVisible, setIsFocusVisible] = useState(false);
  const pointerDownRef = useRef(false);

  const handleMouseEnter = useCallback(
    (e: React.MouseEvent<HTMLButtonElement>) => {
      setIsHovered(true);
      onMouseEnter?.(e);
    },
    [onMouseEnter],
  );

  const handleMouseLeave = useCallback(
    (e: React.MouseEvent<HTMLButtonElement>) => {
      setIsHovered(false);
      setIsPressed(false);
      onMouseLeave?.(e);
    },
    [onMouseLeave],
  );

  const handlePointerDown = useCallback(
    (e: React.PointerEvent<HTMLButtonElement>) => {
      pointerDownRef.current = true;
      setIsPressed(true);
      onPointerDown?.(e);
    },
    [onPointerDown],
  );

  const handlePointerUp = useCallback(
    (e: React.PointerEvent<HTMLButtonElement>) => {
      setIsPressed(false);
      onPointerUp?.(e);
    },
    [onPointerUp],
  );

  const handleFocus = useCallback(
    (e: React.FocusEvent<HTMLButtonElement>) => {
      if (!pointerDownRef.current) {
        setIsFocusVisible(true);
      }
      pointerDownRef.current = false;
      onFocus?.(e);
    },
    [onFocus],
  );

  const handleBlur = useCallback(
    (e: React.FocusEvent<HTMLButtonElement>) => {
      setIsFocusVisible(false);
      onBlur?.(e);
    },
    [onBlur],
  );

  const showFocusRing = focusVisible || isFocusVisible;

  const resolvedOpacity = disabled
    ? "var(--settera-disabled-opacity, 0.5)"
    : isPressed
      ? 0.7
      : isHovered
        ? 0.85
        : 1;

  return (
    <button
      {...props}
      ref={ref}
      disabled={disabled}
      data-slot="button"
      data-dangerous={isDestructive ? "true" : undefined}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      onPointerDown={handlePointerDown}
      onPointerUp={handlePointerUp}
      onFocus={handleFocus}
      onBlur={handleBlur}
      style={{
        ...buttonBaseStyle,
        border: isDestructive
          ? "1px solid var(--settera-dangerous-color, var(--settera-destructive, #dc2626))"
          : "var(--settera-button-border, 1px solid var(--settera-input, #d1d5db))",
        boxShadow: showFocusRing
          ? "0 0 0 2px var(--settera-focus-ring-color, var(--settera-ring, #93c5fd))"
          : "none",
        color: isDestructive
          ? "var(--settera-dangerous-color, var(--settera-destructive, #dc2626))"
          : "var(--settera-button-color, var(--settera-card-foreground, #374151))",
        backgroundColor: isDestructive
          ? "var(--settera-button-dangerous-bg, #fef2f2)"
          : "var(--settera-button-bg, var(--settera-card, white))",
        opacity: resolvedOpacity,
        ...style,
      }}
    />
  );
});

// ---- BackButton ----

export interface BackButtonProps {
  children: React.ReactNode;
  onClick?: () => void;
  href?: string;
}

const backButtonBaseStyle: React.CSSProperties = {
  display: "inline-flex",
  alignItems: "center",
  gap: "var(--settera-space-75, 6px)",
  border: "none",
  borderRadius: "var(--settera-sidebar-item-radius, 8px)",
  padding: "var(--settera-space-75, 6px) var(--settera-space-125, 10px)",
  fontSize: "var(--settera-button-font-size, 14px)",
  fontWeight: "var(--settera-button-font-weight, 500)",
  color:
    "var(--settera-sidebar-back-color, var(--settera-description-color, var(--settera-muted-foreground, #6b7280)))",
  fontFamily: "inherit",
  transition: "background-color 120ms ease",
  marginLeft: "calc(-1 * var(--settera-space-125, 10px))",
  textDecoration: "none",
  cursor: "pointer",
};

const backButtonChevron = (
  <svg
    aria-hidden="true"
    width="16"
    height="16"
    viewBox="0 0 16 16"
    fill="none"
    style={{
      flexShrink: 0,
      color: "var(--settera-sidebar-chevron-color, #9ca3af)",
    }}
  >
    <path
      d="M10 4l-4 4 4 4"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

export function BackButton({ children, onClick, href }: BackButtonProps) {
  const [isHovered, setIsHovered] = useState(false);

  const bg = isHovered
    ? "var(--settera-sidebar-back-hover-bg, var(--settera-ghost-hover-bg, #f4f4f5))"
    : "var(--settera-sidebar-back-bg, transparent)";

  if (href && !onClick) {
    return (
      <a
        href={href}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        style={{
          ...backButtonBaseStyle,
          background: bg,
          boxSizing: "border-box",
        }}
      >
        {backButtonChevron}
        {children}
      </a>
    );
  }

  return (
    <button
      type="button"
      onClick={onClick}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      style={{
        ...backButtonBaseStyle,
        background: bg,
        textAlign: "left",
      }}
    >
      {backButtonChevron}
      {children}
    </button>
  );
}
