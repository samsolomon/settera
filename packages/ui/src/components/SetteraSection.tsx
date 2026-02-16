import React, { useContext } from "react";
import { SetteraSchemaContext, useSetteraSearch } from "@settera/react";
import type { SectionDefinition } from "@settera/schema";
import { SetteraSetting } from "./SetteraSetting.js";

export interface SetteraSectionProps {
  pageKey: string;
  sectionKey: string;
}

/**
 * Renders a section heading + description + auto-rendered settings.
 * Handles subsections as nested groups.
 */
export function SetteraSection({ pageKey, sectionKey }: SetteraSectionProps) {
  const schemaCtx = useContext(SetteraSchemaContext);
  const { isSearching, matchingSettingKeys } = useSetteraSearch();

  if (!schemaCtx) {
    throw new Error("SetteraSection must be used within a SetteraProvider.");
  }

  const page = schemaCtx.getPageByKey(pageKey);
  if (!page) return null;

  const section = page.sections?.find(
    (s: SectionDefinition) => s.key === sectionKey,
  );
  if (!section) return null;

  // Filter settings during search
  const visibleSettings = isSearching
    ? (section.settings ?? []).filter((s) => matchingSettingKeys.has(s.key))
    : (section.settings ?? []);

  const visibleSubsections = isSearching
    ? (section.subsections ?? []).filter((sub) =>
        sub.settings.some((s) => matchingSettingKeys.has(s.key)),
      )
    : (section.subsections ?? []);

  // Hide entire section if no visible settings or subsections during search
  if (
    isSearching &&
    visibleSettings.length === 0 &&
    visibleSubsections.length === 0
  ) {
    return null;
  }

  return (
    <section
      aria-labelledby={`settera-section-${sectionKey}`}
      style={{
        marginTop: "var(--settera-section-margin-top, 24px)",
      }}
    >
      <h2
        id={`settera-section-${sectionKey}`}
        tabIndex={-1}
        style={{
          fontSize: "var(--settera-section-title-font-size, 11px)",
          fontWeight: 600,
          textTransform: "uppercase",
          letterSpacing: "0.05em",
          color: "var(--settera-section-title-color, #9ca3af)",
          marginTop: 0,
          marginBottom: "8px",
        }}
      >
        {section.title}
      </h2>
      {section.description && (
        <p
          style={{
            fontSize: "var(--settera-description-font-size, 13px)",
            color: "var(--settera-description-color, #6b7280)",
            marginTop: 0,
            marginBottom: "12px",
          }}
        >
          {section.description}
        </p>
      )}
      {visibleSettings.map((setting) => (
        <SetteraSetting key={setting.key} settingKey={setting.key} />
      ))}
      {visibleSubsections.map((sub) => {
        const subSettings = isSearching
          ? sub.settings.filter((s) => matchingSettingKeys.has(s.key))
          : sub.settings;

        return (
          <div
            key={sub.key}
            role="group"
            aria-labelledby={`settera-subsection-${sub.key}`}
            style={{ marginTop: "var(--settera-section-margin-top, 24px)" }}
          >
            <h3
              id={`settera-subsection-${sub.key}`}
              tabIndex={-1}
              style={{
                fontSize: "var(--settera-section-title-font-size, 11px)",
                fontWeight: 600,
                textTransform: "uppercase",
                letterSpacing: "0.05em",
                color: "var(--settera-section-title-color, #9ca3af)",
                marginTop: 0,
                marginBottom: "8px",
              }}
            >
              {sub.title}
            </h3>
            {sub.description && (
              <p
                style={{
                  fontSize: "var(--settera-description-font-size, 13px)",
                  color: "var(--settera-description-color, #6b7280)",
                  marginTop: 0,
                  marginBottom: "12px",
                }}
              >
                {sub.description}
              </p>
            )}
            {subSettings.map((setting) => (
              <SetteraSetting key={setting.key} settingKey={setting.key} />
            ))}
          </div>
        );
      })}
    </section>
  );
}
