import React, { useCallback } from "react";
import * as Switch from "@radix-ui/react-switch";
import { useSetteraSetting, useFocusVisible } from "@settera/react";
import { token } from "@settera/schema";

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
      ? token("switch-dangerous-color")
      : token("switch-active-color")
    : token("switch-inactive-color");

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
        width: token("switch-width"),
        height: token("switch-height"),
        borderRadius: token("switch-border-radius"),
        backgroundColor: trackColor,
        border: token("switch-border"),
        cursor: "pointer",
        padding: 0,
        transition: "background-color 200ms",
        outline: "none",
        boxShadow: isFocusVisible
          ? `0 0 0 2px ${token("focus-ring-color")}`
          : "none",
      }}
    >
      <Switch.Thumb
        data-slot="switch-thumb"
        style={{
          display: "block",
          width: token("switch-thumb-size"),
          height: token("switch-thumb-size"),
          borderRadius: "50%",
          backgroundColor: token("switch-thumb-color"),
          transition: "transform 200ms",
          transform: checked ? "translateX(22px)" : "translateX(2px)",
          boxShadow: token("switch-thumb-shadow"),
        }}
      />
    </Switch.Root>
  );
}
