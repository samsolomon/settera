import React, { useContext } from "react";
import {
  SetteraSchemaContext,
  useSetteraNavigation,
  useSetteraSearch,
} from "@settera/react";
import { SetteraSection } from "./SetteraSection.js";
import { parseDescriptionLinks } from "../utils/parseDescriptionLinks.js";

export interface SetteraPageProps {
  pageKey?: string;
}

/**
 * Renders all sections for a page.
 * Defaults to the active page from navigation context, but accepts an explicit pageKey override.
 */
export function SetteraPage({ pageKey }: SetteraPageProps) {
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
      {visibleSections.map((section) => (
        <SetteraSection
          key={section.key}
          pageKey={resolvedKey}
          sectionKey={section.key}
        />
      ))}
    </div>
  );
}
