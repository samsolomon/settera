import React, { useCallback } from "react";
import * as Switch from "@radix-ui/react-switch";
import { useSetteraSetting, useFocusVisible } from "@settera/react";

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
  const isDisabled = "disabled" in definition && Boolean(definition.disabled);

  const handleCheckedChange = useCallback(
    (nextChecked: boolean) => {
      setValue(nextChecked);
    },
    [setValue],
  );

  const trackColor = checked
    ? isDangerous
      ? "var(--settera-switch-dangerous-color, var(--settera-destructive, #dc2626))"
      : "var(--settera-switch-active-color, var(--settera-primary, #2563eb))"
    : "var(--settera-switch-inactive-color, var(--settera-input, #d1d5db))";

  return (
    <Switch.Root
      data-slot="switch"
      checked={checked}
      onCheckedChange={handleCheckedChange}
      disabled={isDisabled}
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
        border: "var(--settera-switch-border, 1px solid transparent)",
        cursor: "pointer",
        padding: 0,
        transition: "background-color 200ms",
        outline: "none",
        boxShadow: isFocusVisible
          ? "0 0 0 2px var(--settera-focus-ring-color, var(--settera-ring, #93c5fd))"
          : "none",
      }}
    >
      <Switch.Thumb
        data-slot="switch-thumb"
        style={{
          display: "block",
          width: "var(--settera-switch-thumb-size, 20px)",
          height: "var(--settera-switch-thumb-size, 20px)",
          borderRadius: "50%",
          backgroundColor: "var(--settera-switch-thumb-color, white)",
          transition: "transform 200ms",
          transform: checked ? "translateX(22px)" : "translateX(2px)",
          boxShadow: "var(--settera-switch-thumb-shadow, 0 1px 3px rgba(0,0,0,0.2))",
        }}
      />
    </Switch.Root>
  );
}
