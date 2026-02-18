import React, { useMemo, useCallback, useState } from "react";
import * as Dialog from "@radix-ui/react-dialog";
import { useSetteraSetting } from "@settera/react";
import type {
  CompoundFieldDefinition,
  BooleanSetting,
  SelectSetting,
  MultiSelectSetting,
} from "@settera/schema";
import { useBufferedInput } from "../hooks/useBufferedInput.js";

export interface CompoundInputProps {
  settingKey: string;
}

type CompoundField = CompoundFieldDefinition;

function isObjectRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

export function CompoundInput({ settingKey }: CompoundInputProps) {
  const { value, setValue, error, definition, validate } =
    useSetteraSetting(settingKey);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isPageOpen, setIsPageOpen] = useState(false);

  if (definition.type !== "compound") {
    return null;
  }

  const isDisabled = Boolean(definition.disabled);

  const compoundValue = useMemo(
    () => (isObjectRecord(value) ? value : {}),
    [value],
  );

  const effectiveValue = useMemo(() => {
    const merged: Record<string, unknown> = {};
    for (const field of definition.fields) {
      if ("default" in field && field.default !== undefined) {
        merged[field.key] = field.default;
      }
    }
    return { ...merged, ...compoundValue };
  }, [compoundValue, definition.fields]);

  const getFieldValue = useCallback(
    (field: CompoundField): unknown => {
      return effectiveValue[field.key];
    },
    [effectiveValue],
  );

  const updateField = useCallback(
    (fieldKey: string, nextFieldValue: unknown) => {
      const nextValue = { ...effectiveValue, [fieldKey]: nextFieldValue };
      setValue(nextValue);
      validate(nextValue);
    },
    [effectiveValue, setValue, validate],
  );

  if (definition.displayStyle === "modal") {
    return (
      <div
        data-testid={`compound-${settingKey}`}
        aria-invalid={error !== null}
        aria-describedby={
          error !== null ? `settera-error-${settingKey}` : undefined
        }
      >
        <Dialog.Root open={isModalOpen} onOpenChange={setIsModalOpen}>
          <Dialog.Trigger asChild>
            <button
              type="button"
              disabled={isDisabled}
              style={{
                fontSize: "var(--settera-button-font-size, 13px)",
                padding: "6px 10px",
                borderRadius: "var(--settera-button-border-radius, 6px)",
                border: "var(--settera-button-border, 1px solid #d1d5db)",
                backgroundColor: "var(--settera-button-bg, white)",
                cursor: isDisabled ? "not-allowed" : "pointer",
                opacity: isDisabled ? 0.6 : 1,
              }}
            >
              Edit {definition.title}
            </button>
          </Dialog.Trigger>
          <Dialog.Portal>
            <Dialog.Overlay
              style={{
                position: "fixed",
                inset: 0,
                backgroundColor:
                  "var(--settera-overlay-bg, rgba(0, 0, 0, 0.5))",
                zIndex: 1000,
              }}
            />
            <Dialog.Content
              aria-label={`Edit ${definition.title}`}
              onEscapeKeyDown={(e) => e.stopPropagation()}
              style={{
                position: "fixed",
                top: "50%",
                left: "50%",
                transform: "translate(-50%, -50%)",
                backgroundColor: "var(--settera-dialog-bg, white)",
                borderRadius: "var(--settera-dialog-border-radius, 8px)",
                padding: "var(--settera-dialog-padding, 20px)",
                maxWidth: "560px",
                width: "calc(100% - 24px)",
                boxShadow:
                  "var(--settera-dialog-shadow, 0 20px 60px rgba(0, 0, 0, 0.15))",
                zIndex: 1001,
              }}
            >
              <Dialog.Title
                style={{
                  margin: "0 0 12px 0",
                  fontSize: "16px",
                  fontWeight: 600,
                  color: "var(--settera-title-color, #111827)",
                }}
              >
                {definition.title}
              </Dialog.Title>
              <Dialog.Description
                style={{
                  margin: "0 0 12px 0",
                  fontSize: "13px",
                  color: "var(--settera-description-color, #6b7280)",
                }}
              >
                {definition.description ?? `Edit ${definition.title}.`}
              </Dialog.Description>
              <CompoundFields
                settingKey={settingKey}
                fields={definition.fields}
                getFieldValue={getFieldValue}
                updateField={updateField}
                parentDisabled={isDisabled}
              />
              <div
                style={{
                  marginTop: "12px",
                  display: "flex",
                  justifyContent: "flex-end",
                }}
              >
                <Dialog.Close asChild>
                  <button
                    type="button"
                    style={{
                      fontSize: "var(--settera-button-font-size, 13px)",
                      padding: "6px 10px",
                      borderRadius: "var(--settera-button-border-radius, 6px)",
                      border: "var(--settera-button-border, 1px solid #d1d5db)",
                      backgroundColor: "var(--settera-button-bg, white)",
                      cursor: "pointer",
                    }}
                  >
                    Done
                  </button>
                </Dialog.Close>
              </div>
            </Dialog.Content>
          </Dialog.Portal>
        </Dialog.Root>
      </div>
    );
  }

  if (definition.displayStyle === "page") {
    return (
      <div
        data-testid={`compound-${settingKey}`}
        aria-invalid={error !== null}
        aria-describedby={
          error !== null ? `settera-error-${settingKey}` : undefined
        }
        style={{ display: "flex", flexDirection: "column", gap: "8px" }}
      >
        <button
          type="button"
          onClick={() => setIsPageOpen((open) => !open)}
          disabled={isDisabled}
          aria-expanded={isPageOpen}
          aria-controls={`compound-page-panel-${settingKey}`}
          style={{
            alignSelf: "flex-start",
            fontSize: "var(--settera-button-font-size, 13px)",
            padding: "6px 10px",
            borderRadius: "var(--settera-button-border-radius, 6px)",
            border: "var(--settera-button-border, 1px solid #d1d5db)",
            backgroundColor: "var(--settera-button-bg, white)",
            cursor: isDisabled ? "not-allowed" : "pointer",
            opacity: isDisabled ? 0.6 : 1,
          }}
        >
          {isPageOpen ? "Close" : "Open"} {definition.title}
        </button>

        {isPageOpen && (
          <div
            data-testid={`compound-page-panel-${settingKey}`}
            id={`compound-page-panel-${settingKey}`}
            style={{
              border: "1px solid #e5e7eb",
              borderRadius: "10px",
              padding: "12px",
            }}
          >
            <CompoundFields
              settingKey={settingKey}
              fields={definition.fields}
              getFieldValue={getFieldValue}
              updateField={updateField}
            />
          </div>
        )}
      </div>
    );
  }

  return (
    <div
      data-testid={`compound-${settingKey}`}
      aria-invalid={error !== null}
      aria-describedby={
        error !== null ? `settera-error-${settingKey}` : undefined
      }
      style={{
        display: "flex",
        flexDirection: "column",
        gap: "var(--settera-compound-gap, 10px)",
      }}
    >
      <CompoundFields
        settingKey={settingKey}
        fields={definition.fields}
        getFieldValue={getFieldValue}
        updateField={updateField}
        parentDisabled={isDisabled}
      />
    </div>
  );
}

function CompoundFields({
  settingKey,
  fields,
  getFieldValue,
  updateField,
  parentDisabled,
}: {
  settingKey: string;
  fields: CompoundFieldDefinition[];
  getFieldValue: (field: CompoundField) => unknown;
  updateField: (fieldKey: string, nextFieldValue: unknown) => void;
  parentDisabled?: boolean;
}) {
  return (
    <>
      {fields.map((field) => {
        const fieldId = `settera-compound-${settingKey}-${field.key}`;
        const fieldValue = getFieldValue(field);

        return (
          <label
            key={field.key}
            htmlFor={fieldId}
            style={{
              display: "flex",
              flexDirection: "column",
              gap: "4px",
              fontSize: "var(--settera-description-font-size, 13px)",
              color: "var(--settera-description-color, #4b5563)",
            }}
          >
            {field.title}
            {renderFieldControl(field, fieldId, fieldValue, updateField, parentDisabled)}
          </label>
        );
      })}
    </>
  );
}

function renderFieldControl(
  field: CompoundField,
  fieldId: string,
  fieldValue: unknown,
  onChange: (fieldKey: string, value: unknown) => void,
  parentDisabled?: boolean,
) {
  const effectiveDisabled = parentDisabled || Boolean(field.disabled);
  const effectiveReadOnly =
    "readonly" in field && Boolean(field.readonly);

  switch (field.type) {
    case "boolean":
      return renderBooleanField(field, fieldId, fieldValue, onChange, effectiveDisabled);
    case "text":
      return (
        <CompoundTextField
          field={field}
          fieldId={fieldId}
          fieldValue={fieldValue}
          onChange={onChange}
          disabled={effectiveDisabled}
          readOnly={effectiveReadOnly}
        />
      );
    case "number":
      return (
        <CompoundNumberField
          field={field}
          fieldId={fieldId}
          fieldValue={fieldValue}
          onChange={onChange}
          disabled={effectiveDisabled}
          readOnly={effectiveReadOnly}
        />
      );
    case "date":
      return (
        <CompoundDateField
          field={field}
          fieldId={fieldId}
          fieldValue={fieldValue}
          onChange={onChange}
          disabled={effectiveDisabled}
          readOnly={effectiveReadOnly}
        />
      );
    case "select":
      return (
        <CompoundSelectField
          field={field}
          fieldId={fieldId}
          fieldValue={fieldValue}
          onChange={onChange}
          disabled={effectiveDisabled}
        />
      );
    case "multiselect":
      return renderMultiSelectField(field, fieldId, fieldValue, onChange, effectiveDisabled);
    default:
      return null;
  }
}

function CompoundTextField({
  field,
  fieldId,
  fieldValue,
  onChange,
  disabled,
  readOnly,
}: {
  field: Extract<CompoundField, { type: "text" }>;
  fieldId: string;
  fieldValue: unknown;
  onChange: (fieldKey: string, value: unknown) => void;
  disabled?: boolean;
  readOnly?: boolean;
}) {
  const committed = typeof fieldValue === "string" ? fieldValue : "";

  const onCommit = useCallback(
    (local: string) => {
      if (local !== committed) {
        onChange(field.key, local);
      }
    },
    [committed, field.key, onChange],
  );

  const { inputProps, isFocused } = useBufferedInput(committed, onCommit);

  return (
    <input
      id={fieldId}
      type={field.inputType ?? "text"}
      {...inputProps}
      disabled={disabled}
      readOnly={readOnly}
      style={{
        ...inputStyles,
        boxShadow: isFocused
          ? "0 0 0 2px var(--settera-focus-ring-color, #93c5fd)"
          : "none",
      }}
    />
  );
}

function CompoundNumberField({
  field,
  fieldId,
  fieldValue,
  onChange,
  disabled,
  readOnly,
}: {
  field: Extract<CompoundField, { type: "number" }>;
  fieldId: string;
  fieldValue: unknown;
  onChange: (fieldKey: string, value: unknown) => void;
  disabled?: boolean;
  readOnly?: boolean;
}) {
  const committed =
    fieldValue !== undefined && fieldValue !== null ? String(fieldValue) : "";

  const onCommit = useCallback(
    (local: string) => {
      if (local === "") {
        if (committed !== "") {
          onChange(field.key, undefined);
        }
        return;
      }
      const num = Number(local);
      if (Number.isNaN(num)) return;
      if (local !== committed) {
        onChange(field.key, num);
      }
    },
    [committed, field.key, onChange],
  );

  const { inputProps, isFocused } = useBufferedInput(committed, onCommit);

  return (
    <input
      id={fieldId}
      type="number"
      {...inputProps}
      disabled={disabled}
      readOnly={readOnly}
      style={{
        ...inputStyles,
        boxShadow: isFocused
          ? "0 0 0 2px var(--settera-focus-ring-color, #93c5fd)"
          : "none",
      }}
    />
  );
}

function CompoundDateField({
  field,
  fieldId,
  fieldValue,
  onChange,
  disabled,
  readOnly,
}: {
  field: Extract<CompoundField, { type: "date" }>;
  fieldId: string;
  fieldValue: unknown;
  onChange: (fieldKey: string, value: unknown) => void;
  disabled?: boolean;
  readOnly?: boolean;
}) {
  const [isFocused, setIsFocused] = useState(false);

  return (
    <input
      id={fieldId}
      type="date"
      value={typeof fieldValue === "string" ? fieldValue : ""}
      onChange={(e) => onChange(field.key, e.target.value)}
      onFocus={() => setIsFocused(true)}
      onBlur={() => setIsFocused(false)}
      disabled={disabled}
      readOnly={readOnly}
      style={{
        ...inputStyles,
        boxShadow: isFocused
          ? "0 0 0 2px var(--settera-focus-ring-color, #93c5fd)"
          : "none",
      }}
    />
  );
}

function CompoundSelectField({
  field,
  fieldId,
  fieldValue,
  onChange,
  disabled,
}: {
  field: SelectSetting;
  fieldId: string;
  fieldValue: unknown;
  onChange: (fieldKey: string, value: unknown) => void;
  disabled?: boolean;
}) {
  const [isFocused, setIsFocused] = useState(false);

  return (
    <select
      id={fieldId}
      value={typeof fieldValue === "string" ? fieldValue : ""}
      onChange={(e) => onChange(field.key, e.target.value)}
      onFocus={() => setIsFocused(true)}
      onBlur={() => setIsFocused(false)}
      disabled={disabled}
      style={{
        ...inputStyles,
        boxShadow: isFocused
          ? "0 0 0 2px var(--settera-focus-ring-color, #93c5fd)"
          : "none",
      }}
    >
      <option value="">Select...</option>
      {field.options.map((opt) => (
        <option key={opt.value} value={opt.value}>
          {opt.label}
        </option>
      ))}
    </select>
  );
}

function renderBooleanField(
  field: BooleanSetting,
  fieldId: string,
  fieldValue: unknown,
  onChange: (fieldKey: string, value: unknown) => void,
  disabled?: boolean,
) {
  return (
    <input
      id={fieldId}
      type="checkbox"
      checked={Boolean(fieldValue)}
      onChange={(e) => onChange(field.key, e.target.checked)}
      disabled={disabled}
      style={{
        width: "var(--settera-checkbox-size, 16px)",
        height: "var(--settera-checkbox-size, 16px)",
      }}
    />
  );
}

function renderMultiSelectField(
  field: MultiSelectSetting,
  fieldId: string,
  fieldValue: unknown,
  onChange: (fieldKey: string, value: unknown) => void,
  disabled?: boolean,
) {
  const selected = Array.isArray(fieldValue)
    ? fieldValue.filter((item): item is string => typeof item === "string")
    : [];

  return (
    <div
      id={fieldId}
      style={{ display: "flex", flexDirection: "column", gap: "4px" }}
    >
      {field.options.map((opt) => {
        const checked = selected.includes(opt.value);
        return (
          <label
            key={opt.value}
            style={{ display: "inline-flex", alignItems: "center", gap: "6px" }}
          >
            <input
              type="checkbox"
              checked={checked}
              disabled={disabled}
              onChange={(e) => {
                const next = e.target.checked
                  ? [...selected, opt.value]
                  : selected.filter((v) => v !== opt.value);
                onChange(field.key, next);
              }}
            />
            {opt.label}
          </label>
        );
      })}
    </div>
  );
}

const inputStyles: React.CSSProperties = {
  fontSize: "var(--settera-input-font-size, 14px)",
  padding: "var(--settera-input-padding, 6px 10px)",
  borderRadius: "var(--settera-input-border-radius, 6px)",
  border: "var(--settera-input-border, 1px solid #d1d5db)",
  width: "var(--settera-input-width, 200px)",
  color: "var(--settera-input-color, #111827)",
  backgroundColor: "var(--settera-input-bg, white)",
};
