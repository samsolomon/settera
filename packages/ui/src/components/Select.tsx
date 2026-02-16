import React, { useCallback, useRef, useState } from "react";
import { useSettaraSetting } from "@settara/react";

export interface SelectProps {
  settingKey: string;
}

/**
 * A select dropdown for select settings.
 * Runs both sync and async validation on change (not blur),
 * since select commits value immediately on change.
 */
export function Select({ settingKey }: SelectProps) {
  const { value, setValue, error, definition, validate } =
    useSettaraSetting(settingKey);
  const [isFocusVisible, setIsFocusVisible] = useState(false);

  const isDangerous = "dangerous" in definition && definition.dangerous;
  const options = definition.type === "select" ? definition.options : [];
  const isRequired =
    definition.type === "select" && definition.validation?.required;

  const handleChange = useCallback(
    (e: React.ChangeEvent<HTMLSelectElement>) => {
      const newValue = e.target.value;
      setValue(newValue);
      // Run full validation on change for select (commits immediately).
      // Pass the new value explicitly to avoid stale-closure reads.
      validate(newValue);
    },
    [setValue, validate],
  );

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

  const hasError = error !== null;

  return (
    <select
      value={typeof value === "string" ? value : ""}
      onChange={handleChange}
      onPointerDown={handlePointerDown}
      onFocus={handleFocus}
      onBlur={handleBlur}
      aria-label={definition.title}
      aria-invalid={hasError}
      aria-describedby={hasError ? `settara-error-${settingKey}` : undefined}
      style={{
        fontSize: "var(--settara-input-font-size, 14px)",
        padding: "var(--settara-input-padding, 6px 10px)",
        borderRadius: "var(--settara-input-border-radius, 6px)",
        border: hasError
          ? "1px solid var(--settara-error-color, #dc2626)"
          : "var(--settara-input-border, 1px solid #d1d5db)",
        outline: "none",
        boxShadow: isFocusVisible
          ? "0 0 0 2px var(--settara-focus-ring-color, #93c5fd)"
          : "none",
        minWidth: "var(--settara-select-min-width, 160px)",
        color: isDangerous
          ? "var(--settara-dangerous-color, #dc2626)"
          : "var(--settara-input-color, #111827)",
        backgroundColor: "var(--settara-input-bg, white)",
        cursor: "pointer",
        appearance: "auto",
      }}
    >
      {!isRequired && <option value="">Select…</option>}
      {options.map((opt) => (
        <option key={opt.value} value={opt.value}>
          {opt.label}
        </option>
      ))}
    </select>
  );
}
