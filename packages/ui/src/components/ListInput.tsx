import React, { useCallback, useMemo, useRef } from "react";
import { useSetteraSetting, useBufferedInput, isObjectRecord } from "@settera/react";
import { token, type RepeatableFieldDefinition } from "@settera/schema";
import { useSetteraLabels } from "../contexts/SetteraLabelsContext.js";
import {
  PrimitiveButton,
  PrimitiveInput,
  inputBaseStyle,
} from "./SetteraPrimitives.js";
import {
  fieldShellStyle,
  inlineRowStyle,
  sectionPanelStyle,
  smallActionButtonStyle,
} from "./SetteraFieldPrimitives.js";
import { FieldControl } from "./FieldControl.js";

export interface RepeatableInputProps {
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

  // Compose onChange to also notify parent of draft changes
  const handleChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      inputProps.onChange(e);
      onDraftChange(index, e.target.value);
    },
    [inputProps, onDraftChange, index],
  );

  const labels = useSetteraLabels();

  return (
    <div style={inlineRowStyle}>
      <PrimitiveInput
        aria-label={`List item ${index + 1}`}
        {...inputProps}
        onChange={handleChange}
        disabled={disabled}
        style={repeatableInputStyle}
      />

      <PrimitiveButton
        type="button"
        aria-label={`Move item ${index + 1} up`}
        onClick={() => onMoveUp(index)}
        disabled={disabled || isFirst}
        style={{
          ...smallActionButtonStyle,
          cursor: disabled || isFirst ? "not-allowed" : "pointer",
          opacity: disabled || isFirst ? token("disabled-opacity") : undefined,
        }}
      >
        {labels.up}
      </PrimitiveButton>

      <PrimitiveButton
        type="button"
        aria-label={`Move item ${index + 1} down`}
        onClick={() => onMoveDown(index)}
        disabled={disabled || isLast}
        style={{
          ...smallActionButtonStyle,
          cursor: disabled || isLast ? "not-allowed" : "pointer",
          opacity: disabled || isLast ? token("disabled-opacity") : undefined,
        }}
      >
        {labels.down}
      </PrimitiveButton>

      <PrimitiveButton
        type="button"
        aria-label={`Remove item ${index + 1}`}
        onClick={() => onRemove(index)}
        disabled={disabled}
        style={{
          ...smallActionButtonStyle,
          cursor: disabled ? "not-allowed" : "pointer",
          opacity: disabled ? token("disabled-opacity") : undefined,
        }}
      >
        {labels.remove}
      </PrimitiveButton>
    </div>
  );
}

function RepeatableCompoundFieldControl({
  field,
  itemIndex,
  value,
  onChange,
  parentDisabled,
}: {
  field: RepeatableCompoundField;
  itemIndex: number;
  value: unknown;
  onChange: (itemIndex: number, fieldKey: string, nextValue: unknown) => void;
  parentDisabled?: boolean;
}) {
  const effectiveDisabled = parentDisabled || Boolean(field.disabled);

  return (
    <FieldControl
      field={field}
      value={value}
      onChange={(nextValue) => onChange(itemIndex, field.key, nextValue)}
      ariaLabel={`${field.title} ${itemIndex + 1}`}
      disabled={effectiveDisabled}
      inputStyle={repeatableInputStyle}
    />
  );
}

export function RepeatableInput({ settingKey }: RepeatableInputProps) {
  const { value, setValue, error, definition, validate } =
    useSetteraSetting(settingKey);
  const labels = useSetteraLabels();
  const isRepeatable = definition.type === "repeatable";
  const itemType = isRepeatable ? definition.itemType : undefined;
  const maxItems = isRepeatable ? definition.validation?.maxItems : undefined;
  const itemFields = isRepeatable ? definition.itemFields : undefined;
  const isDisabled = Boolean(definition.disabled);
  const hasError = error !== null;

  const textItems = useMemo(
    () => (itemType === "text" ? toStringArray(value) : []),
    [itemType, value],
  );

  const compoundItems = useMemo(
    () => (itemType === "compound" ? toObjectArray(value) : []),
    [itemType, value],
  );

  const itemCount = itemType === "text" ? textItems.length : compoundItems.length;

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
    const currentTextItems = itemType === "text" ? getLatestTextItems() : undefined;
    const currentItems =
      itemType === "text" ? currentTextItems! : [...compoundItemsRef.current];

    if (maxItems !== undefined && currentItems.length >= maxItems) {
      void validate(currentItems);
      return;
    }

    const next =
      itemType === "text"
        ? [...currentTextItems!, ""]
        : [...compoundItemsRef.current, buildCompoundDefaultItem(itemFields)];
    if (itemType === "compound") {
      compoundItemsRef.current = next as Record<string, unknown>[];
    }
    setValue(next);
    void validate(next);
  }, [
    itemType,
    itemFields,
    maxItems,
    getLatestTextItems,
    setValue,
    validate,
  ]);

  const removeItem = useCallback(
    (index: number) => {
      const base =
        itemType === "text" ? getLatestTextItems() : compoundItemsRef.current;
      const next = base.filter((_, i) => i !== index);
      draftTextValuesRef.current = {};
      if (itemType === "compound") {
        compoundItemsRef.current = next as Record<string, unknown>[];
      }
      setValue(next);
      void validate(next);
    },
    [itemType, getLatestTextItems, setValue, validate],
  );

  const moveItem = useCallback(
    (index: number, direction: "up" | "down") => {
      const targetIndex = direction === "up" ? index - 1 : index + 1;
      if (targetIndex < 0) return;

      const base =
        itemType === "text" ? getLatestTextItems() : [...compoundItemsRef.current];

      if (targetIndex >= base.length) return;

      const next = [...base];
      const current = next[index];
      next[index] = next[targetIndex];
      next[targetIndex] = current;

      if (itemType === "text") {
        draftTextValuesRef.current = {};
      } else {
        compoundItemsRef.current = next as Record<string, unknown>[];
      }

      setValue(next);
      void validate(next);
    },
    [itemType, getLatestTextItems, setValue, validate],
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

  if (itemType !== "text" && itemType !== "compound") {
    return (
      <div
        data-testid={`repeatable-${settingKey}`}
        aria-invalid={hasError}
        aria-describedby={hasError ? `settera-error-${settingKey}` : undefined}
        style={{
          fontSize: token("description-font-size"),
          color: token("description-color"),
          fontStyle: "italic",
        }}
      >
        Repeatable item type "{itemType}" is not implemented yet.
      </div>
    );
  }

  const isAtMax = maxItems !== undefined && itemCount >= maxItems;

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
      {itemType === "text" &&
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

      {itemType === "compound" &&
        compoundItems.map((item, index) => (
          <div
            key={`${settingKey}-${index}`}
            style={{
              ...sectionPanelStyle,
              padding: "10px",
            }}
          >
            {(itemFields ?? []).map((field) => (
              <label key={`${index}-${field.key}`} style={fieldShellStyle}>
                {field.title}
                <RepeatableCompoundFieldControl
                  field={field}
                  itemIndex={index}
                  value={item[field.key]}
                  onChange={setCompoundField}
                  parentDisabled={isDisabled}
                />
              </label>
            ))}

            <PrimitiveButton
              type="button"
              aria-label={`Move item ${index + 1} up`}
              onClick={() => moveItem(index, "up")}
              disabled={isDisabled || index === 0}
              style={{
                alignSelf: "flex-start",
                ...smallActionButtonStyle,
                cursor: isDisabled || index === 0 ? "not-allowed" : "pointer",
                opacity: isDisabled || index === 0 ? token("disabled-opacity") : undefined,
              }}
            >
              {labels.up}
            </PrimitiveButton>

            <PrimitiveButton
              type="button"
              aria-label={`Move item ${index + 1} down`}
              onClick={() => moveItem(index, "down")}
              disabled={isDisabled || index === compoundItems.length - 1}
              style={{
                alignSelf: "flex-start",
                ...smallActionButtonStyle,
                cursor:
                  isDisabled || index === compoundItems.length - 1
                    ? "not-allowed"
                    : "pointer",
                opacity:
                  isDisabled || index === compoundItems.length - 1 ? token("disabled-opacity") : undefined,
              }}
            >
              {labels.down}
            </PrimitiveButton>

            <PrimitiveButton
              type="button"
              aria-label={`Remove item ${index + 1}`}
              onClick={() => removeItem(index)}
              disabled={isDisabled}
              style={{
                alignSelf: "flex-start",
                ...smallActionButtonStyle,
                cursor: isDisabled ? "not-allowed" : "pointer",
                opacity: isDisabled ? token("disabled-opacity") : undefined,
              }}
            >
              {labels.remove}
            </PrimitiveButton>
          </div>
        ))}

      <PrimitiveButton
        type="button"
        onClick={addItem}
        disabled={isDisabled || Boolean(isAtMax)}
        aria-label={`Add item to ${definition.title}`}
        style={{
          alignSelf: "flex-start",
          padding: "4px 10px",
          cursor: isDisabled || isAtMax ? "not-allowed" : "pointer",
          opacity: isDisabled || isAtMax ? token("disabled-opacity") : undefined,
        }}
      >
        {labels.addItem}
      </PrimitiveButton>
    </div>
  );
}

const repeatableInputStyle: React.CSSProperties = {
  ...inputBaseStyle,
  border: token("input-border"),
  width: token("input-width"),
};
