"use client";

import React, { useCallback } from "react";
import type {
  CompoundFieldDefinition,
  SelectSetting,
  MultiSelectSetting,
  TextSetting,
} from "@settera/schema";
import { useBufferedInput } from "@settera/react";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

export interface SetteraFieldControlProps {
  field: CompoundFieldDefinition;
  value: unknown;
  onChange: (nextValue: unknown) => void;
  fieldId?: string;
  ariaLabel?: string;
  disabled?: boolean;
  readOnly?: boolean;
  className?: string;
}

export function SetteraFieldControl({
  field,
  value,
  onChange,
  fieldId,
  ariaLabel,
  disabled,
  readOnly,
  className,
}: SetteraFieldControlProps) {
  switch (field.type) {
    case "text":
      return (
        <FieldControlText
          field={field as TextSetting}
          value={value}
          onChange={onChange}
          fieldId={fieldId}
          ariaLabel={ariaLabel}
          disabled={disabled}
          readOnly={readOnly}
          className={className}
        />
      );
    case "number":
      return (
        <FieldControlNumber
          value={value}
          onChange={onChange}
          fieldId={fieldId}
          ariaLabel={ariaLabel}
          disabled={disabled}
          readOnly={readOnly}
          className={className}
        />
      );
    case "date":
      return (
        <FieldControlDate
          value={value}
          onChange={onChange}
          fieldId={fieldId}
          ariaLabel={ariaLabel}
          disabled={disabled}
          readOnly={readOnly}
          className={className}
        />
      );
    case "select":
      return (
        <FieldControlSelect
          field={field as SelectSetting}
          value={value}
          onChange={onChange}
          fieldId={fieldId}
          ariaLabel={ariaLabel}
          disabled={disabled}
          className={className}
        />
      );
    case "boolean":
      return (
        <Switch
          id={fieldId}
          aria-label={ariaLabel}
          checked={Boolean(value)}
          onCheckedChange={(checked) => onChange(checked)}
          disabled={disabled}
        />
      );
    case "multiselect": {
      const multiField = field as MultiSelectSetting;
      const selected = Array.isArray(value)
        ? value.filter((item): item is string => typeof item === "string")
        : [];
      return (
        <div className="flex flex-col gap-2">
          {multiField.options.map((opt) => {
            const isChecked = selected.includes(opt.value);
            const itemId = fieldId
              ? `${fieldId}-${opt.value}`
              : `field-${opt.value}`;
            return (
              <div key={opt.value} className="flex items-center gap-2">
                <Checkbox
                  id={itemId}
                  checked={isChecked}
                  disabled={disabled}
                  aria-label={
                    ariaLabel ? `${ariaLabel} ${opt.label}` : opt.label
                  }
                  onCheckedChange={(checked) => {
                    const next = checked === true
                      ? [...selected, opt.value]
                      : selected.filter((v) => v !== opt.value);
                    onChange(next);
                  }}
                />
                <Label
                  htmlFor={itemId}
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
    default:
      return null;
  }
}

function FieldControlText({
  field,
  value,
  onChange,
  fieldId,
  ariaLabel,
  disabled,
  readOnly,
  className,
}: {
  field: TextSetting;
  value: unknown;
  onChange: (nextValue: unknown) => void;
  fieldId?: string;
  ariaLabel?: string;
  disabled?: boolean;
  readOnly?: boolean;
  className?: string;
}) {
  const committed = typeof value === "string" ? value : "";

  const onCommit = useCallback(
    (local: string) => {
      if (local !== committed) {
        onChange(local);
      }
    },
    [committed, onChange],
  );

  const { inputProps } = useBufferedInput(committed, onCommit);

  return (
    <Input
      id={fieldId}
      aria-label={ariaLabel}
      type={field.inputType ?? "text"}
      {...inputProps}
      disabled={disabled}
      readOnly={readOnly}
      className={className}
    />
  );
}

function FieldControlNumber({
  value,
  onChange,
  fieldId,
  ariaLabel,
  disabled,
  readOnly,
  className,
}: {
  value: unknown;
  onChange: (nextValue: unknown) => void;
  fieldId?: string;
  ariaLabel?: string;
  disabled?: boolean;
  readOnly?: boolean;
  className?: string;
}) {
  const committed =
    value !== undefined && value !== null ? String(value) : "";

  const onCommit = useCallback(
    (local: string) => {
      if (local === "") {
        if (committed !== "") onChange(undefined);
        return;
      }
      const num = Number(local);
      if (Number.isNaN(num)) return;
      if (local !== committed) onChange(num);
    },
    [committed, onChange],
  );

  const { inputProps } = useBufferedInput(committed, onCommit);

  return (
    <Input
      id={fieldId}
      aria-label={ariaLabel}
      type="number"
      {...inputProps}
      disabled={disabled}
      readOnly={readOnly}
      className={className}
    />
  );
}

function FieldControlDate({
  value,
  onChange,
  fieldId,
  ariaLabel,
  disabled,
  readOnly,
  className,
}: {
  value: unknown;
  onChange: (nextValue: unknown) => void;
  fieldId?: string;
  ariaLabel?: string;
  disabled?: boolean;
  readOnly?: boolean;
  className?: string;
}) {
  return (
    <Input
      id={fieldId}
      aria-label={ariaLabel}
      type="date"
      value={typeof value === "string" ? value : ""}
      onChange={(e) => onChange(e.target.value)}
      disabled={disabled}
      readOnly={readOnly}
      className={className}
    />
  );
}

function FieldControlSelect({
  field,
  value,
  onChange,
  fieldId,
  ariaLabel,
  disabled,
  className,
}: {
  field: SelectSetting;
  value: unknown;
  onChange: (nextValue: unknown) => void;
  fieldId?: string;
  ariaLabel?: string;
  disabled?: boolean;
  className?: string;
}) {
  // Native <select> inside dialogs avoids Radix portal z-index issues
  return (
    <select
      id={fieldId}
      aria-label={ariaLabel}
      value={typeof value === "string" ? value : ""}
      onChange={(e) => onChange(e.target.value)}
      disabled={disabled}
      className={cn(
        "flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50",
        className,
      )}
    >
      <option value="">Select&hellip;</option>
      {field.options.map((opt) => (
        <option key={opt.value} value={opt.value}>
          {opt.label}
        </option>
      ))}
    </select>
  );
}
