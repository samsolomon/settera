import React, { useCallback, useMemo, useRef, useState } from "react";
import * as Checkbox from "@radix-ui/react-checkbox";
import { useSetteraSetting } from "@settera/react";
import { token } from "@settera/schema";

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
  const isDisabled = "disabled" in definition && Boolean(definition.disabled);
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
      event.stopPropagation();
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
        gap: token("multiselect-gap"),
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
              gap: token("checkbox-gap"),
              fontSize: token("input-font-size"),
              color: isDangerous
                ? token("dangerous-color")
                : token("input-color"),
              cursor: "pointer",
            }}
          >
            <Checkbox.Root
              data-slot="checkbox"
              id={checkboxId}
              checked={isChecked}
              disabled={isDisabled}
              onCheckedChange={(checked: boolean | "indeterminate") =>
                handleChange(opt.value, checked === true)
              }
              onPointerDown={handlePointerDown}
              onFocus={() => handleFocus(index)}
              onBlur={handleBlur}
              onKeyDown={handleCheckboxKeyDown}
              aria-label={opt.label}
              style={{
                width: token("checkbox-size"),
                height: token("checkbox-size"),
                flexShrink: 0,
                display: "inline-flex",
                alignItems: "center",
                justifyContent: "center",
                border: isChecked
                  ? isDangerous
                    ? `1px solid ${token("dangerous-color")}`
                    : token("checkbox-checked-border")
                  : token("checkbox-border"),
                backgroundColor: isChecked
                  ? isDangerous
                    ? token("dangerous-color")
                    : token("checkbox-checked-bg")
                  : token("checkbox-bg"),
                outline: "none",
                boxShadow: isFocused
                  ? `0 0 0 2px ${token("focus-ring-color")}`
                  : token("checkbox-shadow"),
                borderRadius: token("checkbox-border-radius"),
                cursor: isDisabled ? "not-allowed" : "pointer",
                opacity: isDisabled ? token("disabled-opacity") : 1,
                transition: "box-shadow 120ms, background-color 120ms, border-color 120ms",
              }}
            >
              <Checkbox.Indicator
                data-slot="checkbox-indicator"
                aria-hidden="true"
                style={{
                  display: "grid",
                  placeContent: "center",
                  color: token("checkbox-indicator-color"),
                }}
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="20 6 9 17 4 12" />
                </svg>
              </Checkbox.Indicator>
            </Checkbox.Root>
            {opt.label}
          </label>
        );
      })}
    </div>
  );
}
