import React, { useCallback, useRef, useState } from "react";
import { useSettaraAction } from "@settara/react";

export interface ActionButtonProps {
  settingKey: string;
}

/**
 * A button for action-type settings.
 * Delegates to useSettaraAction for handler resolution and loading state.
 */
export function ActionButton({ settingKey }: ActionButtonProps) {
  const { definition, onAction, isLoading } = useSettaraAction(settingKey);
  const [isFocusVisible, setIsFocusVisible] = useState(false);

  const isDangerous = "dangerous" in definition && definition.dangerous;
  const buttonLabel =
    definition.type === "action" ? definition.buttonLabel : "Action";

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

  return (
    <button
      onClick={onAction}
      onPointerDown={handlePointerDown}
      onFocus={handleFocus}
      onBlur={handleBlur}
      disabled={!onAction || isLoading}
      aria-label={definition.title}
      aria-busy={isLoading}
      style={{
        fontSize: "var(--settara-button-font-size, 14px)",
        fontWeight: "var(--settara-button-font-weight, 500)",
        padding: "var(--settara-button-padding, 6px 16px)",
        borderRadius: "var(--settara-button-border-radius, 6px)",
        border: isDangerous
          ? "1px solid var(--settara-dangerous-color, #dc2626)"
          : "var(--settara-button-border, 1px solid #d1d5db)",
        outline: "none",
        boxShadow: isFocusVisible
          ? "0 0 0 2px var(--settara-focus-ring-color, #93c5fd)"
          : "none",
        color: isDangerous
          ? "var(--settara-dangerous-color, #dc2626)"
          : "var(--settara-button-color, #374151)",
        backgroundColor: isDangerous
          ? "var(--settara-button-dangerous-bg, #fef2f2)"
          : "var(--settara-button-bg, white)",
        cursor: !onAction || isLoading ? "not-allowed" : "pointer",
        opacity: isLoading ? 0.7 : 1,
        transition: "opacity 0.2s",
      }}
    >
      {isLoading ? "Loading…" : buttonLabel}
    </button>
  );
}
