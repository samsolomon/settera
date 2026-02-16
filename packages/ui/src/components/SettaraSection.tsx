import React, { useContext } from "react";
import { SettaraSchemaContext } from "@settara/react";
import type { SectionDefinition } from "@settara/schema";
import { SettaraSetting } from "./SettaraSetting.js";

export interface SettaraSectionProps {
  pageKey: string;
  sectionKey: string;
}

/**
 * Renders a section heading + description + auto-rendered settings.
 * Handles subsections as nested groups.
 */
export function SettaraSection({ pageKey, sectionKey }: SettaraSectionProps) {
  const schemaCtx = useContext(SettaraSchemaContext);

  if (!schemaCtx) {
    throw new Error("SettaraSection must be used within a SettaraProvider.");
  }

  const page = schemaCtx.getPageByKey(pageKey);
  if (!page) return null;

  const section = page.sections?.find(
    (s: SectionDefinition) => s.key === sectionKey,
  );
  if (!section) return null;

  return (
    <section
      aria-labelledby={`settara-section-${sectionKey}`}
      style={{
        marginTop: "var(--settara-section-margin-top, 24px)",
      }}
    >
      <h2
        id={`settara-section-${sectionKey}`}
        style={{
          fontSize: "var(--settara-section-title-font-size, 11px)",
          fontWeight: 600,
          textTransform: "uppercase",
          letterSpacing: "0.05em",
          color: "var(--settara-section-title-color, #9ca3af)",
          marginTop: 0,
          marginBottom: "8px",
        }}
      >
        {section.title}
      </h2>
      {section.description && (
        <p
          style={{
            fontSize: "var(--settara-description-font-size, 13px)",
            color: "var(--settara-description-color, #6b7280)",
            marginTop: 0,
            marginBottom: "12px",
          }}
        >
          {section.description}
        </p>
      )}
      {section.settings?.map((setting) => (
        <SettaraSetting key={setting.key} settingKey={setting.key} />
      ))}
      {section.subsections?.map((sub) => (
        <div
          key={sub.key}
          role="group"
          aria-labelledby={`settara-subsection-${sub.key}`}
          style={{ marginTop: "var(--settara-section-margin-top, 24px)" }}
        >
          <h3
            id={`settara-subsection-${sub.key}`}
            style={{
              fontSize: "var(--settara-section-title-font-size, 11px)",
              fontWeight: 600,
              textTransform: "uppercase",
              letterSpacing: "0.05em",
              color: "var(--settara-section-title-color, #9ca3af)",
              marginTop: 0,
              marginBottom: "8px",
            }}
          >
            {sub.title}
          </h3>
          {sub.description && (
            <p
              style={{
                fontSize: "var(--settara-description-font-size, 13px)",
                color: "var(--settara-description-color, #6b7280)",
                marginTop: 0,
                marginBottom: "12px",
              }}
            >
              {sub.description}
            </p>
          )}
          {sub.settings.map((setting) => (
            <SettaraSetting key={setting.key} settingKey={setting.key} />
          ))}
        </div>
      ))}
    </section>
  );
}
