import React, { useCallback, useRef, useState } from "react";
import { useSetteraSetting } from "@settera/react";

export interface SettingRowProps {
  settingKey: string;
  children: React.ReactNode;
}

/**
 * Wraps a setting control with title, description, error display, and visibility logic.
 * Hides itself when `isVisible` is false.
 */
export function SettingRow({ settingKey, children }: SettingRowProps) {
  const { isVisible, definition, error, saveStatus } =
    useSetteraSetting(settingKey);
  const [isFocusVisible, setIsFocusVisible] = useState(false);
  const pointerDownRef = useRef(false);

  const handlePointerDown = useCallback(() => {
    pointerDownRef.current = true;
  }, []);

  const handleFocus = useCallback(
    (e: React.FocusEvent<HTMLDivElement>) => {
      // Only show focus ring when the card itself is focused, not a child
      if (e.target === e.currentTarget) {
        setIsFocusVisible(!pointerDownRef.current);
      }
      pointerDownRef.current = false;
    },
    [],
  );

  const handleBlur = useCallback((e: React.FocusEvent<HTMLDivElement>) => {
    // Don't clear focus ring when focus moves to a child within the card
    if (e.currentTarget.contains(e.relatedTarget as Node)) return;
    setIsFocusVisible(false);
  }, []);

  if (!isVisible) return null;

  const isDangerous = "dangerous" in definition && definition.dangerous;

  return (
    <div
      role="group"
      aria-label={definition.title}
      tabIndex={-1}
      data-setting-key={settingKey}
      onPointerDown={handlePointerDown}
      onFocus={handleFocus}
      onBlur={handleBlur}
      style={{
        display: "flex",
        justifyContent: "space-between",
        alignItems: "flex-start",
        padding: "var(--settera-row-padding, 12px 0)",
        borderBottom: "var(--settera-row-border, 1px solid #e5e7eb)",
        opacity: "var(--settera-row-opacity, 1)",
        outline: "none",
        boxShadow: isFocusVisible
          ? "0 0 0 2px var(--settera-focus-ring-color, #93c5fd)"
          : "none",
        borderRadius: "var(--settera-row-focus-radius, 6px)",
      }}
    >
      <div style={{ flex: 1, marginRight: "16px" }}>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "6px",
            fontSize: "var(--settera-title-font-size, 14px)",
            fontWeight: "var(--settera-title-font-weight, 500)",
            color: isDangerous
              ? "var(--settera-dangerous-color, #dc2626)"
              : "var(--settera-title-color, #111827)",
          }}
        >
          {definition.title}
          {saveStatus === "saving" && (
            <span
              aria-label="Saving"
              style={{
                fontSize:
                  "var(--settera-save-indicator-font-size, 12px)",
                color: "var(--settera-save-saving-color, #6b7280)",
              }}
            >
              Saving...
            </span>
          )}
          {saveStatus === "saved" && (
            <span
              aria-label="Saved"
              style={{
                fontSize:
                  "var(--settera-save-indicator-font-size, 12px)",
                color: "var(--settera-save-saved-color, #16a34a)",
              }}
            >
              Saved
            </span>
          )}
          {saveStatus === "error" && (
            <span
              aria-label="Save failed"
              style={{
                fontSize:
                  "var(--settera-save-indicator-font-size, 12px)",
                color: "var(--settera-save-error-color, #dc2626)",
              }}
            >
              Save failed
            </span>
          )}
        </div>
        {"description" in definition && definition.description && (
          <div
            style={{
              fontSize: "var(--settera-description-font-size, 13px)",
              color: "var(--settera-description-color, #6b7280)",
              marginTop: "2px",
            }}
          >
            {definition.description}
          </div>
        )}
        {"helpText" in definition && definition.helpText && (
          <div
            style={{
              fontSize: "var(--settera-help-font-size, 12px)",
              color: "var(--settera-help-color, #9ca3af)",
              marginTop: "4px",
            }}
          >
            {"ⓘ "}
            {definition.helpText}
          </div>
        )}
        {error && (
          <div
            role="alert"
            id={`settera-error-${settingKey}`}
            style={{
              fontSize: "var(--settera-error-font-size, 13px)",
              color: "var(--settera-error-color, #dc2626)",
              marginTop: "4px",
            }}
          >
            {error}
          </div>
        )}
      </div>
      <div style={{ paddingTop: "2px" }}>{children}</div>
    </div>
  );
}
