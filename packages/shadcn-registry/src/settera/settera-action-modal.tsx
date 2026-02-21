"use client";

import React, { useCallback, useRef } from "react";
import type { ActionSetting } from "@settera/schema";
import { useActionModalDraft } from "@settera/react";
import { SetteraActionModalField } from "./settera-action-modal-field";
import { Button } from "@/components/ui/button";
import {
  ResponsiveDialog,
  ResponsiveDialogContent,
  ResponsiveDialogDescription,
  ResponsiveDialogFooter,
  ResponsiveDialogHeader,
  ResponsiveDialogTitle,
} from "./settera-responsive-dialog";
import { Label } from "@/components/ui/label";

export interface SetteraActionModalProps {
  definition: ActionSetting;
  isOpen: boolean;
  isLoading: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (payload: Record<string, unknown>) => void;
}

export function SetteraActionModal({
  definition,
  isOpen,
  isLoading,
  onOpenChange,
  onSubmit,
}: SetteraActionModalProps) {
  const modalConfig = definition.modal;
  const contentRef = useRef<HTMLDivElement>(null);
  const { draftValues, setField } = useActionModalDraft(
    modalConfig?.fields,
    modalConfig?.initialValues,
    isOpen,
  );

  const handleSubmit = useCallback(() => {
    onSubmit(draftValues);
  }, [draftValues, onSubmit]);

  if (!modalConfig) {
    return null;
  }

  return (
    <ResponsiveDialog open={isOpen} onOpenChange={onOpenChange} preventDismiss={isLoading}>
      <ResponsiveDialogContent
        ref={contentRef}
        onOpenAutoFocus={(e) => {
          e.preventDefault();
          const firstControl = contentRef.current?.querySelector<HTMLElement>(
            "input:not([disabled]), select:not([disabled]), textarea:not([disabled]), button:not([disabled])",
          );
          firstControl?.focus();
        }}
        onEscapeKeyDown={(e) => {
          if (isLoading) {
            e.preventDefault();
            return;
          }
          e.stopPropagation();
        }}
        onPointerDownOutside={(e) => {
          if (isLoading) e.preventDefault();
        }}
        onInteractOutside={(e) => {
          if (isLoading) e.preventDefault();
        }}
      >
        <ResponsiveDialogHeader>
          <ResponsiveDialogTitle>{modalConfig.title ?? definition.title}</ResponsiveDialogTitle>
          <ResponsiveDialogDescription>
            {modalConfig.description ?? "Review the fields and submit."}
          </ResponsiveDialogDescription>
        </ResponsiveDialogHeader>

        <div className="flex flex-col gap-3 px-4 md:px-0">
          {modalConfig.fields.map((field) => (
            <div key={field.key} className="flex flex-col gap-1.5">
              <Label>{field.title}</Label>
              <SetteraActionModalField
                field={field}
                value={draftValues[field.key]}
                onChange={(nextFieldValue) =>
                  setField(field.key, nextFieldValue)
                }
              />
            </div>
          ))}
        </div>

        <ResponsiveDialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isLoading}
          >
            {modalConfig.cancelLabel ?? "Cancel"}
          </Button>
          <Button onClick={handleSubmit} disabled={isLoading}>
            {isLoading ? "Loading\u2026" : (modalConfig.submitLabel ?? "Submit")}
          </Button>
        </ResponsiveDialogFooter>
      </ResponsiveDialogContent>
    </ResponsiveDialog>
  );
}
