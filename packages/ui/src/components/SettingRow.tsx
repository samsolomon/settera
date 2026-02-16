import React from "react";
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
  const { isVisible, definition, error } = useSetteraSetting(settingKey);

  if (!isVisible) return null;

  const isDangerous = "dangerous" in definition && definition.dangerous;

  return (
    <div
      role="group"
      aria-label={definition.title}
      style={{
        display: "flex",
        justifyContent: "space-between",
        alignItems: "flex-start",
        padding: "var(--settera-row-padding, 12px 0)",
        borderBottom: "var(--settera-row-border, 1px solid #e5e7eb)",
        opacity: "var(--settera-row-opacity, 1)",
      }}
    >
      <div style={{ flex: 1, marginRight: "16px" }}>
        <div
          style={{
            fontSize: "var(--settera-title-font-size, 14px)",
            fontWeight: "var(--settera-title-font-weight, 500)",
            color: isDangerous
              ? "var(--settera-dangerous-color, #dc2626)"
              : "var(--settera-title-color, #111827)",
          }}
        >
          {definition.title}
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
