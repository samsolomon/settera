import React, { useCallback, useRef } from "react";
import * as Dialog from "@radix-ui/react-dialog";
import type { ActionSetting } from "@settera/schema";
import { ActionModalField } from "./ActionModalField.js";
import { useActionModalDraft } from "../hooks/useActionModalDraft.js";
import { PrimitiveButton } from "./SetteraPrimitives.js";

export interface ActionModalProps {
  definition: ActionSetting;
  isOpen: boolean;
  isLoading: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (payload: Record<string, unknown>) => void;
}

export function ActionModal({
  definition,
  isOpen,
  isLoading,
  onOpenChange,
  onSubmit,
}: ActionModalProps) {
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
    <Dialog.Root open={isOpen} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay
          style={{
            position: "fixed",
            inset: 0,
            backgroundColor: "var(--settera-overlay-bg, rgba(0, 0, 0, 0.5))",
            zIndex: 1000,
          }}
        />
        <Dialog.Content
          ref={contentRef}
          aria-label={modalConfig.title ?? definition.title}
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
            if (isLoading) {
              e.preventDefault();
            }
          }}
          onInteractOutside={(e) => {
            if (isLoading) {
              e.preventDefault();
            }
          }}
          style={{
            position: "fixed",
            top: "50%",
            left: "50%",
            transform: "translate(-50%, -50%)",
            backgroundColor: "var(--settera-dialog-bg, white)",
            borderRadius: "var(--settera-dialog-border-radius, 8px)",
            padding: "var(--settera-dialog-padding, 20px)",
            maxWidth: "640px",
            width: "calc(100% - 24px)",
            maxHeight: "calc(100vh - 40px)",
            overflow: "auto",
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
            {modalConfig.title ?? definition.title}
          </Dialog.Title>
          <Dialog.Description
            style={{
              margin: "0 0 12px 0",
              fontSize: "13px",
              color: "var(--settera-description-color, #6b7280)",
            }}
          >
            {modalConfig.description ?? "Review the fields and submit."}
          </Dialog.Description>

          <div
            style={{ display: "flex", flexDirection: "column", gap: "10px" }}
          >
            {modalConfig.fields.map((field) => (
              <label
                key={field.key}
                style={{
                  display: "flex",
                  flexDirection: "column",
                  gap: "4px",
                  fontSize: "13px",
                  color: "var(--settera-description-color, #4b5563)",
                }}
              >
                {field.title}
                <ActionModalField
                  field={field}
                  value={draftValues[field.key]}
                  onChange={(nextFieldValue) =>
                    setField(field.key, nextFieldValue)
                  }
                />
              </label>
            ))}
          </div>

          <div
            style={{
              marginTop: "14px",
              display: "flex",
              justifyContent: "flex-end",
              gap: "8px",
            }}
          >
            <Dialog.Close asChild>
              <PrimitiveButton
                type="button"
                disabled={isLoading}
                style={{
                  fontSize: "13px",
                  padding: "6px 10px",
                  borderRadius: "6px",
                  border: "1px solid #d1d5db",
                  backgroundColor: "#fff",
                  cursor: isLoading ? "not-allowed" : "pointer",
                }}
              >
                {modalConfig.cancelLabel ?? "Cancel"}
              </PrimitiveButton>
            </Dialog.Close>

            <PrimitiveButton
              type="button"
              onClick={handleSubmit}
              disabled={isLoading}
              style={{
                fontSize: "13px",
                padding: "6px 10px",
                borderRadius: "6px",
                border: "1px solid #d1d5db",
                backgroundColor: "#fff",
                cursor: isLoading ? "not-allowed" : "pointer",
              }}
            >
              {isLoading ? "Loading…" : (modalConfig.submitLabel ?? "Submit")}
            </PrimitiveButton>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
