import React, { useCallback, useEffect, useRef, useState } from "react";
import * as Dialog from "@radix-ui/react-dialog";
import { useSetteraConfirm } from "@settera/react";
import { PrimitiveButton, PrimitiveInput, SETTERA_SYSTEM_FONT } from "./SetteraPrimitives.js";

/**
 * Modal confirmation dialog.
 * Renders when a setting with `confirm` config is changed via setValue.
 * Supports requireText, dangerous styling, and keyboard navigation.
 */
export function ConfirmDialog() {
  const { pendingConfirm, resolveConfirm } = useSetteraConfirm();
  const [inputValue, setInputValue] = useState("");
  const cancelRef = useRef<HTMLButtonElement>(null);

  // Reset input when dialog opens
  useEffect(() => {
    if (pendingConfirm) {
      setInputValue("");
    }
  }, [pendingConfirm]);

  const handleOpenChange = useCallback(
    (open: boolean) => {
      if (!open) resolveConfirm(false);
    },
    [resolveConfirm],
  );

  const handleConfirm = useCallback(() => {
    resolveConfirm(true, inputValue);
  }, [resolveConfirm, inputValue]);

  const handleCancel = useCallback(() => {
    resolveConfirm(false);
  }, [resolveConfirm]);

  if (!pendingConfirm) return null;

  const { config, dangerous } = pendingConfirm;
  const title = config.title ?? "Confirm";
  const confirmLabel = config.confirmLabel ?? "Confirm";
  const cancelLabel = config.cancelLabel ?? "Cancel";
  const requireText = config.requireText;
  const confirmDisabled = requireText ? inputValue !== requireText : false;

  return (
    <Dialog.Root open={Boolean(pendingConfirm)} onOpenChange={handleOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay
          data-testid="settera-confirm-overlay"
          style={{
            position: "fixed",
            inset: 0,
            backgroundColor: "var(--settera-overlay-bg, rgba(0, 0, 0, 0.5))",
            zIndex: "var(--settera-overlay-z-index, 1000)" as unknown as number,
          }}
        />
        <Dialog.Content
          aria-label={title}
          aria-modal="true"
          onEscapeKeyDown={(e) => {
            e.stopPropagation();
          }}
          onOpenAutoFocus={(e: Event) => {
            e.preventDefault();
            cancelRef.current?.focus();
          }}
          style={{
            fontFamily: SETTERA_SYSTEM_FONT,
            position: "fixed",
            top: "50%",
            left: "50%",
            transform: "translate(-50%, -50%)",
            backgroundColor: "var(--settera-dialog-bg, var(--settera-popover, white))",
            borderRadius: "var(--settera-dialog-border-radius, 8px)",
            padding: "var(--settera-dialog-padding, 24px)",
            maxWidth: "var(--settera-dialog-max-width, 420px)",
            width: "calc(100% - 24px)",
            boxShadow:
              "var(--settera-dialog-shadow, 0 20px 60px rgba(0, 0, 0, 0.15))",
            zIndex: "var(--settera-overlay-z-index, 1000)" as unknown as number,
          }}
        >
          <Dialog.Title
            style={{
              margin: "0 0 8px 0",
              fontSize: "var(--settera-dialog-title-font-size, 16px)",
              fontWeight: "var(--settera-dialog-title-font-weight, 600)",
              color: "var(--settera-dialog-title-color, var(--settera-popover-foreground, #111827))",
            }}
          >
            {title}
          </Dialog.Title>
          <Dialog.Description
            style={{
              margin: "0 0 16px 0",
              fontSize: "var(--settera-dialog-message-font-size, 14px)",
              color: "var(--settera-dialog-message-color, var(--settera-muted-foreground, #4b5563))",
              lineHeight: 1.5,
            }}
          >
            {config.message}
          </Dialog.Description>
          {requireText && (
            <div style={{ marginBottom: "16px" }}>
              <label
                style={{
                  display: "block",
                  fontSize: "var(--settera-dialog-label-font-size, 13px)",
                  color: "var(--settera-dialog-label-color, var(--settera-muted-foreground, #6b7280))",
                  marginBottom: "4px",
                }}
              >
                Type <strong>{requireText}</strong> to confirm
              </label>
              <PrimitiveInput
                type="text"
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                aria-label={`Type ${requireText} to confirm`}
                style={{
                  width: "100%",
                  padding: "8px 12px",
                  fontSize: "14px",
                  border:
                    "1px solid var(--settera-input-border-color, var(--settera-input, #d1d5db))",
                  borderRadius: "var(--settera-input-border-radius, 6px)",
                  boxSizing: "border-box",
                }}
              />
            </div>
          )}
          <div
            style={{
              display: "flex",
              justifyContent: "flex-end",
              gap: "8px",
            }}
          >
            <PrimitiveButton
              ref={cancelRef}
              type="button"
              onClick={handleCancel}
              style={{
                padding: "8px 16px",
                fontSize: "14px",
                fontWeight: 500,
                border: "1px solid var(--settera-button-border-color, var(--settera-input, #d1d5db))",
                borderRadius: "var(--settera-button-border-radius, 6px)",
                backgroundColor: "var(--settera-button-secondary-bg, var(--settera-card, white))",
                color: "var(--settera-button-secondary-color, var(--settera-card-foreground, #374151))",
                cursor: "pointer",
              }}
            >
              {cancelLabel}
            </PrimitiveButton>
            <PrimitiveButton
              type="button"
              onClick={handleConfirm}
              disabled={confirmDisabled}

              style={{
                padding: "8px 16px",
                fontSize: "14px",
                fontWeight: 500,
                border: dangerous
                  ? "1px solid var(--settera-button-dangerous-bg, var(--settera-destructive, #dc2626))"
                  : "none",
                borderRadius: "var(--settera-button-border-radius, 6px)",
                backgroundColor: dangerous
                  ? "var(--settera-button-dangerous-bg, var(--settera-destructive, #dc2626))"
                  : "var(--settera-button-primary-bg, var(--settera-primary, #2563eb))",
                color: dangerous
                  ? "var(--settera-button-dangerous-color, var(--settera-destructive-foreground, white))"
                  : "var(--settera-button-primary-color, var(--settera-primary-foreground, white))",
                cursor: confirmDisabled ? "not-allowed" : "pointer",
                opacity: confirmDisabled ? 0.5 : 1,
              }}
            >
              {confirmLabel}
            </PrimitiveButton>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
