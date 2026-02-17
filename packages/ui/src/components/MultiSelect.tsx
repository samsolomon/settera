import React, { useCallback, useMemo, useRef, useState } from "react";
import * as Checkbox from "@radix-ui/react-checkbox";
import { useSetteraSetting } from "@settera/react";

export interface MultiSelectProps {
  settingKey: string;
}

/**
 * A checkbox group for multiselect settings.
 * Runs both sync and async validation on change (commits immediately).
 */
export function MultiSelect({ settingKey }: MultiSelectProps) {
  const { value, setValue, error, definition, validate } =
    useSetteraSetting(settingKey);
  const [focusedIndex, setFocusedIndex] = useState<number | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

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

  const handleCheckboxKeyDown = useCallback(
    (event: React.KeyboardEvent<HTMLButtonElement>) => {
      if (event.key !== "ArrowDown" && event.key !== "ArrowUp") return;

      const checkboxes = Array.from(
        containerRef.current?.querySelectorAll<HTMLElement>(
          '[role="checkbox"]',
        ) ?? [],
      );
      const currentIndex = checkboxes.indexOf(event.currentTarget);
      if (currentIndex === -1) return;

      const nextIndex =
        event.key === "ArrowDown" ? currentIndex + 1 : currentIndex - 1;
      if (nextIndex < 0 || nextIndex >= checkboxes.length) return;

      event.preventDefault();
      checkboxes[nextIndex].focus();
    },
    [],
  );

  const hasError = error !== null;

  return (
    <div
      ref={containerRef}
      data-testid={`multiselect-${settingKey}`}
      aria-invalid={hasError}
      aria-describedby={hasError ? `settera-error-${settingKey}` : undefined}
      style={{
        display: "flex",
        flexDirection: "column",
        gap: "var(--settera-multiselect-gap, 6px)",
      }}
    >
      {options.map((opt, index) => {
        const isChecked = selectedValues.includes(opt.value);
        const isFocused = focusedIndex === index;
        const checkboxId = `settera-multiselect-${settingKey}-${opt.value}`;

        return (
          <label
            key={opt.value}
            htmlFor={checkboxId}
            style={{
              display: "flex",
              alignItems: "center",
              gap: "var(--settera-checkbox-gap, 8px)",
              fontSize: "var(--settera-input-font-size, 14px)",
              color: isDangerous
                ? "var(--settera-dangerous-color, #dc2626)"
                : "var(--settera-input-color, #111827)",
              cursor: "pointer",
            }}
          >
            <Checkbox.Root
              id={checkboxId}
              checked={isChecked}
              onCheckedChange={(checked: boolean | "indeterminate") =>
                handleChange(opt.value, checked === true)
              }
              onPointerDown={handlePointerDown}
              onFocus={() => handleFocus(index)}
              onBlur={handleBlur}
              onKeyDown={handleCheckboxKeyDown}
              aria-label={opt.label}
              style={{
                width: "var(--settera-checkbox-size, 16px)",
                height: "var(--settera-checkbox-size, 16px)",
                display: "inline-flex",
                alignItems: "center",
                justifyContent: "center",
                border: "var(--settera-checkbox-border, 1px solid #9ca3af)",
                backgroundColor: "var(--settera-checkbox-bg, #ffffff)",
                outline: "none",
                boxShadow: isFocused
                  ? "0 0 0 2px var(--settera-focus-ring-color, #93c5fd)"
                  : "none",
                borderRadius: "var(--settera-checkbox-border-radius, 3px)",
                cursor: "pointer",
              }}
            >
              <Checkbox.Indicator
                aria-hidden="true"
                style={{
                  color: isDangerous
                    ? "var(--settera-dangerous-color, #dc2626)"
                    : "var(--settera-input-color, #111827)",
                  fontSize: "12px",
                  lineHeight: 1,
                }}
              >
                ✓
              </Checkbox.Indicator>
            </Checkbox.Root>
            {opt.label}
          </label>
        );
      })}
    </div>
  );
}
