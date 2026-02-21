"use client";

import React, { useCallback, useState } from "react";
import { useSetteraSetting, useCompoundDraft, useSaveAndClose } from "@settera/react";
import type { CompoundFieldDefinition } from "@settera/schema";
import { useSetteraNavigation } from "./use-settera-navigation";
import { SetteraFieldControl } from "./settera-field-control";
import { Button } from "@/components/ui/button";
import {
  ResponsiveDialog,
  ResponsiveDialogContent,
  ResponsiveDialogDescription,
  ResponsiveDialogFooter,
  ResponsiveDialogHeader,
  ResponsiveDialogTitle,
  ResponsiveDialogTrigger,
} from "./settera-responsive-dialog";
import { Label } from "@/components/ui/label";

export interface SetteraCompoundInputProps {
  settingKey: string;
}

export function SetteraCompoundInput({ settingKey }: SetteraCompoundInputProps) {
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
      className="flex flex-col gap-3 w-full md:w-[var(--settera-control-width,200px)]"
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
      <ResponsiveDialog open={isModalOpen} onOpenChange={handleOpenChange} preventDismiss={isBusy}>
        <ResponsiveDialogTrigger asChild>
          <Button variant="outline" disabled={isDisabled}>
            Edit {definition.title}
          </Button>
        </ResponsiveDialogTrigger>
        <ResponsiveDialogContent
          onInteractOutside={(e) => { if (isBusy) e.preventDefault(); }}
          onEscapeKeyDown={(e) => { if (isBusy) e.preventDefault(); }}
        >
          <ResponsiveDialogHeader>
            <ResponsiveDialogTitle>{definition.title}</ResponsiveDialogTitle>
            <ResponsiveDialogDescription>
              {definition.description ?? `Edit ${definition.title}.`}
            </ResponsiveDialogDescription>
          </ResponsiveDialogHeader>
          <div className="px-4 md:px-0">
            <CompoundFields
              settingKey={settingKey}
              fields={definition.fields}
              getFieldValue={getFieldValue}
              updateField={updateField}
              parentDisabled={isDisabled}
            />
          </div>
          <ResponsiveDialogFooter>
            <Button variant="outline" onClick={handleCancel} disabled={isBusy}>
              Cancel
            </Button>
            <Button onClick={handleSave} disabled={isBusy}>
              {isBusy ? "Saving\u2026" : "Save"}
            </Button>
          </ResponsiveDialogFooter>
        </ResponsiveDialogContent>
      </ResponsiveDialog>
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
      <Button
        variant="outline"
        onClick={() => openSubpage(settingKey)}
        disabled={isDisabled}
        aria-label={`Open ${title}`}
      >
        Open {title}
      </Button>
    </div>
  );
}

export function CompoundFields({
  settingKey,
  fields,
  getFieldValue,
  updateField,
  parentDisabled,
}: {
  settingKey: string;
  fields: CompoundFieldDefinition[];
  getFieldValue: (field: CompoundFieldDefinition) => unknown;
  updateField: (fieldKey: string, nextFieldValue: unknown) => void;
  parentDisabled?: boolean;
}) {
  return (
    <div className="flex flex-col gap-3">
      {fields.map((field) => {
        const fieldId = `settera-compound-${settingKey}-${field.key}`;
        const fieldValue = getFieldValue(field);
        const effectiveDisabled = parentDisabled || Boolean(field.disabled);
        const effectiveReadOnly =
          "readonly" in field && Boolean(field.readonly);

        return (
          <div key={field.key} className="flex flex-col gap-1.5">
            <Label htmlFor={fieldId}>{field.title}</Label>
            <SetteraFieldControl
              field={field}
              fieldId={fieldId}
              value={fieldValue}
              onChange={(nextValue) => updateField(field.key, nextValue)}
              disabled={effectiveDisabled}
              readOnly={effectiveReadOnly}
            />
          </div>
        );
      })}
    </div>
  );
}
