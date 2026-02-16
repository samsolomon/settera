import React, { useCallback, useMemo, useRef, useState } from "react";
import { useSettaraSetting } from "@settara/react";

export interface MultiSelectProps {
  settingKey: string;
}

/**
 * A checkbox group for multiselect settings.
 * Runs both sync and async validation on change (commits immediately).
 */
export function MultiSelect({ settingKey }: MultiSelectProps) {
  const { value, setValue, error, definition, validate } =
    useSettaraSetting(settingKey);
  const [focusedIndex, setFocusedIndex] = useState<number | null>(null);

  const isDangerous = "dangerous" in definition && definition.dangerous;
  const options = definition.type === "multiselect" ? definition.options : [];
  const selectedValues = useMemo(
    () => (Array.isArray(value) ? (value as string[]) : []),
    [value],
  );

  const pointerDownRef = useRef(false);

  const handleChange = useCallback(
    (optionValue: string, checked: boolean) => {
      const newValue = checked
        ? [...selectedValues, optionValue]
        : selectedValues.filter((v) => v !== optionValue);
      setValue(newValue);
      validate(newValue);
    },
    [selectedValues, setValue, validate],
  );

  const handlePointerDown = useCallback(() => {
    pointerDownRef.current = true;
  }, []);

  const handleFocus = useCallback((index: number) => {
    if (!pointerDownRef.current) {
      setFocusedIndex(index);
    }
    pointerDownRef.current = false;
  }, []);

  const handleBlur = useCallback(() => {
    setFocusedIndex(null);
  }, []);

  const hasError = error !== null;

  return (
    <div
      data-testid={`multiselect-${settingKey}`}
      aria-invalid={hasError}
      aria-describedby={hasError ? `settara-error-${settingKey}` : undefined}
      style={{
        display: "flex",
        flexDirection: "column",
        gap: "var(--settara-multiselect-gap, 6px)",
      }}
    >
      {options.map((opt, index) => {
        const isChecked = selectedValues.includes(opt.value);
        const isFocused = focusedIndex === index;

        return (
          <label
            key={opt.value}
            style={{
              display: "flex",
              alignItems: "center",
              gap: "var(--settara-checkbox-gap, 8px)",
              fontSize: "var(--settara-input-font-size, 14px)",
              color: isDangerous
                ? "var(--settara-dangerous-color, #dc2626)"
                : "var(--settara-input-color, #111827)",
              cursor: "pointer",
            }}
          >
            <input
              type="checkbox"
              checked={isChecked}
              onChange={(e) => handleChange(opt.value, e.target.checked)}
              onPointerDown={handlePointerDown}
              onFocus={() => handleFocus(index)}
              onBlur={handleBlur}
              style={{
                outline: "none",
                boxShadow: isFocused
                  ? "0 0 0 2px var(--settara-focus-ring-color, #93c5fd)"
                  : "none",
                borderRadius: "var(--settara-checkbox-border-radius, 3px)",
                cursor: "pointer",
              }}
            />
            {opt.label}
          </label>
        );
      })}
    </div>
  );
}
