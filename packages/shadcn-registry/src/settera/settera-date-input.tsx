"use client";

import React, { useCallback, useMemo, useRef, useState } from "react";
import { useSetteraSetting } from "@settera/react";
import { format, isValid, parse } from "date-fns";
import { CalendarDaysIcon } from "lucide-react";
import { Calendar } from "@/components/ui/calendar";
import { Button } from "@/components/ui/button";
import {
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
} from "@/components/ui/input-group";
import {
  Popover,
  PopoverAnchor,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { SetteraCopyButton } from "./settera-copy-button";

export interface SetteraDateInputProps {
  settingKey: string;
}

const DISPLAY_FORMAT = "MMMM dd, yyyy";
const ISO_FORMAT = "yyyy-MM-dd";
const PARSE_FORMATS = [
  DISPLAY_FORMAT,
  "M/d/yyyy",
  "MM/dd/yyyy",
  "MMM d, yyyy",
  ISO_FORMAT,
];

function parseISODate(iso: string): Date | undefined {
  const ref = new Date();
  const d = parse(iso, ISO_FORMAT, ref);
  return isValid(d) ? d : undefined;
}

function formatDisplayDate(date: Date): string {
  return format(date, DISPLAY_FORMAT);
}

function formatISODate(date: Date): string {
  return format(date, ISO_FORMAT);
}

function parseDateInput(text: string): Date | undefined {
  const trimmed = text.trim();
  if (!trimmed) return undefined;
  const ref = new Date();
  for (const fmt of PARSE_FORMATS) {
    const d = parse(trimmed, fmt, ref);
    if (isValid(d)) return d;
  }
  return undefined;
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
  const isDisabled = "disabled" in definition && Boolean(definition.disabled);
  const isReadOnly = "readonly" in definition && Boolean(definition.readonly);
  const hasError = error !== null;

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

  const disabledMatcher = useMemo(() => {
    const matchers: Array<{ before: Date } | { after: Date }> = [];
    if (minDate) {
      const d = parseISODate(minDate);
      if (d) matchers.push({ before: d });
    }
    if (maxDate) {
      const d = parseISODate(maxDate);
      if (d) matchers.push({ after: d });
    }
    return matchers;
  }, [minDate, maxDate]);

  const handleCalendarSelect = useCallback(
    (date: Date | undefined) => {
      if (!date) return;
      const iso = formatISODate(date);
      setInputText(formatDisplayDate(date));
      setValue(iso);
      setOpen(false);
    },
    [setValue],
  );

  const handleInputChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const text = e.target.value;
      setInputText(text);

      // Try to parse as display format and update value
      const parsed = parseDateInput(text);
      if (parsed) {
        setValue(formatISODate(parsed));
      }
    },
    [setValue],
  );

  const handleInputFocus = useCallback(() => {
    focusedRef.current = true;
  }, []);

  const handleInputBlur = useCallback(() => {
    focusedRef.current = false;

    // On blur, if text is empty clear the value
    if (!inputText.trim()) {
      if (value !== undefined && value !== "") {
        setValue(undefined);
      }
      validate(undefined);
      return;
    }

    // Try to parse and commit
    const parsed = parseDateInput(inputText);
    if (parsed) {
      const iso = formatISODate(parsed);
      setInputText(formatDisplayDate(parsed));
      if (iso !== value) {
        setValue(iso);
      }
      validate(iso);
    } else {
      // Invalid text — run validation with current value
      validate();
    }
  }, [inputText, value, setValue, validate]);

  const handleInputKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLInputElement>) => {
      if (e.key === "Enter") {
        (e.target as HTMLInputElement).blur();
      } else if (e.key === "Escape") {
        // Revert to last committed value
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

  const handlePopoverOpenChange = useCallback(
    (nextOpen: boolean) => {
      setOpen(nextOpen);
      if (!nextOpen) {
        validate();
      }
    },
    [validate],
  );

  return (
    <Popover open={open} onOpenChange={handlePopoverOpenChange}>
      <PopoverAnchor>
        <InputGroup
          data-disabled={isDisabled || undefined}
          className={cn(
            "w-full md:w-[200px]",
            hasError && "border-destructive",
            isDangerous && "text-destructive",
          )}
        >
          <InputGroupInput
            value={inputText}
            onChange={handleInputChange}
            onFocus={handleInputFocus}
            onBlur={handleInputBlur}
            onKeyDown={handleInputKeyDown}
            placeholder="Select date"
            disabled={isDisabled}
            readOnly={isReadOnly}
            aria-label={definition.title}
            aria-invalid={hasError}
            aria-describedby={
              hasError ? `settera-error-${settingKey}` : undefined
            }
          />
          <InputGroupAddon align="inline-end">
            {isReadOnly ? (
              <SetteraCopyButton value={inputText} label={definition.title} />
            ) : (
              <PopoverTrigger asChild>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon-xs"
                  disabled={isDisabled}
                  aria-label="Open calendar"
                  className="text-muted-foreground shadow-none [&_svg]:size-5"
                >
                  <CalendarDaysIcon />
                </Button>
              </PopoverTrigger>
            )}
          </InputGroupAddon>
        </InputGroup>
      </PopoverAnchor>
      <PopoverContent className="w-auto p-0" align="end">
        <Calendar
          mode="single"
          selected={selectedDate}
          onSelect={handleCalendarSelect}
          defaultMonth={selectedDate}
          disabled={disabledMatcher}
        />
      </PopoverContent>
    </Popover>
  );
}
