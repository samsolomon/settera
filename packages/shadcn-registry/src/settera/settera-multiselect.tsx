"use client";

import React, { useCallback, useMemo, useRef } from "react";
import { useSetteraSetting } from "@settera/react";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";

export interface SetteraMultiselectProps {
  settingKey: string;
}

export function SetteraMultiselect({ settingKey }: SetteraMultiselectProps) {
  const { value, setValue, error, definition, validate } =
    useSetteraSetting(settingKey);
  const containerRef = useRef<HTMLDivElement>(null);

  const isDisabled = "disabled" in definition && Boolean(definition.disabled);
  const options = definition.type === "multiselect" ? definition.options : [];
  const selectedValues = useMemo(
    () => (Array.isArray(value) ? (value as string[]) : []),
    [value],
  );

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
      className="flex flex-col gap-2"
    >
      {options.map((opt) => {
        const isChecked = selectedValues.includes(opt.value);
        const checkboxId = `settera-multiselect-${settingKey}-${opt.value}`;

        return (
          <div key={opt.value} className="flex items-center gap-2">
            <Checkbox
              id={checkboxId}
              checked={isChecked}
              disabled={isDisabled}
              onCheckedChange={(checked) =>
                handleChange(opt.value, checked === true)
              }
              onKeyDown={handleCheckboxKeyDown}
              aria-label={opt.label}
            />
            <Label
              htmlFor={checkboxId}
              className="text-sm font-normal cursor-pointer"
            >
              {opt.label}
            </Label>
          </div>
        );
      })}
    </div>
  );
}
