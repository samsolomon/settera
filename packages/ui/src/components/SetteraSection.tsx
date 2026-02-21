import React, { useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
import { SetteraSchemaContext, useSettera, parseDescriptionLinks } from "@settera/react";
import { evaluateVisibility, token } from "@settera/schema";
import { useSetteraSearch } from "../hooks/useSetteraSearch.js";
import { SetteraDeepLinkContext } from "../contexts/SetteraDeepLinkContext.js";
import { useSetteraLabels } from "../contexts/SetteraLabelsContext.js";
import type { SectionDefinition } from "@settera/schema";
import { SetteraSetting } from "./SetteraSetting.js";
import type { SetteraCustomSettingProps } from "./SetteraSetting.js";
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
  const labels = useSetteraLabels();
  const { isSearching } = useSetteraSearch();
  const { values } = useSettera();
  const deepLinkCtx = useContext(SetteraDeepLinkContext);
  const [isHovered, setIsHovered] = useState(false);
  const [isCopyHovered, setIsCopyHovered] = useState(false);
  const [copyFeedback, setCopyFeedback] = useState(false);
  const copyTimeoutRef = useRef<ReturnType<typeof setTimeout>>();

  const handleCopyLink = useCallback(async () => {
    if (!deepLinkCtx) return;
    if (!navigator.clipboard?.writeText) return;

    const url = deepLinkCtx.getSectionUrl(pageKey, sectionKey);
    try {
      await navigator.clipboard.writeText(url);
      setCopyFeedback(true);
      clearTimeout(copyTimeoutRef.current);
      copyTimeoutRef.current = setTimeout(() => setCopyFeedback(false), 2000);
    } catch {
      // Clipboard write failed
    }
  }, [deepLinkCtx, pageKey, sectionKey]);

  useEffect(() => {
    return () => clearTimeout(copyTimeoutRef.current);
  }, []);

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
      (section?.subsections ?? []).filter((sub) =>
        evaluateVisibility(sub.visibleWhen, values),
      ),
    [section?.subsections, values],
  );

  if (!page || !section) return null;

  if (!evaluateVisibility(section.visibleWhen, values)) {
    return null;
  }

  const visibleSettings = section.settings ?? [];

  const sectionContentId = `settera-section-content-${pageKey}-${sectionKey}`;
  const sectionTitleId = `settera-section-title-${pageKey}-${sectionKey}`;
  const sectionElementId = `settera-section-${pageKey}-${sectionKey}`;
  const isEffectivelyCollapsed = isCollapsible && isCollapsed && !isSearching;

  return (
    <section
      id={sectionElementId}
      data-settera-page-key={pageKey}
      data-settera-section-key={sectionKey}
      aria-labelledby={sectionTitleId}
      style={{
        marginTop: token("section-margin-top"),
        scrollMarginTop: token("section-scroll-margin-top"),
      }}
    >
      <div
        style={sectionHeadingRowStyle}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
          <h2 id={sectionTitleId} tabIndex={-1} style={sectionTitleStyle}>
            {section.title}
          </h2>
          {deepLinkCtx && (isHovered || copyFeedback) && (
            <PrimitiveButton
              type="button"
              tabIndex={-1}
              data-settera-copy-link
              aria-label={labels.copyLinkToSection}
              onClick={handleCopyLink}
              onMouseEnter={() => setIsCopyHovered(true)}
              onMouseLeave={() => setIsCopyHovered(false)}
              style={{
                display: "inline-flex",
                alignItems: "center",
                justifyContent: "center",
                border: "none",
                background: isCopyHovered
                  ? token("ghost-hover-bg")
                  : "transparent",
                color: isCopyHovered
                  ? token("ghost-hover-color")
                  : token("copy-link-color"),
                cursor: "pointer",
                width: "24px",
                height: "24px",
                borderRadius: token("button-border-radius"),
                padding: 0,
                flexShrink: 0,
              }}
            >
              {copyFeedback ? (
                <svg
                  width="14"
                  height="14"
                  viewBox="0 0 16 16"
                  fill="none"
                  stroke={token("save-saved-color")}
                  strokeWidth="1.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  aria-hidden="true"
                >
                  <path d="M3 8.5l3.5 3.5L13 4" />
                </svg>
              ) : (
                <svg
                  width="14"
                  height="14"
                  viewBox="0 0 16 16"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  aria-hidden="true"
                >
                  <path d="M6.5 8.5a3 3 0 0 0 4.243 0l2-2a3 3 0 0 0-4.243-4.243l-1 1" />
                  <path d="M9.5 7.5a3 3 0 0 0-4.243 0l-2 2a3 3 0 0 0 4.243 4.243l1-1" />
                </svg>
              )}
            </PrimitiveButton>
          )}
        </div>
        {isCollapsible && (
          <PrimitiveButton
            type="button"
            aria-label={
              isEffectivelyCollapsed ? labels.expandSection : labels.collapseSection
            }
            aria-expanded={!isEffectivelyCollapsed}
            aria-controls={sectionContentId}
            onClick={() => setIsCollapsed((prev) => !prev)}
            style={{
              border: "none",
              background: "transparent",
              cursor: "pointer",
              color: token("section-title-color"),
              fontSize: "14px",
              padding: "2px 4px",
            }}
          >
            {isEffectivelyCollapsed ? labels.expand : labels.collapse}
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
            return (
              <div
                key={sub.key}
                role="group"
                aria-labelledby={`settera-subsection-${sub.key}`}
                style={{ marginTop: token("section-margin-top") }}
              >
                <h3
                  id={`settera-subsection-${sub.key}`}
                  tabIndex={-1}
                  style={{
                    ...sectionTitleStyle,
                    marginTop: 0,
                    marginBottom: token("section-title-margin-bottom"),
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
                  {sub.settings.map((setting, i) => (
                    <SetteraSetting
                      key={setting.key}
                      settingKey={setting.key}
                      isLast={i === sub.settings.length - 1}
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
