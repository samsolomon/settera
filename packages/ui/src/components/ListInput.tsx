import React, { useCallback, useMemo, useRef } from "react";
import { useSetteraSetting } from "@settera/react";
import type {
  RepeatableFieldDefinition,
  TextSetting,
  SelectSetting,
  MultiSelectSetting,
  BooleanSetting,
} from "@settera/schema";
import { useBufferedInput } from "../hooks/useBufferedInput.js";
import {
  PrimitiveButton,
  PrimitiveInput,
  inputBaseStyle,
} from "./SetteraPrimitives.js";
import {
  fieldShellStyle,
  inlineRowStyle,
  PrimitiveCheckboxControl,
  PrimitiveCheckboxList,
  PrimitiveSelectControl,
  sectionPanelStyle,
  smallActionButtonStyle,
  smallCheckboxStyle,
  stackGapStyle,
} from "./SetteraFieldPrimitives.js";

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
    [inputProps.onChange, onDraftChange, index],
  );

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
          opacity: disabled || isFirst ? 0.6 : 1,
        }}
      >
        Up
      </PrimitiveButton>

      <PrimitiveButton
        type="button"
        aria-label={`Move item ${index + 1} down`}
        onClick={() => onMoveDown(index)}
        disabled={disabled || isLast}
        style={{
          ...smallActionButtonStyle,
          cursor: disabled || isLast ? "not-allowed" : "pointer",
          opacity: disabled || isLast ? 0.6 : 1,
        }}
      >
        Down
      </PrimitiveButton>

      <PrimitiveButton
        type="button"
        aria-label={`Remove item ${index + 1}`}
        onClick={() => onRemove(index)}
        disabled={disabled}
        style={{
          ...smallActionButtonStyle,
          cursor: disabled ? "not-allowed" : "pointer",
          opacity: disabled ? 0.6 : 1,
        }}
      >
        Remove
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
  const inputStyle = repeatableInputStyle;

  if (field.type === "text") {
    return (
      <RepeatableCompoundTextField
        field={field as TextSetting}
        itemIndex={itemIndex}
        value={value}
        onChange={onChange}
        inputStyle={inputStyle}
        disabled={effectiveDisabled}
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
        disabled={effectiveDisabled}
      />
    );
  }

  if (field.type === "select") {
    const selectField = field as SelectSetting;
    return (
      <PrimitiveSelectControl
        ariaLabel={`${field.title} ${itemIndex + 1}`}
        value={typeof value === "string" ? value : ""}
        options={selectField.options}
        onChange={(nextValue) => onChange(itemIndex, field.key, nextValue)}
        disabled={effectiveDisabled}
        style={inputStyle}
      />
    );
  }

  if (field.type === "multiselect") {
    const multiField = field as MultiSelectSetting;
    const selected = Array.isArray(value)
      ? value.filter((item): item is string => typeof item === "string")
      : [];
    return (
      <PrimitiveCheckboxList
        ariaLabel={`${field.title} ${itemIndex + 1}`}
        options={multiField.options}
        selected={selected}
        disabled={effectiveDisabled}
        onToggle={(optionValue, checked) => {
          const next = checked
            ? [...selected, optionValue]
            : selected.filter((v) => v !== optionValue);
          onChange(itemIndex, field.key, next);
        }}
      />
    );
  }

  if (field.type === "date") {
    return (
      <PrimitiveInput
        aria-label={`${field.title} ${itemIndex + 1}`}
        type="date"
        value={typeof value === "string" ? value : ""}
        onChange={(e) => onChange(itemIndex, field.key, e.target.value)}
        disabled={effectiveDisabled}
        style={inputStyle}
      />
    );
  }

  const booleanField = field as BooleanSetting;
  return (
    <PrimitiveCheckboxControl
      ariaLabel={`${booleanField.title} ${itemIndex + 1}`}
      checked={Boolean(value)}
      onChange={(nextChecked) =>
        onChange(itemIndex, booleanField.key, nextChecked)
      }
      disabled={effectiveDisabled}
      style={smallCheckboxStyle}
    />
  );
}

function RepeatableCompoundTextField({
  field,
  itemIndex,
  value,
  onChange,
  inputStyle,
  disabled,
}: {
  field: TextSetting;
  itemIndex: number;
  value: unknown;
  onChange: (itemIndex: number, fieldKey: string, nextValue: unknown) => void;
  inputStyle: React.CSSProperties;
  disabled?: boolean;
}) {
  const committed = typeof value === "string" ? value : "";
  const { inputProps } = useBufferedInput(committed, (local) => {
    onChange(itemIndex, field.key, local);
  });

  return (
    <PrimitiveInput
      aria-label={`${field.title} ${itemIndex + 1}`}
      {...inputProps}
      type={field.inputType ?? "text"}
      disabled={disabled}
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
  disabled,
}: {
  fieldKey: string;
  fieldTitle: string;
  itemIndex: number;
  value: unknown;
  onChange: (itemIndex: number, fieldKey: string, nextValue: unknown) => void;
  inputStyle: React.CSSProperties;
  disabled?: boolean;
}) {
  const committed =
    value !== undefined && value !== null && !Number.isNaN(Number(value))
      ? String(value)
      : "";
  const { inputProps } = useBufferedInput(committed, (local) => {
    onChange(itemIndex, fieldKey, local === "" ? undefined : Number(local));
  });

  return (
    <PrimitiveInput
      aria-label={`${fieldTitle} ${itemIndex + 1}`}
      {...inputProps}
      type="number"
      disabled={disabled}
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

  const isDisabled = Boolean(definition.disabled);
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

  const moveItem = useCallback(
    (index: number, direction: "up" | "down") => {
      const targetIndex = direction === "up" ? index - 1 : index + 1;
      if (targetIndex < 0) return;

      const base =
        definition.itemType === "text"
          ? getLatestTextItems()
          : [...compoundItemsRef.current];

      if (targetIndex >= base.length) return;

      const next = [...base];
      const current = next[index];
      next[index] = next[targetIndex];
      next[targetIndex] = current;

      if (definition.itemType === "text") {
        draftTextValuesRef.current = {};
      } else {
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
            onMoveUp={(i) => moveItem(i, "up")}
            onMoveDown={(i) => moveItem(i, "down")}
            isFirst={index === 0}
            isLast={index === textItems.length - 1}
            disabled={isDisabled}
          />
        ))}

      {definition.itemType === "compound" &&
        compoundItems.map((item, index) => (
          <div
            key={`${settingKey}-${index}`}
            style={{
              ...sectionPanelStyle,
              padding: "10px",
            }}
          >
            {(definition.itemFields ?? []).map((field) => (
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
                opacity: isDisabled || index === 0 ? 0.6 : 1,
              }}
            >
              Up
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
                  isDisabled || index === compoundItems.length - 1 ? 0.6 : 1,
              }}
            >
              Down
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
                opacity: isDisabled ? 0.6 : 1,
              }}
            >
              Remove
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
          opacity: isDisabled || isAtMax ? 0.6 : 1,
        }}
      >
        Add item
      </PrimitiveButton>
    </div>
  );
}

const repeatableInputStyle: React.CSSProperties = {
  ...inputBaseStyle,
  border: "var(--settera-input-border, 1px solid #d1d5db)",
  width: "var(--settera-input-width, 200px)",
};
