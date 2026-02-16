import React, { useCallback, useRef, useState } from "react";
import { useSetteraAction } from "@settera/react";
import { ControlButton } from "./ControlPrimitives.js";

export interface ActionButtonProps {
  settingKey: string;
}

/**
 * A button for action-type settings.
 * Delegates to useSetteraAction for handler resolution and loading state.
 */
export function ActionButton({ settingKey }: ActionButtonProps) {
  const { definition, onAction, isLoading } = useSetteraAction(settingKey);
  const [isFocusVisible, setIsFocusVisible] = useState(false);

  const isDangerous =
    "dangerous" in definition && Boolean(definition.dangerous);
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
    <ControlButton
      type="button"
      onClick={onAction}
      onPointerDown={handlePointerDown}
      onFocus={handleFocus}
      onBlur={handleBlur}
      disabled={!onAction || isLoading}
      aria-label={definition.title}
      aria-busy={isLoading}
      isDangerous={isDangerous}
      isFocusVisible={isFocusVisible}
      style={{
        cursor: !onAction || isLoading ? "not-allowed" : "pointer",
        opacity: isLoading ? 0.7 : 1,
      }}
    >
      {isLoading ? "Loading…" : buttonLabel}
    </ControlButton>
  );
}
