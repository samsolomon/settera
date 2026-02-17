import React, { useCallback, useMemo, useRef } from "react";
import { useSetteraSetting } from "@settera/react";
import type {
  RepeatableFieldDefinition,
  TextSetting,
  SelectSetting,
  BooleanSetting,
} from "@settera/schema";
import { useBufferedInput } from "../hooks/useBufferedInput.js";

export interface RepeatableInputProps {
  settingKey: string;
}

function toStringArray(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return value.map((item) => (typeof item === "string" ? item : String(item)));
}

function isObjectRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function toObjectArray(value: unknown): Record<string, unknown>[] {
  if (!Array.isArray(value)) return [];
  return value.filter((item): item is Record<string, unknown> =>
    isObjectRecord(item),
  );
}

type RepeatableCompoundField = RepeatableFieldDefinition;

function buildCompoundDefaultItem(
  fields: RepeatableCompoundField[] | undefined,
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

function RepeatableCompoundFieldControl({
  field,
  itemIndex,
  value,
  onChange,
}: {
  field: RepeatableCompoundField;
  itemIndex: number;
  value: unknown;
  onChange: (itemIndex: number, fieldKey: string, nextValue: unknown) => void;
}) {
  const inputStyle: React.CSSProperties = {
    fontSize: "var(--settera-input-font-size, 14px)",
    padding: "var(--settera-input-padding, 6px 10px)",
    borderRadius: "var(--settera-input-border-radius, 6px)",
    border: "var(--settera-input-border, 1px solid #d1d5db)",
    width: "var(--settera-input-width, 200px)",
    color: "var(--settera-input-color, #111827)",
    backgroundColor: "var(--settera-input-bg, white)",
  };

  if (field.type === "text") {
    return (
      <RepeatableCompoundTextField
        field={field as TextSetting}
        itemIndex={itemIndex}
        value={value}
        onChange={onChange}
        inputStyle={inputStyle}
      />
    );
  }

  if (field.type === "number") {
    return (
      <RepeatableCompoundNumberField
        fieldKey={field.key}
        fieldTitle={field.title}
        itemIndex={itemIndex}
        value={value}
        onChange={onChange}
        inputStyle={inputStyle}
      />
    );
  }

  if (field.type === "select") {
    const selectField = field as SelectSetting;
    return (
      <select
        aria-label={`${field.title} ${itemIndex + 1}`}
        value={typeof value === "string" ? value : ""}
        onChange={(e) => onChange(itemIndex, field.key, e.target.value)}
        style={inputStyle}
      >
        <option value="">Select...</option>
        {selectField.options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    );
  }

  const booleanField = field as BooleanSetting;
  return (
    <input
      aria-label={`${booleanField.title} ${itemIndex + 1}`}
      type="checkbox"
      checked={Boolean(value)}
      onChange={(e) => onChange(itemIndex, booleanField.key, e.target.checked)}
      style={{ width: "16px", height: "16px" }}
    />
  );
}

function RepeatableCompoundTextField({
  field,
  itemIndex,
  value,
  onChange,
  inputStyle,
}: {
  field: TextSetting;
  itemIndex: number;
  value: unknown;
  onChange: (itemIndex: number, fieldKey: string, nextValue: unknown) => void;
  inputStyle: React.CSSProperties;
}) {
  const committed = typeof value === "string" ? value : "";
  const { inputProps } = useBufferedInput(committed, (local) => {
    onChange(itemIndex, field.key, local);
  });

  return (
    <input
      aria-label={`${field.title} ${itemIndex + 1}`}
      {...inputProps}
      type={field.inputType ?? "text"}
      style={inputStyle}
    />
  );
}

function RepeatableCompoundNumberField({
  fieldKey,
  fieldTitle,
  itemIndex,
  value,
  onChange,
  inputStyle,
}: {
  fieldKey: string;
  fieldTitle: string;
  itemIndex: number;
  value: unknown;
  onChange: (itemIndex: number, fieldKey: string, nextValue: unknown) => void;
  inputStyle: React.CSSProperties;
}) {
  const committed =
    value !== undefined && value !== null && !Number.isNaN(Number(value))
      ? String(value)
      : "";
  const { inputProps } = useBufferedInput(committed, (local) => {
    onChange(itemIndex, fieldKey, local === "" ? undefined : Number(local));
  });

  return (
    <input
      aria-label={`${fieldTitle} ${itemIndex + 1}`}
      {...inputProps}
      type="number"
      style={inputStyle}
    />
  );
}

export function RepeatableInput({ settingKey }: RepeatableInputProps) {
  const { value, setValue, error, definition, validate } =
    useSetteraSetting(settingKey);

  if (definition.type !== "repeatable") {
    return null;
  }

  const hasError = error !== null;

  const textItems = useMemo(
    () => (definition.itemType === "text" ? toStringArray(value) : []),
    [definition.itemType, value],
  );

  const compoundItems = useMemo(
    () =>
      definition.itemType === "compound"
        ? toObjectArray(value)
        : ([] as Record<string, unknown>[]),
    [definition.itemType, value],
  );

  const itemCount =
    definition.itemType === "text" ? textItems.length : compoundItems.length;

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
    const currentTextItems =
      definition.itemType === "text" ? getLatestTextItems() : undefined;
    const currentItems =
      definition.itemType === "text"
        ? currentTextItems!
        : [...compoundItemsRef.current];

    if (definition.validation?.maxItems !== undefined) {
      if (currentItems.length >= definition.validation.maxItems) {
        void validate(currentItems);
        return;
      }
    }

    const next =
      definition.itemType === "text"
        ? [...currentTextItems!, ""]
        : [
            ...compoundItemsRef.current,
            buildCompoundDefaultItem(definition.itemFields),
          ];
    if (definition.itemType === "compound") {
      compoundItemsRef.current = next as Record<string, unknown>[];
    }
    setValue(next);
    void validate(next);
  }, [
    definition.itemType,
    definition.itemFields,
    definition.validation?.maxItems,
    getLatestTextItems,
    setValue,
    validate,
  ]);

  const removeItem = useCallback(
    (index: number) => {
      const base =
        definition.itemType === "text"
          ? getLatestTextItems()
          : compoundItemsRef.current;
      const next = base.filter((_, i) => i !== index);
      draftTextValuesRef.current = {};
      if (definition.itemType === "compound") {
        compoundItemsRef.current = next as Record<string, unknown>[];
      }
      setValue(next);
      void validate(next);
    },
    [definition.itemType, getLatestTextItems, setValue, validate],
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

  if (definition.itemType !== "text" && definition.itemType !== "compound") {
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
    itemCount >= definition.validation.maxItems;

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
      {definition.itemType === "text" &&
        textItems.map((item, index) => (
          <ListTextItem
            key={`${settingKey}-${index}`}
            item={item}
            index={index}
            onCommit={commitTextItem}
            onDraftChange={handleDraftChange}
            onRemove={removeItem}
          />
        ))}

      {definition.itemType === "compound" &&
        compoundItems.map((item, index) => (
          <div
            key={`${settingKey}-${index}`}
            style={{
              border: "1px solid #e5e7eb",
              borderRadius: "8px",
              padding: "10px",
              display: "flex",
              flexDirection: "column",
              gap: "8px",
            }}
          >
            {(definition.itemFields ?? []).map((field) => (
              <label
                key={`${index}-${field.key}`}
                style={{
                  display: "flex",
                  flexDirection: "column",
                  gap: "4px",
                  fontSize: "13px",
                }}
              >
                {field.title}
                <RepeatableCompoundFieldControl
                  field={field}
                  itemIndex={index}
                  value={item[field.key]}
                  onChange={setCompoundField}
                />
              </label>
            ))}

            <button
              type="button"
              aria-label={`Remove item ${index + 1}`}
              onClick={() => removeItem(index)}
              style={{
                alignSelf: "flex-start",
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
