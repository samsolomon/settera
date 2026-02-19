"use client";

import React, { useCallback, useMemo } from "react";
import { useSetteraSetting } from "@settera/react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";

export interface SetteraSelectProps {
  settingKey: string;
}

const EMPTY_OPTION_VALUE_BASE = "__settera_empty_option__";

export function SetteraSelect({ settingKey }: SetteraSelectProps) {
  const { value, setValue, error, definition, validate } =
    useSetteraSetting(settingKey);

  const isDangerous =
    "dangerous" in definition && Boolean(definition.dangerous);
  const isDisabled = "disabled" in definition && Boolean(definition.disabled);
  const options = definition.type === "select" ? definition.options : [];
  const isRequired =
    definition.type === "select" && definition.validation?.required;
  const selectedValue = typeof value === "string" ? value : "";

  const emptyOptionValue = useMemo(() => {
    if (!options.some((opt) => opt.value === EMPTY_OPTION_VALUE_BASE)) {
      return EMPTY_OPTION_VALUE_BASE;
    }
    let i = 1;
    while (
      options.some((opt) => opt.value === `${EMPTY_OPTION_VALUE_BASE}_${i}`)
    ) {
      i += 1;
    }
    return `${EMPTY_OPTION_VALUE_BASE}_${i}`;
  }, [options]);

  const handleValueChange = useCallback(
    (newValue: string) => {
      const resolved = newValue === emptyOptionValue ? "" : newValue;
      setValue(resolved);
      validate(resolved);
    },
    [setValue, validate, emptyOptionValue],
  );

  const hasError = error !== null;

  return (
    <Select
      value={selectedValue || emptyOptionValue}
      onValueChange={handleValueChange}
      disabled={isDisabled}
    >
      <SelectTrigger
        aria-label={definition.title}
        aria-invalid={hasError}
        aria-describedby={hasError ? `settera-error-${settingKey}` : undefined}
        className={cn(
          "min-w-[160px]",
          hasError && "border-destructive",
          isDangerous && "text-destructive",
        )}
      >
        <SelectValue placeholder={isRequired ? undefined : "Select\u2026"} />
      </SelectTrigger>
      <SelectContent>
        {!isRequired && (
          <SelectItem value={emptyOptionValue} className="text-muted-foreground">
            Select&hellip;
          </SelectItem>
        )}
        {options.map((opt) => (
          <SelectItem key={opt.value} value={opt.value}>
            {opt.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
