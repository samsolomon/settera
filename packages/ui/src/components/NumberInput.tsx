import React, { useCallback, useRef, useState } from "react";
import { useSetteraSetting } from "@settera/react";

export interface NumberInputProps {
  settingKey: string;
}

/**
 * A number input for number settings.
 * Empty string → setValue(undefined). Valid number → setValue(Number(value)). NaN → ignored.
 */
export function NumberInput({ settingKey }: NumberInputProps) {
  const { value, setValue, error, definition, validate } =
    useSetteraSetting(settingKey);
  const [isFocusVisible, setIsFocusVisible] = useState(false);

  const isDangerous = "dangerous" in definition && definition.dangerous;
  const isNumber = definition.type === "number";
  const placeholder = isNumber ? definition.placeholder : undefined;
  const min =
    isNumber && definition.validation?.min !== undefined
      ? definition.validation.min
      : undefined;
  const max =
    isNumber && definition.validation?.max !== undefined
      ? definition.validation.max
      : undefined;

  const handleChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const raw = e.target.value;
      if (raw === "") {
        setValue(undefined);
        return;
      }
      const num = Number(raw);
      if (!Number.isNaN(num)) {
        setValue(num);
      }
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

  // Display value: number → string, undefined/null → ""
  const displayValue =
    value !== undefined && value !== null ? String(value) : "";

  return (
    <input
      type="number"
      value={displayValue}
      onChange={handleChange}
      onBlur={handleBlur}
      onPointerDown={handlePointerDown}
      onFocus={handleFocus}
      placeholder={placeholder}
      min={min}
      max={max}
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
