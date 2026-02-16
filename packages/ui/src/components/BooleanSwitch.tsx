import React, { useCallback, useRef, useState } from "react";
import { useSetteraSetting } from "@settera/react";

export interface BooleanSwitchProps {
  settingKey: string;
}

/**
 * A toggle switch for boolean settings.
 * Uses role="switch" and aria-checked for accessibility.
 * Toggles on click and Space key.
 */
export function BooleanSwitch({ settingKey }: BooleanSwitchProps) {
  const { value, setValue, definition } = useSetteraSetting(settingKey);
  const [isFocusVisible, setIsFocusVisible] = useState(false);

  const checked = Boolean(value);
  const isDangerous = "dangerous" in definition && definition.dangerous;

  const handleClick = useCallback(() => {
    setValue(!checked);
  }, [setValue, checked]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === " ") {
        e.preventDefault();
        setValue(!checked);
      }
    },
    [setValue, checked],
  );

  // Track keyboard-driven focus for visible focus ring.
  // onPointerDown fires before onFocus for mouse clicks, so we use a ref
  // to reliably distinguish pointer focus from keyboard focus.
  const pointerDownRef = useRef(false);

  const handlePointerDown = useCallback(() => {
    pointerDownRef.current = true;
  }, []);

  const handleFocus = useCallback(() => {
    setIsFocusVisible(!pointerDownRef.current);
    pointerDownRef.current = false;
  }, []);

  const handleBlur = useCallback(() => {
    setIsFocusVisible(false);
  }, []);

  const trackColor = checked
    ? isDangerous
      ? "var(--settera-switch-dangerous-color, #dc2626)"
      : "var(--settera-switch-active-color, #2563eb)"
    : "var(--settera-switch-inactive-color, #d1d5db)";

  return (
    <button
      role="switch"
      aria-checked={checked}
      aria-label={definition.title}
      onClick={handleClick}
      onKeyDown={handleKeyDown}
      onPointerDown={handlePointerDown}
      onFocus={handleFocus}
      onBlur={handleBlur}
      style={{
        position: "relative",
        display: "inline-flex",
        alignItems: "center",
        width: "var(--settera-switch-width, 44px)",
        height: "var(--settera-switch-height, 24px)",
        borderRadius: "var(--settera-switch-border-radius, 12px)",
        backgroundColor: trackColor,
        border: "none",
        cursor: "pointer",
        padding: 0,
        transition: "background-color 0.2s",
        outline: "none",
        boxShadow: isFocusVisible
          ? "0 0 0 2px var(--settera-focus-ring-color, #93c5fd)"
          : "none",
      }}
    >
      <span
        style={{
          position: "absolute",
          top: "2px",
          left: checked ? "22px" : "2px",
          width: "var(--settera-switch-thumb-size, 20px)",
          height: "var(--settera-switch-thumb-size, 20px)",
          borderRadius: "50%",
          backgroundColor: "var(--settera-switch-thumb-color, white)",
          transition: "left 0.2s",
          boxShadow: "0 1px 3px rgba(0,0,0,0.2)",
        }}
      />
    </button>
  );
}
