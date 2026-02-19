import React, { useCallback, useRef } from "react";
import * as Dialog from "@radix-ui/react-dialog";
import type { ActionSetting } from "@settera/schema";
import { ActionModalField } from "./ActionModalField.js";
import { useActionModalDraft } from "@settera/react";
import { PrimitiveButton, SETTERA_SYSTEM_FONT } from "./SetteraPrimitives.js";

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
            zIndex: "var(--settera-z-overlay, 1000)" as unknown as number,
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
            fontFamily: SETTERA_SYSTEM_FONT,
            position: "fixed",
            top: "50%",
            left: "50%",
            transform: "translate(-50%, -50%)",
            backgroundColor: "var(--settera-dialog-bg, var(--settera-popover, white))",
            borderRadius: "var(--settera-dialog-border-radius, 8px)",
            padding: "var(--settera-dialog-padding, 16px)",
            maxWidth: "var(--settera-dialog-max-width, 640px)",
            width: "calc(100% - 24px)",
            maxHeight: "calc(100vh - 40px)",
            overflow: "auto",
            boxShadow:
              "var(--settera-dialog-shadow, 0 20px 60px rgba(0, 0, 0, 0.15))",
            zIndex: "var(--settera-z-dialog, 1001)" as unknown as number,
          }}
        >
          <div style={{ display: "flex", flexDirection: "column", gap: "6px", marginBottom: "16px" }}>
            <Dialog.Title
              style={{
                margin: 0,
                fontSize: "18px",
                fontWeight: 600,
                lineHeight: 1.3,
                color: "var(--settera-title-color, var(--settera-foreground, #111827))",
              }}
            >
              {modalConfig.title ?? definition.title}
            </Dialog.Title>
            <Dialog.Description
              style={{
                margin: 0,
                fontSize: "14px",
                lineHeight: 1.5,
                color: "var(--settera-description-color, var(--settera-muted-foreground, #6b7280))",
              }}
            >
              {modalConfig.description ?? "Review the fields and submit."}
            </Dialog.Description>
          </div>

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
                  color: "var(--settera-description-color, var(--settera-muted-foreground, #6b7280))",
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
              marginTop: "16px",
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
                  border:
                    "var(--settera-button-border, 1px solid var(--settera-input, #d1d5db))",
                  backgroundColor:
                    "var(--settera-button-secondary-bg, var(--settera-card, white))",
                  color:
                    "var(--settera-button-secondary-color, var(--settera-card-foreground, #374151))",
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
                border:
                  "var(--settera-button-border, 1px solid var(--settera-input, #d1d5db))",
                backgroundColor:
                  "var(--settera-button-primary-bg, var(--settera-primary, #2563eb))",
                color:
                  "var(--settera-button-primary-color, var(--settera-primary-foreground, white))",
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
