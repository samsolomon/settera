import React, { useContext, useEffect, useMemo, useState } from "react";
import { SetteraSchemaContext, useSettera } from "@settera/react";
import { evaluateVisibility } from "@settera/schema";
import { useSetteraSearch } from "../hooks/useSetteraSearch.js";
import type { SectionDefinition } from "@settera/schema";
import { SetteraSetting } from "./SetteraSetting.js";
import type { SetteraCustomSettingProps } from "./SetteraSetting.js";
import { parseDescriptionLinks } from "../utils/parseDescriptionLinks.js";

export interface SetteraSectionProps {
  pageKey: string;
  sectionKey: string;
  customSettings?: Record<
    string,
    React.ComponentType<SetteraCustomSettingProps>
  >;
}

/**
 * Renders a section heading + description + auto-rendered settings.
 * Handles subsections as nested groups.
 */
export function SetteraSection({
  pageKey,
  sectionKey,
  customSettings,
}: SetteraSectionProps) {
  const schemaCtx = useContext(SetteraSchemaContext);
  const { isSearching, matchingSettingKeys } = useSetteraSearch();
  const { values } = useSettera();

  if (!schemaCtx) {
    throw new Error("SetteraSection must be used within a Settera component.");
  }

  const page = schemaCtx.getPageByKey(pageKey);
  if (!page) return null;

  const section = page.sections?.find(
    (s: SectionDefinition) => s.key === sectionKey,
  );
  if (!section) return null;

  if (!evaluateVisibility(section.visibleWhen, values)) {
    return null;
  }

  const sectionContentId = `settera-section-content-${pageKey}-${sectionKey}`;
  const sectionTitleId = `settera-section-${sectionKey}`;
  const isCollapsible = section.collapsible === true;
  const initialCollapsed = isCollapsible && section.defaultCollapsed === true;
  const [isCollapsed, setIsCollapsed] = useState(initialCollapsed);

  useEffect(() => {
    setIsCollapsed(initialCollapsed);
  }, [initialCollapsed, pageKey, sectionKey]);

  // Filter settings during search
  const visibleSettings = isSearching
    ? (section.settings ?? []).filter((s) => matchingSettingKeys.has(s.key))
    : (section.settings ?? []);

  const visibleSubsections = useMemo(
    () =>
      (section.subsections ?? []).filter((sub) => {
        if (!evaluateVisibility(sub.visibleWhen, values)) {
          return false;
        }
        if (!isSearching) {
          return true;
        }
        return sub.settings.some((s) => matchingSettingKeys.has(s.key));
      }),
    [section.subsections, values, isSearching, matchingSettingKeys],
  );

  // Hide entire section if no visible settings or subsections during search
  if (
    isSearching &&
    visibleSettings.length === 0 &&
    visibleSubsections.length === 0
  ) {
    return null;
  }

  const isEffectivelyCollapsed = isCollapsible && isCollapsed && !isSearching;

  return (
    <section
      aria-labelledby={sectionTitleId}
      style={{
        marginTop: "var(--settera-section-margin-top, 24px)",
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: "8px",
          marginBottom: "var(--settera-section-title-margin-bottom, 8px)",
        }}
      >
        <h2
          id={sectionTitleId}
          tabIndex={-1}
          style={{
            fontSize: "var(--settera-section-title-font-size, 16px)",
            fontWeight: "var(--settera-section-title-font-weight, 600)",
            color: "var(--settera-section-title-color, #111827)",
            margin: 0,
          }}
        >
          {section.title}
        </h2>
        {isCollapsible && (
          <button
            type="button"
            aria-label={isEffectivelyCollapsed ? "Expand section" : "Collapse section"}
            aria-expanded={!isEffectivelyCollapsed}
            aria-controls={sectionContentId}
            onClick={() => setIsCollapsed((prev) => !prev)}
            style={{
              border: "none",
              background: "transparent",
              cursor: "pointer",
              color: "var(--settera-section-title-color, #111827)",
              fontSize: "14px",
              padding: "2px 4px",
            }}
          >
            {isEffectivelyCollapsed ? "Expand" : "Collapse"}
          </button>
        )}
      </div>
      {!isEffectivelyCollapsed && (
        <div id={sectionContentId}>
          {section.description && (
            <p
              style={{
                fontSize: "var(--settera-description-font-size, 13px)",
                color: "var(--settera-description-color, #6b7280)",
                marginTop: 0,
                marginBottom: "8px",
              }}
            >
              {parseDescriptionLinks(section.description)}
            </p>
          )}
          {visibleSettings.length > 0 && (
            <div
              style={{
                border: "var(--settera-card-border, 1px solid #e5e7eb)",
                borderRadius: "var(--settera-card-border-radius, 10px)",
                backgroundColor: "var(--settera-card-bg, white)",
                overflow: "hidden",
              }}
            >
              {visibleSettings.map((setting, i) => (
                <SetteraSetting
                  key={setting.key}
                  settingKey={setting.key}
                  isLast={i === visibleSettings.length - 1}
                  customSettings={customSettings}
                />
              ))}
            </div>
          )}
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
                    fontSize: "var(--settera-section-title-font-size, 16px)",
                    fontWeight: "var(--settera-section-title-font-weight, 600)",
                    color: "var(--settera-section-title-color, #111827)",
                    marginTop: 0,
                    marginBottom: "var(--settera-section-title-margin-bottom, 8px)",
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
                      marginBottom: "8px",
                    }}
                  >
                    {parseDescriptionLinks(sub.description)}
                  </p>
                )}
                <div
                  style={{
                    border: "var(--settera-card-border, 1px solid #e5e7eb)",
                    borderRadius: "var(--settera-card-border-radius, 10px)",
                    backgroundColor: "var(--settera-card-bg, white)",
                    overflow: "hidden",
                  }}
                >
                  {subSettings.map((setting, i) => (
                    <SetteraSetting
                      key={setting.key}
                      settingKey={setting.key}
                      isLast={i === subSettings.length - 1}
                      customSettings={customSettings}
                    />
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </section>
  );
}
