"use client";

import React, { useCallback, useMemo, useRef, useState } from "react";
import type {
  CompoundFieldDefinition,
  SelectSetting,
  MultiSelectSetting,
  TextSetting,
} from "@settera/schema";
import { useBufferedInput } from "@settera/react";
import { CalendarDaysIcon } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Checkbox } from "@/components/ui/checkbox";
import {
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
} from "@/components/ui/input-group";
import { Label } from "@/components/ui/label";
import {
  Popover,
  PopoverAnchor,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { cn } from "@/lib/utils";
import {
  parseISODate,
  formatDisplayDate,
  formatISODate,
  parseDateInput,
} from "./settera-date-input";

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
  const [open, setOpen] = useState(false);
  const [inputText, setInputText] = useState(() => {
    if (typeof value === "string" && value) {
      const d = parseISODate(value);
      return d ? formatDisplayDate(d) : value;
    }
    return "";
  });
  const focusedRef = useRef(false);

  // Sync external value changes into local text when not focused
  const prevValueRef = useRef(value);
  if (value !== prevValueRef.current) {
    prevValueRef.current = value;
    if (!focusedRef.current) {
      if (typeof value === "string" && value) {
        const d = parseISODate(value);
        setInputText(d ? formatDisplayDate(d) : value);
      } else {
        setInputText("");
      }
    }
  }

  const selectedDate = useMemo(() => {
    if (typeof value === "string" && value) {
      return parseISODate(value);
    }
    return undefined;
  }, [value]);

  const handleCalendarSelect = useCallback(
    (date: Date | undefined) => {
      if (!date) return;
      const iso = formatISODate(date);
      setInputText(formatDisplayDate(date));
      onChange(iso);
      setOpen(false);
    },
    [onChange],
  );

  const handleInputChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const text = e.target.value;
      setInputText(text);
      const parsed = parseDateInput(text);
      if (parsed) {
        onChange(formatISODate(parsed));
      }
    },
    [onChange],
  );

  const handleInputFocus = useCallback(() => {
    focusedRef.current = true;
  }, []);

  const handleInputBlur = useCallback(() => {
    focusedRef.current = false;

    if (!inputText.trim()) {
      if (value !== undefined && value !== "") {
        onChange(undefined);
      }
      return;
    }

    const parsed = parseDateInput(inputText);
    if (parsed) {
      const iso = formatISODate(parsed);
      setInputText(formatDisplayDate(parsed));
      if (iso !== value) {
        onChange(iso);
      }
    }
  }, [inputText, value, onChange]);

  const handleInputKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLInputElement>) => {
      if (e.key === "Enter") {
        (e.target as HTMLInputElement).blur();
      } else if (e.key === "Escape") {
        if (typeof value === "string" && value) {
          const d = parseISODate(value);
          setInputText(d ? formatDisplayDate(d) : value);
        } else {
          setInputText("");
        }
      }
    },
    [value],
  );

  return (
    <Popover open={open} onOpenChange={setOpen} modal>
      <PopoverAnchor>
        <InputGroup
          data-disabled={disabled || undefined}
          className={cn("w-full", className)}
        >
          <InputGroupInput
            id={fieldId}
            value={inputText}
            onChange={handleInputChange}
            onFocus={handleInputFocus}
            onBlur={handleInputBlur}
            onKeyDown={handleInputKeyDown}
            placeholder="Select date"
            disabled={disabled}
            readOnly={readOnly}
            aria-label={ariaLabel}
          />
          <InputGroupAddon align="inline-end">
            <PopoverTrigger asChild>
              <Button
                type="button"
                variant="ghost"
                size="icon-xs"
                disabled={disabled || readOnly}
                aria-label="Open calendar"
                className="text-muted-foreground shadow-none"
              >
                <CalendarDaysIcon className="size-4" />
              </Button>
            </PopoverTrigger>
          </InputGroupAddon>
        </InputGroup>
      </PopoverAnchor>
      <PopoverContent className="w-auto p-0" align="end">
        <Calendar
          mode="single"
          selected={selectedDate}
          onSelect={handleCalendarSelect}
          defaultMonth={selectedDate}
        />
      </PopoverContent>
    </Popover>
  );
}

const EMPTY_OPTION_VALUE_BASE = "__settera_empty_option__";

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
  const options = field.options;
  const isRequired = field.validation?.required;
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
      onChange(resolved);
    },
    [onChange, emptyOptionValue],
  );

  return (
    <Select
      value={selectedValue || emptyOptionValue}
      onValueChange={handleValueChange}
      disabled={disabled}
    >
      <SelectTrigger
        id={fieldId}
        aria-label={ariaLabel}
        className={cn("w-full", className)}
      >
        <SelectValue placeholder="Select…" />
      </SelectTrigger>
      <SelectContent position="popper" sideOffset={4}>
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
