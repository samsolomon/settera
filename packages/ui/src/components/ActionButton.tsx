import React from "react";
import { useSetteraAction } from "@settera/react";
import { ControlButton } from "./ControlPrimitives.js";
import { useFocusVisible } from "../hooks/useFocusVisible.js";

export interface ActionButtonProps {
  settingKey: string;
}

/**
 * A button for action-type settings.
 * Delegates to useSetteraAction for handler resolution and loading state.
 */
export function ActionButton({ settingKey }: ActionButtonProps) {
  const { definition, onAction, isLoading } = useSetteraAction(settingKey);
  const { isFocusVisible, focusVisibleProps } = useFocusVisible();

  const isDangerous =
    "dangerous" in definition && Boolean(definition.dangerous);
  const buttonLabel =
    definition.type === "action" ? definition.buttonLabel : "Action";

  return (
    <ControlButton
      type="button"
      onClick={onAction}
      {...focusVisibleProps}
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
