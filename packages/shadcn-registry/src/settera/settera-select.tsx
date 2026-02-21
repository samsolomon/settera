"use client";

import React, { useCallback } from "react";
import { useSetteraSetting } from "@settera/react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { useEmptyOptionValue } from "./settera-select-utils";
import { useSetteraLabels } from "./settera-labels";
import { SetteraSearchableSelect } from "./settera-searchable-select";

export interface SetteraSelectProps {
  settingKey: string;
}

export function SetteraSelect({ settingKey }: SetteraSelectProps) {
  const labels = useSetteraLabels();
  const { value, setValue, error, definition, validate } =
    useSetteraSetting(settingKey);

  if (definition.type === "select" && definition.searchable) {
    return <SetteraSearchableSelect settingKey={settingKey} />;
  }

  const isDangerous =
    "dangerous" in definition && Boolean(definition.dangerous);
  const isDisabled = "disabled" in definition && Boolean(definition.disabled);
  const options = definition.type === "select" ? definition.options : [];
  const isRequired =
    definition.type === "select" && definition.validation?.required;
  const selectedValue = typeof value === "string" ? value : "";

  const emptyOptionValue = useEmptyOptionValue(options);

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
          "w-full md:w-[var(--settera-control-width,200px)]",
          hasError && "border-destructive",
          isDangerous && "text-destructive",
        )}
      >
        <SelectValue placeholder={isRequired ? undefined : labels.select} />
      </SelectTrigger>
      <SelectContent>
        {!isRequired && (
          <SelectItem value={emptyOptionValue} className="text-muted-foreground">
            {labels.select}
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
