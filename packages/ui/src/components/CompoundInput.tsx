import React, { useCallback, useState } from "react";
import * as Dialog from "@radix-ui/react-dialog";
import { useSetteraSetting, useCompoundDraft, useSaveAndClose } from "@settera/react";
import { token, type CompoundFieldDefinition } from "@settera/schema";
import { useSetteraNavigation } from "../hooks/useSetteraNavigation.js";
import { useSetteraLabels } from "../contexts/SetteraLabelsContext.js";
import {
  PrimitiveButton,
  SETTERA_SYSTEM_FONT,
} from "./SetteraPrimitives.js";
import { fieldShellStyle } from "./SetteraFieldPrimitives.js";
import { FieldControl } from "./FieldControl.js";

export interface CompoundInputProps {
  settingKey: string;
}

export function CompoundInput({ settingKey }: CompoundInputProps) {
  const { value, setValue, error, definition, validate } =
    useSetteraSetting(settingKey);

  if (definition.type !== "compound") {
    return null;
  }

  const isDisabled = Boolean(definition.disabled);

  if (definition.displayStyle === "modal") {
    return (
      <CompoundModal
        settingKey={settingKey}
        definition={definition}
        value={value}
        setValue={setValue}
        validate={validate}
        error={error}
        isDisabled={isDisabled}
      />
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
    <CompoundInline
      settingKey={settingKey}
      definition={definition}
      value={value}
      setValue={setValue}
      validate={validate}
      error={error}
      isDisabled={isDisabled}
    />
  );
}

// ---- Inline compound (instant-apply) ----

function CompoundInline({
  settingKey,
  definition,
  value,
  setValue,
  validate,
  error,
  isDisabled,
}: {
  settingKey: string;
  definition: { fields: CompoundFieldDefinition[] };
  value: unknown;
  setValue: (next: Record<string, unknown>) => void;
  validate: (next: Record<string, unknown>) => void;
  error: string | null;
  isDisabled: boolean;
}) {
  const { getFieldValue, updateField } = useCompoundDraft(
    value,
    definition.fields,
    setValue,
    validate,
  );

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
        gap: token("compound-gap"),
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

// ---- Modal compound (draft-based with Save / Cancel) ----

function CompoundModal({
  settingKey,
  definition,
  value,
  setValue,
  validate,
  error,
  isDisabled,
}: {
  settingKey: string;
  definition: {
    title: string;
    description?: string;
    buttonLabel?: string;
    fields: CompoundFieldDefinition[];
  };
  value: unknown;
  setValue: (next: Record<string, unknown>) => void;
  validate: (next: Record<string, unknown>) => void;
  error: string | null;
  isDisabled: boolean;
}) {
  const labels = useSetteraLabels();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const { saveStatus } = useSetteraSetting(settingKey);

  const { getFieldValue, updateField, commitDraft, resetDraft } =
    useCompoundDraft(value, definition.fields, setValue, validate, {
      draft: true,
    });

  const isSavingRef = React.useRef(false);

  const { trigger: triggerSave, isBusy } = useSaveAndClose(
    saveStatus,
    useCallback(() => {
      isSavingRef.current = false;
      setIsModalOpen(false);
    }, []),
  );

  const handleSave = useCallback(() => {
    commitDraft();
    isSavingRef.current = true;
    triggerSave();
  }, [commitDraft, triggerSave]);

  const handleCancel = useCallback(() => {
    resetDraft();
    setIsModalOpen(false);
  }, [resetDraft]);

  const handleOpenChange = useCallback(
    (open: boolean) => {
      if (!open && !isSavingRef.current) {
        resetDraft();
      }
      setIsModalOpen(open);
    },
    [resetDraft],
  );

  const valueSummary = summarizeCompoundValue(value, definition.fields);

  return (
    <div
      data-testid={`compound-${settingKey}`}
      aria-invalid={error !== null}
      aria-describedby={
        error !== null ? `settera-error-${settingKey}` : undefined
      }
      style={{ display: "flex", alignItems: "center", gap: "12px" }}
    >
      {valueSummary && (
        <span style={{ fontSize: "14px", color: token("muted-foreground") }}>
          {valueSummary}
        </span>
      )}
      <Dialog.Root open={isModalOpen} onOpenChange={handleOpenChange}>
        <Dialog.Trigger asChild>
          <PrimitiveButton
            type="button"
            disabled={isDisabled}
            style={{
              cursor: isDisabled ? "not-allowed" : "pointer",
              opacity: isDisabled ? token("disabled-opacity") : undefined,
            }}
          >
            {definition.buttonLabel ?? `${labels.edit} ${definition.title}`}
          </PrimitiveButton>
        </Dialog.Trigger>
        <Dialog.Portal>
          <Dialog.Overlay
            style={{
              position: "fixed",
              inset: 0,
              backgroundColor: token("overlay-bg"),
              zIndex: token("z-overlay") as unknown as number,
            }}
          />
          <Dialog.Content
            aria-label={`${labels.edit} ${definition.title}`}
            onEscapeKeyDown={(e) => e.stopPropagation()}
            style={{
              fontFamily: SETTERA_SYSTEM_FONT,
              position: "fixed",
              top: "50%",
              left: "50%",
              transform: "translate(-50%, -50%)",
              backgroundColor: token("dialog-bg"),
              borderRadius: token("dialog-border-radius"),
              padding: token("dialog-padding"),
              maxWidth: token("dialog-max-width"),
              width: "calc(100% - 24px)",
              boxShadow: token("dialog-shadow"),
              zIndex: token("z-dialog") as unknown as number,
            }}
          >
            <Dialog.Title
              style={{
                margin: "0 0 12px 0",
                fontSize: "16px",
                fontWeight: 600,
                color: token("title-color"),
              }}
            >
              {definition.title}
            </Dialog.Title>
            <Dialog.Description
              style={{
                margin: "0 0 12px 0",
                fontSize: "13px",
                color: token("description-color"),
              }}
            >
              {definition.description ?? `${labels.edit} ${definition.title}.`}
            </Dialog.Description>
            <form
              onSubmit={(e) => {
                e.preventDefault();
                if (!isBusy) handleSave();
              }}
            >
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
                  gap: "8px",
                }}
              >
                <PrimitiveButton
                  type="button"
                  onClick={handleCancel}
                  disabled={isBusy}
                  style={{
                    cursor: isBusy ? "not-allowed" : "pointer",
                  }}
                >
                  {labels.cancel}
                </PrimitiveButton>
                <PrimitiveButton
                  type="submit"
                  disabled={isBusy}
                  style={{
                    backgroundColor: token("button-primary-bg"),
                    color: token("button-primary-color"),
                    cursor: isBusy ? "not-allowed" : "pointer",
                  }}
                >
                  {isBusy ? labels.saving : labels.save}
                </PrimitiveButton>
              </div>
            </form>
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>
    </div>
  );
}

// ---- Page button ----

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
  const labels = useSetteraLabels();
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
        aria-label={`${labels.open} ${title}`}
        style={{
          cursor: isDisabled ? "not-allowed" : "pointer",
          // Disabled opacity is handled by PrimitiveButton via the disabled prop.
        }}
      >
        {labels.open} {title}
      </PrimitiveButton>
    </div>
  );
}

// ---- Helpers ----

function summarizeCompoundValue(
  value: unknown,
  fields: CompoundFieldDefinition[],
): string {
  if (typeof value !== "object" || value === null || Array.isArray(value)) return "";
  const obj = value as Record<string, unknown>;
  const parts: string[] = [];
  for (const field of fields) {
    const v = obj[field.key];
    if (v !== undefined && v !== null && v !== "") {
      parts.push(String(v));
    }
  }
  return parts.join(", ");
}

// ---- Shared field renderer ----

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
  getFieldValue: (field: CompoundFieldDefinition) => unknown;
  updateField: (fieldKey: string, nextFieldValue: unknown) => void;
  parentDisabled?: boolean;
  fullWidth?: boolean;
}) {
  return (
    <>
      {fields.map((field) => {
        const fieldId = `settera-compound-${settingKey}-${field.key}`;
        const fieldValue = getFieldValue(field);
        const effectiveDisabled = parentDisabled || Boolean(field.disabled);
        const effectiveReadOnly =
          "readonly" in field && Boolean(field.readonly);

        return (
          <label key={field.key} htmlFor={fieldId} style={fieldShellStyle}>
            {field.title}
            <FieldControl
              field={field}
              fieldId={fieldId}
              value={fieldValue}
              onChange={(nextValue) => updateField(field.key, nextValue)}
              disabled={effectiveDisabled}
              readOnly={effectiveReadOnly}
              showFocusRing
              fullWidth={fullWidth}
            />
          </label>
        );
      })}
    </>
  );
}
