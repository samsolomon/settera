import React, { useCallback, useEffect, useRef, useState } from "react";
import * as Dialog from "@radix-ui/react-dialog";
import { token } from "@settera/schema";
import { useSetteraConfirm } from "@settera/react";
import { useSetteraLabels } from "../contexts/SetteraLabelsContext.js";
import { PrimitiveButton, PrimitiveInput, SETTERA_SYSTEM_FONT } from "./SetteraPrimitives.js";

/**
 * Modal confirmation dialog.
 * Renders when a setting with `confirm` config is changed via setValue.
 * Supports requireText, dangerous styling, and keyboard navigation.
 */
export function ConfirmDialog() {
  const { pendingConfirm, resolveConfirm } = useSetteraConfirm();
  const labels = useSetteraLabels();
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
  const title = config.title ?? labels.confirm;
  const confirmLabel = config.confirmLabel ?? labels.confirm;
  const cancelLabel = config.cancelLabel ?? labels.cancel;
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
            backgroundColor: token("overlay-bg"),
            zIndex: token("z-overlay") as unknown as number, // CSS var needs cast for React CSSProperties
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
            backgroundColor: token("dialog-bg"),
            borderRadius: token("dialog-border-radius"),
            padding: token("dialog-padding"),
            maxWidth: token("confirm-max-width"), // Separate from --settera-dialog-max-width (640px) — confirms are narrower
            width: "calc(100% - 24px)",
            boxShadow: token("dialog-shadow"),
            zIndex: token("z-dialog") as unknown as number,
          }}
        >
          <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
            <Dialog.Title
              style={{
                margin: 0,
                fontSize: token("dialog-title-font-size"),
                fontWeight: token("dialog-title-font-weight"),
                lineHeight: 1.3,
                color: token("dialog-title-color"),
              }}
            >
              {title}
            </Dialog.Title>
            <Dialog.Description
              style={{
                margin: 0,
                fontSize: token("dialog-message-font-size"),
                color: token("dialog-message-color"),
                lineHeight: 1.5,
              }}
            >
              {config.message}
            </Dialog.Description>
          </div>
          {requireText && (
            <div style={{ marginTop: "16px" }}>
              <label
                style={{
                  display: "block",
                  fontSize: token("dialog-label-font-size"),
                  color: token("dialog-label-color"),
                  marginBottom: "4px",
                }}
              >
                {labels.typeToConfirm.split("{text}")[0]}<strong>{requireText}</strong>{labels.typeToConfirm.split("{text}")[1]}
              </label>
              <PrimitiveInput
                type="text"
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                aria-label={labels.typeToConfirm.replace("{text}", requireText)}
                style={{
                  width: "100%",
                  padding: "8px 12px",
                  fontSize: "14px",
                  border: token("input-border"),
                  borderRadius: token("input-border-radius"),
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
              marginTop: "16px",
            }}
          >
            <PrimitiveButton
              ref={cancelRef}
              type="button"
              onClick={handleCancel}
              style={{
                border: token("button-border"),
                backgroundColor: token("button-secondary-bg"),
                color: token("button-secondary-color"),
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
                border: dangerous
                  ? `1px solid ${token("button-dangerous-bg")}`
                  : "none",
                backgroundColor: dangerous
                  ? token("button-dangerous-bg")
                  : token("button-primary-bg"),
                color: dangerous
                  ? token("button-dangerous-color")
                  : token("button-primary-color"),
                cursor: confirmDisabled ? "not-allowed" : "pointer",
                opacity: confirmDisabled ? token("disabled-opacity") : 1,
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
