"use client";

import React, { useCallback, useMemo, useRef } from "react";
import { useSetteraSetting, useBufferedInput, isObjectRecord } from "@settera/react";
import type { RepeatableFieldDefinition, RepeatableSetting } from "@settera/schema";
import { SetteraFieldControl } from "./settera-field-control";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

export interface SetteraRepeatableInputProps {
  settingKey: string;
}

function toStringArray(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return value.map((item) => (typeof item === "string" ? item : String(item)));
}

function toObjectArray(value: unknown): Record<string, unknown>[] {
  if (!Array.isArray(value)) return [];
  return value.filter((item): item is Record<string, unknown> =>
    isObjectRecord(item),
  );
}

function buildCompoundDefaultItem(
  fields: RepeatableFieldDefinition[] | undefined,
): Record<string, unknown> {
  const next: Record<string, unknown> = {};
  if (!fields) return next;
  for (const field of fields) {
    if ("default" in field && field.default !== undefined) {
      next[field.key] = field.default;
    }
  }
  return next;
}

function ListTextItem({
  item,
  index,
  onCommit: onCommitProp,
  onDraftChange,
  onRemove,
  onMoveUp,
  onMoveDown,
  isFirst,
  isLast,
  disabled,
}: {
  item: string;
  index: number;
  onCommit: (index: number, nextValue: string) => void;
  onDraftChange: (index: number, nextValue: string) => void;
  onRemove: (index: number) => void;
  onMoveUp: (index: number) => void;
  onMoveDown: (index: number) => void;
  isFirst: boolean;
  isLast: boolean;
  disabled?: boolean;
}) {
  const handleCommit = useCallback(
    (local: string) => {
      if (local !== item) {
        onCommitProp(index, local);
      }
    },
    [index, item, onCommitProp],
  );

  const { inputProps } = useBufferedInput(item, handleCommit);

  const handleChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      inputProps.onChange(e);
      onDraftChange(index, e.target.value);
    },
    [inputProps.onChange, onDraftChange, index],
  );

  return (
    <div className="flex items-center gap-2">
      <Input
        aria-label={`List item ${index + 1}`}
        {...inputProps}
        onChange={handleChange}
        disabled={disabled}
        className="w-[200px]"
      />
      <Button
        type="button"
        variant="outline"
        size="sm"
        aria-label={`Move item ${index + 1} up`}
        onClick={() => onMoveUp(index)}
        disabled={disabled || isFirst}
      >
        Up
      </Button>
      <Button
        type="button"
        variant="outline"
        size="sm"
        aria-label={`Move item ${index + 1} down`}
        onClick={() => onMoveDown(index)}
        disabled={disabled || isLast}
      >
        Down
      </Button>
      <Button
        type="button"
        variant="outline"
        size="sm"
        aria-label={`Remove item ${index + 1}`}
        onClick={() => onRemove(index)}
        disabled={disabled}
      >
        Remove
      </Button>
    </div>
  );
}

export function SetteraRepeatableInput({ settingKey }: SetteraRepeatableInputProps) {
  const { value, setValue, error, definition, validate } =
    useSetteraSetting(settingKey);

  // Cast once — only used when isRepeatable is true
  const repDef = definition as RepeatableSetting;
  const isRepeatable = definition.type === "repeatable";
  const isDisabled = isRepeatable && Boolean(repDef.disabled);
  const hasError = error !== null;

  const textItems = useMemo(
    () => (isRepeatable && repDef.itemType === "text" ? toStringArray(value) : []),
    [isRepeatable, repDef.itemType, value],
  );

  const compoundItems = useMemo(
    () =>
      isRepeatable && repDef.itemType === "compound"
        ? toObjectArray(value)
        : ([] as Record<string, unknown>[]),
    [isRepeatable, repDef.itemType, value],
  );

  const itemCount =
    isRepeatable && repDef.itemType === "text" ? textItems.length : compoundItems.length;

  const compoundItemsRef = useRef(compoundItems);
  compoundItemsRef.current = compoundItems;

  const draftTextValuesRef = useRef<Record<number, string>>({});

  const getLatestTextItems = useCallback(() => {
    const next = [...textItems];
    for (const [rawIndex, draftValue] of Object.entries(
      draftTextValuesRef.current,
    )) {
      const index = Number(rawIndex);
      if (Number.isInteger(index) && index >= 0 && index < next.length) {
        next[index] = draftValue;
      }
    }
    return next;
  }, [textItems]);

  const handleDraftChange = useCallback((index: number, nextValue: string) => {
    draftTextValuesRef.current[index] = nextValue;
  }, []);

  const addItem = useCallback(() => {
    if (!isRepeatable) return;
    const currentTextItems =
      repDef.itemType === "text" ? getLatestTextItems() : undefined;
    const currentItems =
      repDef.itemType === "text"
        ? currentTextItems!
        : [...compoundItemsRef.current];

    if (repDef.validation?.maxItems !== undefined) {
      if (currentItems.length >= repDef.validation.maxItems) {
        void validate(currentItems);
        return;
      }
    }

    const next =
      repDef.itemType === "text"
        ? [...currentTextItems!, ""]
        : [
            ...compoundItemsRef.current,
            buildCompoundDefaultItem(repDef.itemFields),
          ];
    if (repDef.itemType === "compound") {
      compoundItemsRef.current = next as Record<string, unknown>[];
    }
    setValue(next);
    void validate(next);
  }, [
    isRepeatable,
    repDef.itemType,
    repDef.itemFields,
    repDef.validation?.maxItems,
    getLatestTextItems,
    setValue,
    validate,
  ]);

  const removeItem = useCallback(
    (index: number) => {
      if (!isRepeatable) return;
      const base =
        repDef.itemType === "text"
          ? getLatestTextItems()
          : compoundItemsRef.current;
      const next = base.filter((_, i) => i !== index);
      draftTextValuesRef.current = {};
      if (repDef.itemType === "compound") {
        compoundItemsRef.current = next as Record<string, unknown>[];
      }
      setValue(next);
      void validate(next);
    },
    [isRepeatable, repDef.itemType, getLatestTextItems, setValue, validate],
  );

  const moveItem = useCallback(
    (index: number, direction: "up" | "down") => {
      if (!isRepeatable) return;
      const targetIndex = direction === "up" ? index - 1 : index + 1;
      if (targetIndex < 0) return;

      const base =
        repDef.itemType === "text"
          ? getLatestTextItems()
          : [...compoundItemsRef.current];

      if (targetIndex >= base.length) return;

      const next = [...base];
      const current = next[index];
      next[index] = next[targetIndex];
      next[targetIndex] = current;

      if (repDef.itemType === "text") {
        draftTextValuesRef.current = {};
      } else {
        compoundItemsRef.current = next as Record<string, unknown>[];
      }

      setValue(next);
      void validate(next);
    },
    [isRepeatable, repDef.itemType, getLatestTextItems, setValue, validate],
  );

  const commitTextItem = useCallback(
    (index: number, nextValue: string) => {
      const next = getLatestTextItems();
      next[index] = nextValue;
      draftTextValuesRef.current[index] = nextValue;
      setValue(next);
      void validate(next);
    },
    [getLatestTextItems, setValue, validate],
  );

  const setCompoundField = useCallback(
    (itemIndex: number, fieldKey: string, nextValue: unknown) => {
      const next = compoundItemsRef.current.map((item, index) =>
        index === itemIndex ? { ...item, [fieldKey]: nextValue } : item,
      );
      compoundItemsRef.current = next;
      setValue(next);
      void validate(next);
    },
    [setValue, validate],
  );

  if (!isRepeatable) {
    return null;
  }

  if (repDef.itemType !== "text" && repDef.itemType !== "compound") {
    return (
      <div
        data-testid={`repeatable-${settingKey}`}
        aria-invalid={hasError}
        aria-describedby={hasError ? `settera-error-${settingKey}` : undefined}
        className="text-sm italic text-muted-foreground"
      >
        Repeatable item type &ldquo;{repDef.itemType}&rdquo; is not implemented yet.
      </div>
    );
  }

  const isAtMax =
    repDef.validation?.maxItems !== undefined &&
    itemCount >= repDef.validation.maxItems;

  return (
    <div
      data-testid={`repeatable-${settingKey}`}
      aria-invalid={hasError}
      aria-describedby={hasError ? `settera-error-${settingKey}` : undefined}
      className="flex flex-col gap-2"
    >
      {repDef.itemType === "text" &&
        textItems.map((item, index) => (
          <ListTextItem
            key={`${settingKey}-${index}`}
            item={item}
            index={index}
            onCommit={commitTextItem}
            onDraftChange={handleDraftChange}
            onRemove={removeItem}
            onMoveUp={(i) => moveItem(i, "up")}
            onMoveDown={(i) => moveItem(i, "down")}
            isFirst={index === 0}
            isLast={index === textItems.length - 1}
            disabled={isDisabled}
          />
        ))}

      {repDef.itemType === "compound" &&
        compoundItems.map((item, index) => (
          <div
            key={`${settingKey}-${index}`}
            className="rounded-md border p-3 flex flex-col gap-2"
          >
            {(repDef.itemFields ?? []).map((field) => (
              <div key={`${index}-${field.key}`} className="flex flex-col gap-1.5">
                <Label>{field.title}</Label>
                <SetteraFieldControl
                  field={field}
                  value={item[field.key]}
                  onChange={(nextValue) =>
                    setCompoundField(index, field.key, nextValue)
                  }
                  ariaLabel={`${field.title} ${index + 1}`}
                  disabled={isDisabled || Boolean(field.disabled)}
                />
              </div>
            ))}
            <div className="flex gap-1 mt-1">
              <Button
                type="button"
                variant="outline"
                size="sm"
                aria-label={`Move item ${index + 1} up`}
                onClick={() => moveItem(index, "up")}
                disabled={isDisabled || index === 0}
              >
                Up
              </Button>
              <Button
                type="button"
                variant="outline"
                size="sm"
                aria-label={`Move item ${index + 1} down`}
                onClick={() => moveItem(index, "down")}
                disabled={isDisabled || index === compoundItems.length - 1}
              >
                Down
              </Button>
              <Button
                type="button"
                variant="outline"
                size="sm"
                aria-label={`Remove item ${index + 1}`}
                onClick={() => removeItem(index)}
                disabled={isDisabled}
              >
                Remove
              </Button>
            </div>
          </div>
        ))}

      <Button
        type="button"
        variant="outline"
        size="sm"
        onClick={addItem}
        disabled={isDisabled || Boolean(isAtMax)}
        aria-label={`Add item to ${repDef.title}`}
        className="self-start"
      >
        Add item
      </Button>
    </div>
  );
}
