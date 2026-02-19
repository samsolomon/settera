"use client";

import React, { useCallback } from "react";
import { useSetteraSetting } from "@settera/react";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

export interface SetteraDateInputProps {
  settingKey: string;
}

export function SetteraDateInput({ settingKey }: SetteraDateInputProps) {
  const { value, setValue, error, definition, validate } =
    useSetteraSetting(settingKey);

  const isDangerous =
    "dangerous" in definition && Boolean(definition.dangerous);
  const isDate = definition.type === "date";
  const minDate =
    isDate && definition.validation?.minDate
      ? definition.validation.minDate
      : undefined;
  const maxDate =
    isDate && definition.validation?.maxDate
      ? definition.validation.maxDate
      : undefined;

  const handleChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      setValue(e.target.value);
    },
    [setValue],
  );

  const handleBlur = useCallback(() => {
    validate();
  }, [validate]);

  const isDisabled = "disabled" in definition && Boolean(definition.disabled);
  const isReadOnly = "readonly" in definition && Boolean(definition.readonly);
  const hasError = error !== null;

  return (
    <Input
      type="date"
      value={typeof value === "string" ? value : ""}
      onChange={handleChange}
      onBlur={handleBlur}
      min={minDate}
      max={maxDate}
      disabled={isDisabled}
      readOnly={isReadOnly}
      aria-label={definition.title}
      aria-invalid={hasError}
      aria-describedby={hasError ? `settera-error-${settingKey}` : undefined}
      className={cn(
        hasError && "border-destructive",
        isDangerous && "text-destructive",
      )}
    />
  );
}
