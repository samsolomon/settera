import React from "react";
import { useSettaraSetting } from "@settara/react";

export interface SettingRowProps {
  settingKey: string;
  children: React.ReactNode;
}

/**
 * Wraps a setting control with title, description, error display, and visibility logic.
 * Hides itself when `isVisible` is false.
 */
export function SettingRow({ settingKey, children }: SettingRowProps) {
  const { isVisible, definition, error } = useSettaraSetting(settingKey);

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
        padding: "var(--settara-row-padding, 12px 0)",
        borderBottom: "var(--settara-row-border, 1px solid #e5e7eb)",
        opacity: "var(--settara-row-opacity, 1)",
      }}
    >
      <div style={{ flex: 1, marginRight: "16px" }}>
        <div
          style={{
            fontSize: "var(--settara-title-font-size, 14px)",
            fontWeight: "var(--settara-title-font-weight, 500)",
            color: isDangerous
              ? "var(--settara-dangerous-color, #dc2626)"
              : "var(--settara-title-color, #111827)",
          }}
        >
          {definition.title}
        </div>
        {"description" in definition && definition.description && (
          <div
            style={{
              fontSize: "var(--settara-description-font-size, 13px)",
              color: "var(--settara-description-color, #6b7280)",
              marginTop: "2px",
            }}
          >
            {definition.description}
          </div>
        )}
        {"helpText" in definition && definition.helpText && (
          <div
            style={{
              fontSize: "var(--settara-help-font-size, 12px)",
              color: "var(--settara-help-color, #9ca3af)",
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
            id={`settara-error-${settingKey}`}
            style={{
              fontSize: "var(--settara-error-font-size, 13px)",
              color: "var(--settara-error-color, #dc2626)",
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
