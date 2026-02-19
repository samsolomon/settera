import React, { useCallback, useState } from "react";
import * as Dialog from "@radix-ui/react-dialog";
import { useSetteraSetting } from "@settera/react";
import type { CompoundFieldDefinition } from "@settera/schema";
import { useSetteraNavigation } from "../hooks/useSetteraNavigation.js";
import { useCompoundDraft } from "../hooks/useCompoundDraft.js";
import { useSaveAndClose } from "../hooks/useSaveAndClose.js";
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
    fields: CompoundFieldDefinition[];
  };
  value: unknown;
  setValue: (next: Record<string, unknown>) => void;
  validate: (next: Record<string, unknown>) => void;
  error: string | null;
  isDisabled: boolean;
}) {
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

  return (
    <div
      data-testid={`compound-${settingKey}`}
      aria-invalid={error !== null}
      aria-describedby={
        error !== null ? `settera-error-${settingKey}` : undefined
      }
    >
      <Dialog.Root open={isModalOpen} onOpenChange={handleOpenChange}>
        <Dialog.Trigger asChild>
          <PrimitiveButton
            type="button"
            disabled={isDisabled}
            style={{
              cursor: isDisabled ? "not-allowed" : "pointer",
              opacity: isDisabled ? "var(--settera-disabled-opacity, 0.5)" : undefined,
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
              zIndex: "var(--settera-z-overlay, 1000)" as unknown as number,
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
              backgroundColor:
                "var(--settera-dialog-bg, var(--settera-popover, white))",
              borderRadius: "var(--settera-dialog-border-radius, 8px)",
              padding: "var(--settera-dialog-padding, 16px)",
              maxWidth: "var(--settera-dialog-max-width, 640px)",
              width: "calc(100% - 24px)",
              boxShadow:
                "var(--settera-dialog-shadow, 0 20px 60px rgba(0, 0, 0, 0.15))",
              zIndex: "var(--settera-z-dialog, 1001)" as unknown as number,
            }}
          >
            <Dialog.Title
              style={{
                margin: "0 0 12px 0",
                fontSize: "16px",
                fontWeight: 600,
                color:
                  "var(--settera-title-color, var(--settera-foreground, #111827))",
              }}
            >
              {definition.title}
            </Dialog.Title>
            <Dialog.Description
              style={{
                margin: "0 0 12px 0",
                fontSize: "13px",
                color:
                  "var(--settera-description-color, var(--settera-muted-foreground, #6b7280))",
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
                Cancel
              </PrimitiveButton>
              <PrimitiveButton
                type="button"
                onClick={handleSave}
                disabled={isBusy}
                style={{
                  backgroundColor:
                    "var(--settera-button-primary-bg, var(--settera-primary, #2563eb))",
                  color:
                    "var(--settera-button-primary-color, var(--settera-primary-foreground, white))",
                  cursor: isBusy ? "not-allowed" : "pointer",
                }}
              >
                {isBusy ? "Saving\u2026" : "Save"}
              </PrimitiveButton>
            </div>
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
          cursor: isDisabled ? "not-allowed" : "pointer",
          // Disabled opacity is handled by PrimitiveButton via the disabled prop.
        }}
      >
        Open {title}
      </PrimitiveButton>
    </div>
  );
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
