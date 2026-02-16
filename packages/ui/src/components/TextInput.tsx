import React, { useCallback, useRef, useState } from "react";
import { useSetteraSetting } from "@settera/react";

export interface TextInputProps {
  settingKey: string;
}

/**
 * A text input for text settings.
 * Fires onChange on every keystroke (no debounce).
 * Runs async validation on blur via validate().
 */
export function TextInput({ settingKey }: TextInputProps) {
  const { value, setValue, error, definition, validate } =
    useSetteraSetting(settingKey);
  const [isFocusVisible, setIsFocusVisible] = useState(false);

  const isDangerous = "dangerous" in definition && definition.dangerous;
  const isText = definition.type === "text";
  const inputType =
    isText && definition.inputType ? definition.inputType : "text";
  const placeholder = isText ? definition.placeholder : undefined;
  const maxLength =
    isText && definition.validation?.maxLength !== undefined
      ? definition.validation.maxLength
      : undefined;

  const handleChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      setValue(e.target.value);
    },
    [setValue],
  );

  const handleBlur = useCallback(() => {
    setIsFocusVisible(false);
    validate();
  }, [validate]);

  const pointerDownRef = useRef(false);

  const handlePointerDown = useCallback(() => {
    pointerDownRef.current = true;
  }, []);

  const handleFocus = useCallback(() => {
    setIsFocusVisible(!pointerDownRef.current);
    pointerDownRef.current = false;
  }, []);

  const hasError = error !== null;

  return (
    <input
      type={inputType}
      value={typeof value === "string" ? value : ""}
      onChange={handleChange}
      onBlur={handleBlur}
      onPointerDown={handlePointerDown}
      onFocus={handleFocus}
      placeholder={placeholder}
      maxLength={maxLength}
      aria-label={definition.title}
      aria-invalid={hasError}
      aria-describedby={hasError ? `settera-error-${settingKey}` : undefined}
      style={{
        fontSize: "var(--settera-input-font-size, 14px)",
        padding: "var(--settera-input-padding, 6px 10px)",
        borderRadius: "var(--settera-input-border-radius, 6px)",
        border: hasError
          ? "1px solid var(--settera-error-color, #dc2626)"
          : "var(--settera-input-border, 1px solid #d1d5db)",
        outline: "none",
        boxShadow: isFocusVisible
          ? "0 0 0 2px var(--settera-focus-ring-color, #93c5fd)"
          : "none",
        width: "var(--settera-input-width, 200px)",
        color: isDangerous
          ? "var(--settera-dangerous-color, #dc2626)"
          : "var(--settera-input-color, #111827)",
        backgroundColor: "var(--settera-input-bg, white)",
      }}
    />
  );
}
