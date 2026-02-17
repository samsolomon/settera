import React, { useCallback } from "react";
import * as Switch from "@radix-ui/react-switch";
import { useSetteraSetting } from "@settera/react";
import { useFocusVisible } from "../hooks/useFocusVisible.js";

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
  const { isFocusVisible, focusVisibleProps } = useFocusVisible();

  const checked = Boolean(value);
  const isDangerous = "dangerous" in definition && definition.dangerous;

  const handleCheckedChange = useCallback(
    (nextChecked: boolean) => {
      setValue(nextChecked);
    },
    [setValue],
  );

  const trackColor = checked
    ? isDangerous
      ? "var(--settera-switch-dangerous-color, #dc2626)"
      : "var(--settera-switch-active-color, #2563eb)"
    : "var(--settera-switch-inactive-color, #d1d5db)";

  return (
    <Switch.Root
      checked={checked}
      onCheckedChange={handleCheckedChange}
      aria-label={definition.title}
      {...focusVisibleProps}
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
      <Switch.Thumb
        style={{
          display: "block",
          width: "var(--settera-switch-thumb-size, 20px)",
          height: "var(--settera-switch-thumb-size, 20px)",
          borderRadius: "50%",
          backgroundColor: "var(--settera-switch-thumb-color, white)",
          transition: "transform 0.2s",
          transform: checked ? "translateX(22px)" : "translateX(2px)",
          boxShadow: "0 1px 3px rgba(0,0,0,0.2)",
        }}
      />
    </Switch.Root>
  );
}
