import React, { useContext, useEffect, useMemo, useState } from "react";
import { SetteraSchemaContext, useSettera } from "@settera/react";
import { evaluateVisibility } from "@settera/schema";
import { useSetteraSearch } from "../hooks/useSetteraSearch.js";
import type { SectionDefinition } from "@settera/schema";
import { SetteraSetting } from "./SetteraSetting.js";
import type { SetteraCustomSettingProps } from "./SetteraSetting.js";
import { parseDescriptionLinks } from "../utils/parseDescriptionLinks.js";
import { PrimitiveButton } from "./SetteraPrimitives.js";
import {
  cardShellStyle,
  descriptionTextStyle,
  sectionHeadingRowStyle,
  sectionTitleStyle,
} from "./SetteraFieldPrimitives.js";

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
  const section = page?.sections?.find(
    (s: SectionDefinition) => s.key === sectionKey,
  );

  const isCollapsible = section?.collapsible === true;
  const initialCollapsed = isCollapsible && section?.defaultCollapsed === true;
  const [isCollapsed, setIsCollapsed] = useState(initialCollapsed);

  useEffect(() => {
    setIsCollapsed(initialCollapsed);
  }, [initialCollapsed, pageKey, sectionKey]);

  const visibleSubsections = useMemo(
    () =>
      (section?.subsections ?? []).filter((sub) => {
        if (!evaluateVisibility(sub.visibleWhen, values)) {
          return false;
        }
        if (!isSearching) {
          return true;
        }
        return sub.settings.some((s) => matchingSettingKeys.has(s.key));
      }),
    [section?.subsections, values, isSearching, matchingSettingKeys],
  );

  if (!page || !section) return null;

  if (!evaluateVisibility(section.visibleWhen, values)) {
    return null;
  }

  // Filter settings during search
  const visibleSettings = isSearching
    ? (section.settings ?? []).filter((s) => matchingSettingKeys.has(s.key))
    : (section.settings ?? []);

  // Hide entire section if no visible settings or subsections during search
  if (
    isSearching &&
    visibleSettings.length === 0 &&
    visibleSubsections.length === 0
  ) {
    return null;
  }

  const sectionContentId = `settera-section-content-${pageKey}-${sectionKey}`;
  const sectionTitleId = `settera-section-${sectionKey}`;
  const isEffectivelyCollapsed = isCollapsible && isCollapsed && !isSearching;

  return (
    <section
      aria-labelledby={sectionTitleId}
      style={{
        marginTop: "var(--settera-section-margin-top, 24px)",
      }}
    >
      <div style={sectionHeadingRowStyle}>
        <h2 id={sectionTitleId} tabIndex={-1} style={sectionTitleStyle}>
          {section.title}
        </h2>
        {isCollapsible && (
          <PrimitiveButton
            type="button"
            aria-label={
              isEffectivelyCollapsed ? "Expand section" : "Collapse section"
            }
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
          </PrimitiveButton>
        )}
      </div>
      {!isEffectivelyCollapsed && (
        <div id={sectionContentId}>
          {section.description && (
            <p
              style={{
                ...descriptionTextStyle,
                marginTop: 0,
                marginBottom: "8px",
              }}
            >
              {parseDescriptionLinks(section.description)}
            </p>
          )}
          {visibleSettings.length > 0 && (
            <div style={cardShellStyle}>
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
                    ...sectionTitleStyle,
                    marginTop: 0,
                    marginBottom:
                      "var(--settera-section-title-margin-bottom, 8px)",
                  }}
                >
                  {sub.title}
                </h3>
                {sub.description && (
                  <p
                    style={{
                      ...descriptionTextStyle,
                      marginTop: 0,
                      marginBottom: "8px",
                    }}
                  >
                    {parseDescriptionLinks(sub.description)}
                  </p>
                )}
                <div style={cardShellStyle}>
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
