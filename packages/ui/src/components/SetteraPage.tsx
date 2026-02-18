import React, { useContext } from "react";
import { SetteraSchemaContext } from "@settera/react";
import { useSetteraNavigation } from "../hooks/useSetteraNavigation.js";
import { useSetteraSearch } from "../hooks/useSetteraSearch.js";
import type { PageDefinition } from "@settera/schema";
import { SetteraSection } from "./SetteraSection.js";
import type { SetteraCustomSettingProps } from "./SetteraSetting.js";
import { parseDescriptionLinks } from "../utils/parseDescriptionLinks.js";

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
 * Renders all sections for a page.
 * Defaults to the active page from navigation context, but accepts an explicit pageKey override.
 */
export function SetteraPage({
  pageKey,
  customPages,
  customSettings,
}: SetteraPageProps) {
  const schemaCtx = useContext(SetteraSchemaContext);
  const { activePage } = useSetteraNavigation();
  const { isSearching, matchingSettingKeys } = useSetteraSearch();

  if (!schemaCtx) {
    throw new Error("SetteraPage must be used within a SetteraProvider.");
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
          margin: 0,
        }}
      >
        {page.title}
      </h1>
      {page.description && (
        <p
          style={{
            fontSize: "var(--settera-description-font-size, 13px)",
            color: "var(--settera-description-color, #6b7280)",
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
            fontSize: "var(--settera-description-font-size, 13px)",
            color: "var(--settera-description-color, #6b7280)",
            fontStyle: "italic",
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
            fontSize: "var(--settera-description-font-size, 13px)",
            color: "var(--settera-description-color, #6b7280)",
            fontStyle: "italic",
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
