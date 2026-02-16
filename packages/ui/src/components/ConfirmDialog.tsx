import React, { useCallback, useEffect, useRef, useState } from "react";
import { useSettaraConfirm } from "@settara/react";

/**
 * Modal confirmation dialog.
 * Renders when a setting with `confirm` config is changed via setValue.
 * Supports requireText, dangerous styling, and keyboard navigation.
 */
export function ConfirmDialog() {
  const { pendingConfirm, resolveConfirm } = useSettaraConfirm();
  const [inputValue, setInputValue] = useState("");
  const cancelRef = useRef<HTMLButtonElement>(null);

  // Reset input when dialog opens
  useEffect(() => {
    if (pendingConfirm) {
      setInputValue("");
    }
  }, [pendingConfirm]);

  // Auto-focus cancel button on open
  useEffect(() => {
    if (pendingConfirm) {
      cancelRef.current?.focus();
    }
  }, [pendingConfirm]);

  // Document-level Escape handler — works regardless of focus location
  useEffect(() => {
    if (!pendingConfirm) return;
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.stopPropagation();
        resolveConfirm(false);
      }
    };
    document.addEventListener("keydown", handleEscape);
    return () => document.removeEventListener("keydown", handleEscape);
  }, [pendingConfirm, resolveConfirm]);

  const handleBackdropClick = useCallback(
    (e: React.MouseEvent) => {
      if (e.target === e.currentTarget) {
        resolveConfirm(false);
      }
    },
    [resolveConfirm],
  );

  if (!pendingConfirm) return null;

  const { config, dangerous } = pendingConfirm;
  const title = config.title ?? "Confirm";
  const confirmLabel = config.confirmLabel ?? "Confirm";
  const cancelLabel = config.cancelLabel ?? "Cancel";
  const requireText = config.requireText;
  const confirmDisabled = requireText ? inputValue !== requireText : false;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={title}
      onClick={handleBackdropClick}
      style={{
        position: "fixed",
        inset: 0,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        backgroundColor: "var(--settara-overlay-bg, rgba(0, 0, 0, 0.5))",
        zIndex: "var(--settara-overlay-z-index, 1000)" as unknown as number,
      }}
    >
      <div
        style={{
          backgroundColor: "var(--settara-dialog-bg, white)",
          borderRadius: "var(--settara-dialog-border-radius, 8px)",
          padding: "var(--settara-dialog-padding, 24px)",
          maxWidth: "var(--settara-dialog-max-width, 420px)",
          width: "100%",
          boxShadow:
            "var(--settara-dialog-shadow, 0 20px 60px rgba(0, 0, 0, 0.15))",
        }}
      >
        <h2
          style={{
            margin: "0 0 8px 0",
            fontSize: "var(--settara-dialog-title-font-size, 16px)",
            fontWeight: "var(--settara-dialog-title-font-weight, 600)",
            color: "var(--settara-dialog-title-color, #111827)",
          }}
        >
          {title}
        </h2>
        <p
          style={{
            margin: "0 0 16px 0",
            fontSize: "var(--settara-dialog-message-font-size, 14px)",
            color: "var(--settara-dialog-message-color, #4b5563)",
            lineHeight: 1.5,
          }}
        >
          {config.message}
        </p>
        {requireText && (
          <div style={{ marginBottom: "16px" }}>
            <label
              style={{
                display: "block",
                fontSize: "var(--settara-dialog-label-font-size, 13px)",
                color: "var(--settara-dialog-label-color, #6b7280)",
                marginBottom: "4px",
              }}
            >
              Type <strong>{requireText}</strong> to confirm
            </label>
            <input
              type="text"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              aria-label={`Type ${requireText} to confirm`}
              style={{
                width: "100%",
                padding: "8px 12px",
                fontSize: "14px",
                border: "1px solid var(--settara-input-border-color, #d1d5db)",
                borderRadius: "var(--settara-input-border-radius, 6px)",
                outline: "none",
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
          <button
            ref={cancelRef}
            onClick={() => resolveConfirm(false)}
            style={{
              padding: "8px 16px",
              fontSize: "14px",
              fontWeight: 500,
              border: "1px solid var(--settara-button-border-color, #d1d5db)",
              borderRadius: "var(--settara-button-border-radius, 6px)",
              backgroundColor: "var(--settara-button-secondary-bg, white)",
              color: "var(--settara-button-secondary-color, #374151)",
              cursor: "pointer",
            }}
          >
            {cancelLabel}
          </button>
          <button
            onClick={() => resolveConfirm(true)}
            disabled={confirmDisabled}
            style={{
              padding: "8px 16px",
              fontSize: "14px",
              fontWeight: 500,
              border: "none",
              borderRadius: "var(--settara-button-border-radius, 6px)",
              backgroundColor: dangerous
                ? "var(--settara-button-dangerous-bg, #dc2626)"
                : "var(--settara-button-primary-bg, #2563eb)",
              color: dangerous
                ? "var(--settara-button-dangerous-color, white)"
                : "var(--settara-button-primary-color, white)",
              cursor: confirmDisabled ? "not-allowed" : "pointer",
              opacity: confirmDisabled ? 0.5 : 1,
            }}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
