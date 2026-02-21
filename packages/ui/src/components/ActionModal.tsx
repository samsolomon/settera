import React, { useCallback, useRef } from "react";
import * as Dialog from "@radix-ui/react-dialog";
import type { ActionModalConfig } from "@settera/schema";
import { token } from "@settera/schema";
import { ActionModalField } from "./ActionModalField.js";
import { useActionModalDraft } from "@settera/react";
import { PrimitiveButton, SETTERA_SYSTEM_FONT } from "./SetteraPrimitives.js";

export interface ActionModalProps {
  modalConfig: ActionModalConfig;
  title: string;
  isOpen: boolean;
  isLoading: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (payload: Record<string, unknown>) => void;
}

export function ActionModal({
  modalConfig,
  title,
  isOpen,
  isLoading,
  onOpenChange,
  onSubmit,
}: ActionModalProps) {
  const contentRef = useRef<HTMLDivElement>(null);
  const { draftValues, setField } = useActionModalDraft(
    modalConfig.fields,
    modalConfig.initialValues,
    isOpen,
  );

  const handleSubmit = useCallback(() => {
    onSubmit(draftValues);
  }, [draftValues, onSubmit]);

  return (
    <Dialog.Root open={isOpen} onOpenChange={onOpenChange}>
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
          ref={contentRef}
          aria-label={modalConfig.title ?? title}
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
            backgroundColor: token("dialog-bg"),
            borderRadius: token("dialog-border-radius"),
            padding: token("dialog-padding"),
            maxWidth: token("dialog-max-width"),
            width: "calc(100% - 24px)",
            maxHeight: "calc(100vh - 40px)",
            overflow: "auto",
            boxShadow: token("dialog-shadow"),
            zIndex: token("z-dialog") as unknown as number,
          }}
        >
          <div style={{ display: "flex", flexDirection: "column", gap: "6px", marginBottom: "16px" }}>
            <Dialog.Title
              style={{
                margin: 0,
                fontSize: "18px",
                fontWeight: 600,
                lineHeight: 1.3,
                color: token("title-color"),
              }}
            >
              {modalConfig.title ?? title}
            </Dialog.Title>
            <Dialog.Description
              style={{
                margin: 0,
                fontSize: "14px",
                lineHeight: 1.5,
                color: token("description-color"),
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
                  color: token("description-color"),
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
                  border: token("button-border"),
                  backgroundColor: token("button-secondary-bg"),
                  color: token("button-secondary-color"),
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
                border: token("button-border"),
                backgroundColor: token("button-primary-bg"),
                color: token("button-primary-color"),
                cursor: isLoading ? "not-allowed" : "pointer",
              }}
            >
              {isLoading ? "Loading\u2026" : (modalConfig.submitLabel ?? "Submit")}
            </PrimitiveButton>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
