import React, { useContext, useState } from "react";
import { SetteraSchemaContext } from "@settera/react";
import { useSetteraNavigation } from "../hooks/useSetteraNavigation.js";
import { useSetteraSearch } from "../hooks/useSetteraSearch.js";
import type { PageDefinition } from "@settera/schema";
import { SetteraSection } from "./SetteraSection.js";
import type { SetteraCustomSettingProps } from "./SetteraSetting.js";
import { parseDescriptionLinks } from "../utils/parseDescriptionLinks.js";
import {
  mutedMessageStyle,
  descriptionTextStyle,
} from "./SetteraFieldPrimitives.js";

export interface SetteraPageProps {
  pageKey?: string;
  customPages?: Record<string, React.ComponentType<SetteraCustomPageProps>>;
  customSettings?: Record<
    string,
    React.ComponentType<SetteraCustomSettingProps>
  >;
}

export interface SetteraCustomPageProps {
  page: PageDefinition;
  pageKey: string;
}

/**
 * Renders all sections for a page, or subpage content when a subpage is active.
 * Defaults to the active page from navigation context, but accepts an explicit pageKey override.
 */
export function SetteraPage({
  pageKey,
  customPages,
  customSettings,
}: SetteraPageProps) {
  const schemaCtx = useContext(SetteraSchemaContext);
  const { activePage, subpage, closeSubpage } = useSetteraNavigation();
  const { isSearching, matchingSettingKeys } = useSetteraSearch();

  if (!schemaCtx) {
    throw new Error("SetteraPage must be used within a Settera component.");
  }

  // When a subpage is active, render subpage content instead
  if (subpage) {
    const returnPage = schemaCtx.getPageByKey(subpage.returnPage);
    const setting = schemaCtx.getSettingByKey(subpage.settingKey);

    if (!setting) {
      return null;
    }

    return (
      <div>
        <SubpageBackButton
          parentPageTitle={returnPage?.title ?? "Back"}
          onBack={closeSubpage}
        />
        <div style={{ marginTop: "12px" }}>
          {/* Subpage content rendered by consumers (compound, action pages) */}
        </div>
      </div>
    );
  }

  const resolvedKey = pageKey ?? activePage;
  const page = schemaCtx.getPageByKey(resolvedKey);

  if (!page) {
    return null;
  }

  const customPageRendererKey = page.mode === "custom" ? page.renderer : null;
  const CustomPage =
    customPageRendererKey && customPages
      ? customPages[customPageRendererKey]
      : undefined;

  // During search, only show sections that contain matching settings
  const visibleSections = isSearching
    ? (page.sections ?? []).filter((section) => {
        const hasMatchingSetting = (section.settings ?? []).some((s) =>
          matchingSettingKeys.has(s.key),
        );
        const hasMatchingSubsection = (section.subsections ?? []).some((sub) =>
          sub.settings.some((s) => matchingSettingKeys.has(s.key)),
        );
        return hasMatchingSetting || hasMatchingSubsection;
      })
    : (page.sections ?? []);

  return (
    <div>
      <h1
        style={{
          fontSize: "var(--settera-page-title-font-size, 20px)",
          fontWeight: 600,
          color: "var(--settera-page-title-color, var(--settera-foreground, #111827))",
          margin: 0,
        }}
      >
        {page.title}
      </h1>
      {page.description && (
        <p
          style={{
            ...descriptionTextStyle,
            marginTop: "4px",
            marginBottom: 0,
          }}
        >
          {parseDescriptionLinks(page.description)}
        </p>
      )}
      {page.mode === "custom" && customPageRendererKey && CustomPage && (
        <CustomPage page={page} pageKey={resolvedKey} />
      )}
      {page.mode === "custom" && customPageRendererKey && !CustomPage && (
        <div
          data-testid={`missing-custom-page-${resolvedKey}`}
          style={{
            marginTop: "12px",
            ...mutedMessageStyle,
          }}
        >
          Missing custom page renderer "{customPageRendererKey}".
        </div>
      )}
      {page.mode === "custom" && !customPageRendererKey && (
        <div
          data-testid={`invalid-custom-page-${resolvedKey}`}
          style={{
            marginTop: "12px",
            ...mutedMessageStyle,
          }}
        >
          Custom page "{resolvedKey}" is missing a renderer key.
        </div>
      )}
      {page.mode !== "custom" &&
        visibleSections.map((section) => (
          <SetteraSection
            key={section.key}
            pageKey={resolvedKey}
            sectionKey={section.key}
            customSettings={customSettings}
          />
        ))}
    </div>
  );
}

// ---- Subpage Back Button ----

function SubpageBackButton({
  parentPageTitle,
  onBack,
}: {
  parentPageTitle: string;
  onBack: () => void;
}) {
  const [isHovered, setIsHovered] = useState(false);

  return (
    <button
      type="button"
      onClick={onBack}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: "6px",
        border: "none",
        background: isHovered
          ? "var(--settera-ghost-hover-bg, #f4f4f5)"
          : "transparent",
        borderRadius: "var(--settera-sidebar-item-radius, 8px)",
        padding: "6px 10px",
        fontSize: "14px",
        fontWeight: 500,
        color: "var(--settera-description-color, var(--settera-muted-foreground, #6b7280))",
        cursor: "pointer",
        fontFamily: "inherit",
        transition: "background-color 120ms ease",
        marginLeft: "-10px",
      }}
    >
      <svg
        aria-hidden="true"
        width="16"
        height="16"
        viewBox="0 0 16 16"
        fill="none"
        style={{
          flexShrink: 0,
          color: "var(--settera-sidebar-chevron-color, #9ca3af)",
        }}
      >
        <path
          d="M10 4l-4 4 4 4"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
      {parentPageTitle}
    </button>
  );
}
