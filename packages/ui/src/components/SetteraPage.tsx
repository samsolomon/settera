import React, { useContext } from "react";
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
import { SubpageContent } from "./SubpageContent.js";
import type { SetteraActionPageProps } from "./SubpageContent.js";
import { BackButton } from "./SetteraPrimitives.js";

export interface SetteraPageProps {
  pageKey?: string;
  customPages?: Record<string, React.ComponentType<SetteraCustomPageProps>>;
  customSettings?: Record<
    string,
    React.ComponentType<SetteraCustomSettingProps>
  >;
  customActionPages?: Record<string, React.ComponentType<SetteraActionPageProps>>;
}

export type { SetteraActionPageProps } from "./SubpageContent.js";

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
  customActionPages,
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
        <BackButton onClick={closeSubpage}>
          {returnPage?.title ?? "Back"}
        </BackButton>
        <div style={{ marginTop: "12px" }}>
          <SubpageContent
            settingKey={subpage.settingKey}
            onBack={closeSubpage}
            customActionPages={customActionPages}
          />
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
