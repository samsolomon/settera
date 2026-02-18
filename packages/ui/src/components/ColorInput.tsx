import React, { useCallback, useState } from "react";
import { useSetteraSetting } from "@settera/react";

export interface ColorInputProps {
  settingKey: string;
}

/**
 * A native color picker for color settings.
 * Commits on change. Runs async validation on blur.
 */
export function ColorInput({ settingKey }: ColorInputProps) {
  const { value, setValue, error, definition, validate } =
    useSetteraSetting(settingKey);
  const [isFocused, setIsFocused] = useState(false);

  const isDisabled =
    "disabled" in definition && Boolean(definition.disabled);
  const hasError = error !== null;

  const handleChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      setValue(e.target.value);
    },
    [setValue],
  );

  const handleBlur = useCallback(() => {
    setIsFocused(false);
    validate();
  }, [validate]);

  const handleFocus = useCallback(() => {
    setIsFocused(true);
  }, []);

  return (
    <input
      type="color"
      value={typeof value === "string" ? value : "#000000"}
      onChange={handleChange}
      onBlur={handleBlur}
      onFocus={handleFocus}
      disabled={isDisabled}
      aria-label={definition.title}
      aria-invalid={hasError}
      aria-describedby={hasError ? `settera-error-${settingKey}` : undefined}
      style={{
        border: "none",
        padding: 0,
        width: 40,
        height: 32,
        cursor: isDisabled ? "not-allowed" : "pointer",
        opacity: isDisabled ? 0.5 : 1,
        borderRadius: 4,
        outline: isFocused
          ? "2px solid var(--settera-focus-ring-color, #3b82f6)"
          : "none",
        outlineOffset: 2,
      }}
    />
  );
}
