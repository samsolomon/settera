import React, { useCallback, useRef, useState } from "react";
import { token } from "@settera/schema";

/** System font stack used as the concrete fallback for portaled content. */
export const SETTERA_SYSTEM_FONT = token("font-family");

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
  fontSize: token("input-font-size"),
  padding: token("input-padding"),
  borderRadius: token("input-border-radius"),
  width: token("input-width"),
  backgroundColor: token("input-bg"),
  outline: "none",
};

export const buttonBaseStyle: React.CSSProperties = {
  fontSize: token("button-font-size"),
  fontWeight: token("button-font-weight"),
  padding: token("button-padding"),
  borderRadius: token("button-border-radius"),
  backgroundColor: token("button-bg"),
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
          ? `1px solid ${token("error-color")}`
          : token("input-border"),
        boxShadow: focusVisible
          ? `0 0 0 2px ${token("focus-ring-color")}`
          : "none",
        color: isDestructive
          ? token("dangerous-color")
          : token("input-color"),
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
    ? token("disabled-opacity")
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
          ? `1px solid ${token("dangerous-color")}`
          : token("button-border"),
        boxShadow: showFocusRing
          ? `0 0 0 2px ${token("focus-ring-color")}`
          : "none",
        color: isDestructive
          ? token("dangerous-color")
          : token("button-color"),
        backgroundColor: isDestructive
          ? token("button-dangerous-bg")
          : token("button-bg"),
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
  gap: token("space-75"),
  border: "none",
  borderRadius: token("sidebar-item-radius"),
  padding: `${token("space-75")} ${token("space-125")}`,
  fontSize: token("button-font-size"),
  fontWeight: token("button-font-weight"),
  color: token("sidebar-back-color"),
  fontFamily: "inherit",
  transition: "background-color 120ms ease",
  marginLeft: `calc(-1 * ${token("space-125")})`,
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
      color: token("sidebar-chevron-color"),
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
    ? token("sidebar-back-hover-bg")
    : token("sidebar-back-bg");

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
