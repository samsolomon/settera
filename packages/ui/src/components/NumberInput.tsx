import React, { useCallback, useEffect, useRef, useState } from "react";
import { useSetteraSetting } from "@settera/react";

export interface NumberInputProps {
  settingKey: string;
}

function displayString(v: unknown): string {
  return v !== undefined && v !== null ? String(v) : "";
}

/**
 * A number input for number settings.
 * Buffers edits locally. Commits on blur or Enter. Reverts on Escape.
 */
export function NumberInput({ settingKey }: NumberInputProps) {
  const { value, setValue, error, definition, validate } =
    useSetteraSetting(settingKey);
  const [isFocusVisible, setIsFocusVisible] = useState(false);

  const [localValue, setLocalValue] = useState(displayString(value));
  const localValueRef = useRef(localValue);
  const isFocusedRef = useRef(false);

  // Sync from external value when not focused
  useEffect(() => {
    if (!isFocusedRef.current) {
      const synced = displayString(value);
      localValueRef.current = synced;
      setLocalValue(synced);
    }
  }, [value]);

  const commit = useCallback(() => {
    const local = localValueRef.current;
    if (local === "") {
      const current = displayString(value);
      if (local !== current) {
        setValue(undefined);
      }
      validate(undefined);
    } else {
      const num = Number(local);
      if (!Number.isNaN(num)) {
        if (num !== value) {
          setValue(num);
        }
        validate(num);
      }
      // NaN → skip commit entirely
    }
  }, [value, setValue, validate]);

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
      localValueRef.current = e.target.value;
      setLocalValue(e.target.value);
    },
    [],
  );

  const handleBlur = useCallback(() => {
    setIsFocusVisible(false);
    isFocusedRef.current = false;
    commit();
  }, [commit]);

  const pointerDownRef = useRef(false);

  const handlePointerDown = useCallback(() => {
    pointerDownRef.current = true;
  }, []);

  const handleFocus = useCallback(() => {
    isFocusedRef.current = true;
    setIsFocusVisible(!pointerDownRef.current);
    pointerDownRef.current = false;
  }, []);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLInputElement>) => {
      if (e.key === "Enter") {
        commit();
      } else if (e.key === "Escape") {
        const current = displayString(value);
        localValueRef.current = current;
        setLocalValue(current);
      }
    },
    [commit, value],
  );

  const hasError = error !== null;

  return (
    <input
      type="number"
      value={localValue}
      onChange={handleChange}
      onBlur={handleBlur}
      onPointerDown={handlePointerDown}
      onFocus={handleFocus}
      onKeyDown={handleKeyDown}
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
