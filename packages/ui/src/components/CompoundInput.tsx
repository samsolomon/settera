import React, { useCallback, useState } from "react";
import * as Dialog from "@radix-ui/react-dialog";
import { useSetteraSetting } from "@settera/react";
import type {
  CompoundFieldDefinition,
  BooleanSetting,
  SelectSetting,
  MultiSelectSetting,
} from "@settera/schema";
import { useBufferedInput } from "../hooks/useBufferedInput.js";
import { useSetteraNavigation } from "../hooks/useSetteraNavigation.js";
import { useCompoundDraft } from "../hooks/useCompoundDraft.js";
import {
  PrimitiveButton,
  PrimitiveInput,
  inputBaseStyle,
  SETTERA_SYSTEM_FONT,
} from "./SetteraPrimitives.js";
import {
  fieldShellStyle,
  PrimitiveCheckboxControl,
  PrimitiveCheckboxList,
  PrimitiveSelectControl,
  smallCheckboxStyle,
  stackGapStyle,
} from "./SetteraFieldPrimitives.js";

export interface CompoundInputProps {
  settingKey: string;
}

type CompoundField = CompoundFieldDefinition;

export function CompoundInput({ settingKey }: CompoundInputProps) {
  const { value, setValue, error, definition, validate } =
    useSetteraSetting(settingKey);
  const [isModalOpen, setIsModalOpen] = useState(false);

  if (definition.type !== "compound") {
    return null;
  }

  const isDisabled = Boolean(definition.disabled);

  const { getFieldValue, updateField } = useCompoundDraft(
    value,
    definition.fields,
    setValue,
    validate,
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
            <PrimitiveButton
              type="button"
              disabled={isDisabled}
              style={{
                padding: "6px 10px",
                cursor: isDisabled ? "not-allowed" : "pointer",
                opacity: isDisabled ? 0.6 : 1,
              }}
            >
              Edit {definition.title}
            </PrimitiveButton>
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
                fontFamily: SETTERA_SYSTEM_FONT,
                position: "fixed",
                top: "50%",
                left: "50%",
                transform: "translate(-50%, -50%)",
                backgroundColor: "var(--settera-dialog-bg, var(--settera-popover, white))",
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
                  color: "var(--settera-title-color, var(--settera-foreground, #111827))",
                }}
              >
                {definition.title}
              </Dialog.Title>
              <Dialog.Description
                style={{
                  margin: "0 0 12px 0",
                  fontSize: "13px",
                  color: "var(--settera-description-color, var(--settera-muted-foreground, #6b7280))",
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
                  <PrimitiveButton
                    type="button"
                    style={{
                      padding: "6px 10px",
                      cursor: "pointer",
                    }}
                  >
                    Done
                  </PrimitiveButton>
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
      <CompoundPageButton
        settingKey={settingKey}
        title={definition.title}
        isDisabled={isDisabled}
        hasError={error !== null}
      />
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

function CompoundPageButton({
  settingKey,
  title,
  isDisabled,
  hasError,
}: {
  settingKey: string;
  title: string;
  isDisabled: boolean;
  hasError: boolean;
}) {
  const { openSubpage } = useSetteraNavigation();

  return (
    <div
      data-testid={`compound-${settingKey}`}
      aria-invalid={hasError}
      aria-describedby={hasError ? `settera-error-${settingKey}` : undefined}
    >
      <PrimitiveButton
        type="button"
        onClick={() => openSubpage(settingKey)}
        disabled={isDisabled}
        aria-label={`Open ${title}`}
        style={{
          alignSelf: "flex-start",
          padding: "6px 10px",
          cursor: isDisabled ? "not-allowed" : "pointer",
          opacity: isDisabled ? 0.6 : 1,
        }}
      >
        Open {title}
      </PrimitiveButton>
    </div>
  );
}

export function CompoundFields({
  settingKey,
  fields,
  getFieldValue,
  updateField,
  parentDisabled,
  fullWidth,
}: {
  settingKey: string;
  fields: CompoundFieldDefinition[];
  getFieldValue: (field: CompoundField) => unknown;
  updateField: (fieldKey: string, nextFieldValue: unknown) => void;
  parentDisabled?: boolean;
  fullWidth?: boolean;
}) {
  return (
    <>
      {fields.map((field) => {
        const fieldId = `settera-compound-${settingKey}-${field.key}`;
        const fieldValue = getFieldValue(field);

        return (
          <label key={field.key} htmlFor={fieldId} style={fieldShellStyle}>
            {field.title}
            {renderFieldControl(
              field,
              fieldId,
              fieldValue,
              updateField,
              parentDisabled,
              fullWidth,
            )}
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
  fullWidth?: boolean,
) {
  const effectiveDisabled = parentDisabled || Boolean(field.disabled);
  const effectiveReadOnly = "readonly" in field && Boolean(field.readonly);

  switch (field.type) {
    case "boolean":
      return renderBooleanField(
        field,
        fieldId,
        fieldValue,
        onChange,
        effectiveDisabled,
      );
    case "text":
      return (
        <CompoundTextField
          field={field}
          fieldId={fieldId}
          fieldValue={fieldValue}
          onChange={onChange}
          disabled={effectiveDisabled}
          readOnly={effectiveReadOnly}
          fullWidth={fullWidth}
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
          fullWidth={fullWidth}
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
          fullWidth={fullWidth}
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
          fullWidth={fullWidth}
        />
      );
    case "multiselect":
      return renderMultiSelectField(
        field,
        fieldId,
        fieldValue,
        onChange,
        effectiveDisabled,
      );
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
  fullWidth,
}: {
  field: Extract<CompoundField, { type: "text" }>;
  fieldId: string;
  fieldValue: unknown;
  onChange: (fieldKey: string, value: unknown) => void;
  disabled?: boolean;
  readOnly?: boolean;
  fullWidth?: boolean;
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
    <PrimitiveInput
      id={fieldId}
      type={field.inputType ?? "text"}
      {...inputProps}
      disabled={disabled}
      readOnly={readOnly}
      focusVisible={isFocused}
      style={{
        ...inputStyles,
        ...(fullWidth && { width: "100%" }),
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
  fullWidth,
}: {
  field: Extract<CompoundField, { type: "number" }>;
  fieldId: string;
  fieldValue: unknown;
  onChange: (fieldKey: string, value: unknown) => void;
  disabled?: boolean;
  readOnly?: boolean;
  fullWidth?: boolean;
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
    <PrimitiveInput
      id={fieldId}
      type="number"
      {...inputProps}
      disabled={disabled}
      readOnly={readOnly}
      focusVisible={isFocused}
      style={{
        ...inputStyles,
        ...(fullWidth && { width: "100%" }),
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
  fullWidth,
}: {
  field: Extract<CompoundField, { type: "date" }>;
  fieldId: string;
  fieldValue: unknown;
  onChange: (fieldKey: string, value: unknown) => void;
  disabled?: boolean;
  readOnly?: boolean;
  fullWidth?: boolean;
}) {
  const [isFocused, setIsFocused] = useState(false);

  return (
    <PrimitiveInput
      id={fieldId}
      type="date"
      value={typeof fieldValue === "string" ? fieldValue : ""}
      onChange={(e) => onChange(field.key, e.target.value)}
      onFocus={() => setIsFocused(true)}
      onBlur={() => setIsFocused(false)}
      disabled={disabled}
      readOnly={readOnly}
      focusVisible={isFocused}
      style={{
        ...inputStyles,
        ...(fullWidth && { width: "100%" }),
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
  fullWidth,
}: {
  field: SelectSetting;
  fieldId: string;
  fieldValue: unknown;
  onChange: (fieldKey: string, value: unknown) => void;
  disabled?: boolean;
  fullWidth?: boolean;
}) {
  const [isFocused, setIsFocused] = useState(false);

  return (
    <PrimitiveSelectControl
      id={fieldId}
      value={typeof fieldValue === "string" ? fieldValue : ""}
      options={field.options}
      onChange={(nextValue) => onChange(field.key, nextValue)}
      onFocus={() => setIsFocused(true)}
      onBlur={() => setIsFocused(false)}
      focusVisible={isFocused}
      disabled={disabled}
      style={{
        ...inputStyles,
        ...(fullWidth && { width: "100%" }),
      }}
    />
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
    <PrimitiveCheckboxControl
      id={fieldId}
      checked={Boolean(fieldValue)}
      onChange={(nextChecked) => onChange(field.key, nextChecked)}
      disabled={disabled}
      style={smallCheckboxStyle}
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
    <PrimitiveCheckboxList
      options={field.options}
      selected={selected}
      disabled={disabled}
      style={stackGapStyle}
      onToggle={(optionValue, checked) => {
        const next = checked
          ? [...selected, optionValue]
          : selected.filter((v) => v !== optionValue);
        onChange(field.key, next);
      }}
    />
  );
}

const inputStyles: React.CSSProperties = {
  ...inputBaseStyle,
  border: "var(--settera-input-border, 1px solid var(--settera-input, #d1d5db))",
  width: "var(--settera-input-width, 200px)",
};
