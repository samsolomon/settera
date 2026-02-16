import React, { useContext } from "react";
import {
  SettaraSchemaContext,
  useSettaraNavigation,
  useSettaraSearch,
} from "@settara/react";
import { SettaraSection } from "./SettaraSection.js";

export interface SettaraPageProps {
  pageKey?: string;
}

/**
 * Renders all sections for a page.
 * Defaults to the active page from navigation context, but accepts an explicit pageKey override.
 */
export function SettaraPage({ pageKey }: SettaraPageProps) {
  const schemaCtx = useContext(SettaraSchemaContext);
  const { activePage } = useSettaraNavigation();
  const { isSearching, matchingSettingKeys } = useSettaraSearch();

  if (!schemaCtx) {
    throw new Error("SettaraPage must be used within a SettaraProvider.");
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
          fontSize: "var(--settara-page-title-font-size, 20px)",
          fontWeight: 600,
          margin: 0,
        }}
      >
        {page.title}
      </h1>
      {visibleSections.map((section) => (
        <SettaraSection
          key={section.key}
          pageKey={resolvedKey}
          sectionKey={section.key}
        />
      ))}
    </div>
  );
}
