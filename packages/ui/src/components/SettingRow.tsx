import React from "react";
import { useSettaraSetting } from "@settara/react";

export interface SettingRowProps {
  settingKey: string;
  children: React.ReactNode;
}

/**
 * Wraps a setting control with title, description, and visibility logic.
 * Hides itself when `isVisible` is false.
 */
export function SettingRow({ settingKey, children }: SettingRowProps) {
  const { isVisible, definition } = useSettaraSetting(settingKey);

  if (!isVisible) return null;

  const isDangerous = "dangerous" in definition && definition.dangerous;

  return (
    <div
      role="group"
      aria-label={definition.title}
      style={{
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
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
      </div>
      <div>{children}</div>
    </div>
  );
}
