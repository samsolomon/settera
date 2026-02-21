"use client";

import React, { useCallback } from "react";
import { useSetteraSetting, useBufferedInput } from "@settera/react";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

export interface SetteraNumberInputProps {
  settingKey: string;
}

function displayString(v: unknown): string {
  return v !== undefined && v !== null ? String(v) : "";
}

export function SetteraNumberInput({ settingKey }: SetteraNumberInputProps) {
  const { value, setValue, error, definition, validate } =
    useSetteraSetting(settingKey);

  const committed = displayString(value);

  const onCommit = useCallback(
    (local: string) => {
      if (local === "") {
        if (local !== committed) {
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
      }
    },
    [committed, value, setValue, validate],
  );

  const { inputProps } = useBufferedInput(committed, onCommit);

  const isDangerous =
    "dangerous" in definition && Boolean(definition.dangerous);
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

  const isDisabled = "disabled" in definition && Boolean(definition.disabled);
  const isReadOnly = "readonly" in definition && Boolean(definition.readonly);
  const hasError = error !== null;

  return (
    <Input
      type="number"
      {...inputProps}
      placeholder={placeholder}
      min={min}
      max={max}
      disabled={isDisabled}
      readOnly={isReadOnly}
      aria-label={definition.title}
      aria-invalid={hasError}
      aria-describedby={hasError ? `settera-error-${settingKey}` : undefined}
      className={cn(
        "w-full md:w-[200px]",
        hasError && "border-destructive",
        isDangerous && "text-destructive",
      )}
    />
  );
}
