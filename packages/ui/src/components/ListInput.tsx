import React, { useCallback, useMemo, useRef } from "react";
import { useSetteraSetting } from "@settera/react";
import { useBufferedInput } from "../hooks/useBufferedInput.js";

export interface RepeatableInputProps {
  settingKey: string;
}

function toStringArray(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return value.map((item) => (typeof item === "string" ? item : String(item)));
}

function ListTextItem({
  item,
  index,
  onCommit: onCommitProp,
  onDraftChange,
  onRemove,
}: {
  item: string;
  index: number;
  onCommit: (index: number, nextValue: string) => void;
  onDraftChange: (index: number, nextValue: string) => void;
  onRemove: (index: number) => void;
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

  // Compose onChange to also notify parent of draft changes
  const handleChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      inputProps.onChange(e);
      onDraftChange(index, e.target.value);
    },
    [inputProps.onChange, onDraftChange, index],
  );

  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: "8px",
      }}
    >
      <input
        aria-label={`List item ${index + 1}`}
        {...inputProps}
        onChange={handleChange}
        style={{
          fontSize: "var(--settera-input-font-size, 14px)",
          padding: "var(--settera-input-padding, 6px 10px)",
          borderRadius: "var(--settera-input-border-radius, 6px)",
          border: "var(--settera-input-border, 1px solid #d1d5db)",
          width: "var(--settera-input-width, 200px)",
          color: "var(--settera-input-color, #111827)",
          backgroundColor: "var(--settera-input-bg, white)",
        }}
      />

      <button
        type="button"
        aria-label={`Remove item ${index + 1}`}
        onClick={() => onRemove(index)}
        style={{
          fontSize: "var(--settera-button-font-size, 13px)",
          padding: "4px 8px",
          borderRadius: "var(--settera-button-border-radius, 6px)",
          border: "var(--settera-button-border, 1px solid #d1d5db)",
          backgroundColor: "var(--settera-button-bg, white)",
          cursor: "pointer",
        }}
      >
        Remove
      </button>
    </div>
  );
}

export function RepeatableInput({ settingKey }: RepeatableInputProps) {
  const { value, setValue, error, definition, validate } =
    useSetteraSetting(settingKey);

  if (definition.type !== "repeatable") {
    return null;
  }

  const hasError = error !== null;

  const items = useMemo(() => {
    if (definition.itemType === "text") {
      return toStringArray(value);
    }
    return Array.isArray(value) ? value : [];
  }, [definition.itemType, value]);

  const draftTextValuesRef = useRef<Record<number, string>>({});

  const getLatestTextItems = useCallback(() => {
    const next = toStringArray(items);
    for (const [rawIndex, draftValue] of Object.entries(
      draftTextValuesRef.current,
    )) {
      const index = Number(rawIndex);
      if (Number.isInteger(index) && index >= 0 && index < next.length) {
        next[index] = draftValue;
      }
    }
    return next;
  }, [items]);

  const handleDraftChange = useCallback((index: number, nextValue: string) => {
    draftTextValuesRef.current[index] = nextValue;
  }, []);

  const addItem = useCallback(() => {
    const currentTextItems =
      definition.itemType === "text" ? getLatestTextItems() : undefined;
    const currentItems = currentTextItems ?? items;

    if (definition.validation?.maxItems !== undefined) {
      if (currentItems.length >= definition.validation.maxItems) {
        void validate(currentItems);
        return;
      }
    }

    const next =
      definition.itemType === "text"
        ? [...currentTextItems!, ""]
        : [...items, {}];
    setValue(next);
    void validate(next);
  }, [
    definition.itemType,
    definition.validation?.maxItems,
    getLatestTextItems,
    items,
    setValue,
    validate,
  ]);

  const removeItem = useCallback(
    (index: number) => {
      const base =
        definition.itemType === "text" ? getLatestTextItems() : items;
      const next = base.filter((_, i) => i !== index);
      draftTextValuesRef.current = {};
      setValue(next);
      void validate(next);
    },
    [definition.itemType, getLatestTextItems, items, setValue, validate],
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

  if (definition.itemType !== "text") {
    return (
      <div
        data-testid={`repeatable-${settingKey}`}
        aria-invalid={hasError}
        aria-describedby={hasError ? `settera-error-${settingKey}` : undefined}
        style={{
          fontSize: "var(--settera-description-font-size, 13px)",
          color: "var(--settera-description-color, #6b7280)",
          fontStyle: "italic",
        }}
      >
        Repeatable item type "{definition.itemType}" is not implemented yet.
      </div>
    );
  }

  const isAtMax =
    definition.validation?.maxItems !== undefined &&
    items.length >= definition.validation.maxItems;

  return (
    <div
      data-testid={`repeatable-${settingKey}`}
      aria-invalid={hasError}
      aria-describedby={hasError ? `settera-error-${settingKey}` : undefined}
      style={{
        display: "flex",
        flexDirection: "column",
        gap: "8px",
      }}
    >
      {toStringArray(items).map((item, index) => (
        <ListTextItem
          key={`${settingKey}-${index}`}
          item={item}
          index={index}
          onCommit={commitTextItem}
          onDraftChange={handleDraftChange}
          onRemove={removeItem}
        />
      ))}

      <button
        type="button"
        onClick={addItem}
        disabled={Boolean(isAtMax)}
        aria-label={`Add item to ${definition.title}`}
        style={{
          alignSelf: "flex-start",
          fontSize: "var(--settera-button-font-size, 13px)",
          padding: "4px 10px",
          borderRadius: "var(--settera-button-border-radius, 6px)",
          border: "var(--settera-button-border, 1px solid #d1d5db)",
          backgroundColor: "var(--settera-button-bg, white)",
          cursor: isAtMax ? "not-allowed" : "pointer",
          opacity: isAtMax ? 0.6 : 1,
        }}
      >
        Add item
      </button>
    </div>
  );
}
