"use client";

import React, { useCallback, useEffect, useRef, useState } from "react";
import { useSetteraSetting } from "@settera/react";
import type { SelectOption } from "@settera/schema";
import { CheckIcon, ChevronDownIcon } from "lucide-react";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { useEmptyOptionValue } from "./settera-select-utils";
import { useSetteraLabels } from "./settera-labels";

// ---- Shared hook ----

function useSearchableSelectState(
  options: SelectOption[],
  selectedValue: string,
  emptyOptionValue: string,
  isRequired: boolean | undefined,
  onSelect: (value: string) => void,
) {
  const labels = useSetteraLabels();

  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [highlightIndex, setHighlightIndex] = useState(0);
  const contentRef = useRef<HTMLDivElement>(null);
  const listRef = useRef<HTMLDivElement>(null);

  const allOptions: SelectOption[] = isRequired
    ? options
    : [{ value: emptyOptionValue, label: labels.select }, ...options];

  const filteredOptions = search
    ? allOptions.filter((opt) => {
        if (opt.value === emptyOptionValue) return false;
        const query = search.toLowerCase();
        return (
          opt.label.toLowerCase().includes(query) ||
          (opt.description && opt.description.toLowerCase().includes(query)) ||
          (opt.group && opt.group.toLowerCase().includes(query))
        );
      })
    : allOptions;

  // Reset highlight when search query changes
  useEffect(() => {
    setHighlightIndex(0);
  }, [search]);

  // Scroll highlighted item into view
  useEffect(() => {
    if (!listRef.current) return;
    const highlighted = listRef.current.querySelector(
      '[data-highlighted="true"]',
    );
    if (highlighted) {
      highlighted.scrollIntoView({ block: "nearest" });
    }
  }, [highlightIndex]);

  const handleSelect = useCallback(
    (optionValue: string) => {
      const resolved = optionValue === emptyOptionValue ? "" : optionValue;
      onSelect(resolved);
      setOpen(false);
      setSearch("");
    },
    [onSelect, emptyOptionValue],
  );

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === "ArrowDown") {
        e.preventDefault();
        setHighlightIndex((i) => Math.min(i + 1, filteredOptions.length - 1));
      } else if (e.key === "ArrowUp") {
        e.preventDefault();
        setHighlightIndex((i) => Math.max(i - 1, 0));
      } else if (e.key === "Enter") {
        e.preventDefault();
        if (filteredOptions[highlightIndex]) {
          handleSelect(filteredOptions[highlightIndex].value);
        }
      } else if (e.key === "Escape") {
        e.preventDefault();
        setOpen(false);
        setSearch("");
      }
    },
    [filteredOptions, highlightIndex, handleSelect],
  );

  const handleOpenChange = (nextOpen: boolean) => {
    setOpen(nextOpen);
    if (nextOpen) {
      setSearch("");
      setHighlightIndex(0);
    }
  };

  const focusInput = (e: Event) => {
    e.preventDefault();
    contentRef.current?.querySelector("input")?.focus();
  };

  const selectedLabel =
    options.find((opt) => opt.value === selectedValue)?.label ?? "";

  return {
    open,
    search,
    setSearch,
    highlightIndex,
    setHighlightIndex,
    contentRef,
    listRef,
    allOptions,
    filteredOptions,
    emptyOptionValue,
    selectedLabel,
    labels,
    handleSelect,
    handleKeyDown,
    handleOpenChange,
    focusInput,
  };
}

// ---- Shared popover body ----

function SearchableSelectPopoverBody({
  search,
  setSearch,
  highlightIndex,
  setHighlightIndex,
  contentRef,
  listRef,
  filteredOptions,
  emptyOptionValue,
  selectedValue,
  labels,
  listboxLabel,
  handleSelect,
  handleKeyDown,
}: {
  search: string;
  setSearch: (v: string) => void;
  highlightIndex: number;
  setHighlightIndex: (i: number) => void;
  contentRef: React.Ref<HTMLDivElement>;
  listRef: React.Ref<HTMLDivElement>;
  filteredOptions: SelectOption[];
  emptyOptionValue: string;
  selectedValue: string;
  labels: ReturnType<typeof useSetteraLabels>;
  listboxLabel: string | undefined;
  handleSelect: (v: string) => void;
  handleKeyDown: (e: React.KeyboardEvent) => void;
}) {
  return (
    <div ref={contentRef} className="flex flex-col" onKeyDown={handleKeyDown}>
      <div className="p-2">
        <Input
          value={search}
          onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
            setSearch(e.target.value)
          }
          placeholder={labels.searchSelectPlaceholder}
          className="h-8"
          aria-label={labels.searchSelectPlaceholder}
        />
      </div>
      <div
        ref={listRef}
        role="listbox"
        aria-label={listboxLabel}
        className="max-h-60 overflow-y-auto p-1"
      >
        {filteredOptions.length === 0 ? (
          <div className="text-muted-foreground px-2 py-6 text-center text-sm">
            {labels.noResults}
          </div>
        ) : (
          filteredOptions.map((opt, index) => {
            const isSelected =
              opt.value === emptyOptionValue
                ? !selectedValue
                : opt.value === selectedValue;
            const isHighlighted = index === highlightIndex;
            const isEmpty = opt.value === emptyOptionValue;
            return (
              <div
                key={opt.value}
                role="option"
                aria-selected={isSelected}
                aria-label={opt.label}
                data-highlighted={isHighlighted || undefined}
                className={cn(
                  "relative flex w-full cursor-default items-center gap-2 rounded-sm py-1.5 pr-8 pl-2 text-sm outline-hidden select-none",
                  isHighlighted && "bg-accent text-accent-foreground",
                  isEmpty && "text-muted-foreground",
                )}
                onMouseEnter={() => setHighlightIndex(index)}
                onMouseDown={(e) => {
                  e.preventDefault();
                  handleSelect(opt.value);
                }}
              >
                <span className="truncate">{opt.label}</span>
                {isSelected && (
                  <span className="absolute right-2 flex size-3.5 items-center justify-center">
                    <CheckIcon className="size-4" />
                  </span>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}

// ---- Top-level searchable select (uses useSetteraSetting) ----

export interface SetteraSearchableSelectProps {
  settingKey: string;
}

export function SetteraSearchableSelect({
  settingKey,
}: SetteraSearchableSelectProps) {
  const { value, setValue, error, definition, validate } =
    useSetteraSetting(settingKey);

  const isDangerous =
    "dangerous" in definition && Boolean(definition.dangerous);
  const isDisabled = "disabled" in definition && Boolean(definition.disabled);
  const options = definition.type === "select" ? definition.options : [];
  const isRequired =
    definition.type === "select" && definition.validation?.required;
  const selectedValue = typeof value === "string" ? value : "";

  const rawEmptyOptionValue = useEmptyOptionValue(options);
  const hasError = error !== null;

  const onSelect = useCallback(
    (resolved: string) => {
      setValue(resolved);
      validate(resolved);
    },
    [setValue, validate],
  );

  const state = useSearchableSelectState(
    options,
    selectedValue,
    rawEmptyOptionValue,
    isRequired,
    onSelect,
  );

  return (
    <Popover open={state.open} onOpenChange={state.handleOpenChange} modal>
      <PopoverTrigger asChild disabled={isDisabled}>
        <button
          type="button"
          role="combobox"
          aria-expanded={state.open}
          aria-label={definition.title}
          aria-invalid={hasError}
          aria-describedby={
            hasError ? `settera-error-${settingKey}` : undefined
          }
          disabled={isDisabled}
          className={cn(
            "border-input data-[placeholder]:text-muted-foreground [&_svg:not([class*='text-'])]:text-muted-foreground focus-visible:border-ring focus-visible:ring-ring/50 aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive dark:bg-input/30 dark:hover:bg-input/50 flex w-full md:w-[var(--settera-control-width,200px)] items-center justify-between gap-2 rounded-md border bg-transparent px-3 py-2 text-sm whitespace-nowrap shadow-xs transition-[color,box-shadow] outline-none focus-visible:ring-[3px] disabled:cursor-not-allowed disabled:opacity-50 h-9",
            hasError && "border-destructive",
            isDangerous && "text-destructive",
          )}
        >
          <span className="truncate">
            {state.selectedLabel || (
              <span className="text-muted-foreground">
                {definition.type === "select"
                  ? definition.placeholder || state.labels.select
                  : state.labels.select}
              </span>
            )}
          </span>
          <ChevronDownIcon className="size-4 shrink-0 opacity-50" />
        </button>
      </PopoverTrigger>
      <PopoverContent
        className="w-[var(--radix-popover-trigger-width)] p-0"
        align="start"
        onOpenAutoFocus={state.focusInput}
      >
        <SearchableSelectPopoverBody
          search={state.search}
          setSearch={state.setSearch}
          highlightIndex={state.highlightIndex}
          setHighlightIndex={state.setHighlightIndex}
          contentRef={state.contentRef}
          listRef={state.listRef}
          filteredOptions={state.filteredOptions}
          emptyOptionValue={state.emptyOptionValue}
          selectedValue={selectedValue}
          labels={state.labels}
          listboxLabel={definition.title}
          handleSelect={state.handleSelect}
          handleKeyDown={state.handleKeyDown}
        />
      </PopoverContent>
    </Popover>
  );
}

// ---- Field control searchable select (for compound fields) ----

export function FieldControlSearchableSelect({
  field,
  value,
  onChange,
  fieldId,
  ariaLabel,
  disabled,
  className,
}: {
  field: {
    options: SelectOption[];
    placeholder?: string;
    searchable?: boolean;
    validation?: { required?: boolean };
  };
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

  const rawEmptyOptionValue = useEmptyOptionValue(options);

  const onSelect = useCallback(
    (resolved: string) => {
      onChange(resolved);
    },
    [onChange],
  );

  const state = useSearchableSelectState(
    options,
    selectedValue,
    rawEmptyOptionValue,
    isRequired,
    onSelect,
  );

  return (
    <Popover open={state.open} onOpenChange={state.handleOpenChange} modal>
      <PopoverTrigger asChild disabled={disabled}>
        <button
          type="button"
          role="combobox"
          id={fieldId}
          aria-expanded={state.open}
          aria-label={ariaLabel}
          disabled={disabled}
          className={cn(
            "border-input data-[placeholder]:text-muted-foreground [&_svg:not([class*='text-'])]:text-muted-foreground focus-visible:border-ring focus-visible:ring-ring/50 dark:bg-input/30 dark:hover:bg-input/50 flex w-full items-center justify-between gap-2 rounded-md border bg-transparent px-3 py-2 text-sm whitespace-nowrap shadow-xs transition-[color,box-shadow] outline-none focus-visible:ring-[3px] disabled:cursor-not-allowed disabled:opacity-50 h-9",
            className,
          )}
        >
          <span className="truncate">
            {state.selectedLabel || (
              <span className="text-muted-foreground">
                {state.labels.select}
              </span>
            )}
          </span>
          <ChevronDownIcon className="size-4 shrink-0 opacity-50" />
        </button>
      </PopoverTrigger>
      <PopoverContent
        className="w-[var(--radix-popover-trigger-width)] p-0"
        align="start"
        onOpenAutoFocus={state.focusInput}
      >
        <SearchableSelectPopoverBody
          search={state.search}
          setSearch={state.setSearch}
          highlightIndex={state.highlightIndex}
          setHighlightIndex={state.setHighlightIndex}
          contentRef={state.contentRef}
          listRef={state.listRef}
          filteredOptions={state.filteredOptions}
          emptyOptionValue={state.emptyOptionValue}
          selectedValue={selectedValue}
          labels={state.labels}
          listboxLabel={ariaLabel}
          handleSelect={state.handleSelect}
          handleKeyDown={state.handleKeyDown}
        />
      </PopoverContent>
    </Popover>
  );
}
