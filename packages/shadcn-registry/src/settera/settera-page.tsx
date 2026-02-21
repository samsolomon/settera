"use client";

import React, { useContext } from "react";
import { SetteraSchemaContext, parseDescriptionLinks } from "@settera/react";
import type { PageDefinition } from "@settera/schema";
import { ChevronLeftIcon } from "lucide-react";
import { useSetteraNavigation } from "./use-settera-navigation";
import { useSetteraSearch } from "./use-settera-search";
import { SetteraSection } from "./settera-section";
import type { SetteraCustomSettingProps } from "./settera-setting";
import { SetteraSubpageContent } from "./settera-subpage-content";
import type { SetteraActionPageProps } from "./settera-subpage-content";
import { Button } from "@/components/ui/button";
import { useSetteraLabels } from "./settera-labels";

export interface SetteraPageProps {
  pageKey?: string;
  customPages?: Record<string, React.ComponentType<SetteraCustomPageProps>>;
  customSettings?: Record<
    string,
    React.ComponentType<SetteraCustomSettingProps>
  >;
  customActionPages?: Record<string, React.ComponentType<SetteraActionPageProps>>;
}

export interface SetteraCustomPageProps {
  page: PageDefinition;
  pageKey: string;
}

export function SetteraPage({
  pageKey,
  customPages,
  customSettings,
  customActionPages,
}: SetteraPageProps) {
  const schemaCtx = useContext(SetteraSchemaContext);
  const labels = useSetteraLabels();
  const { activePage, subpage, closeSubpage } = useSetteraNavigation();
  const { isSearching, matchingSettingKeys } = useSetteraSearch();

  if (!schemaCtx) {
    throw new Error("SetteraPage must be used within a Settera component.");
  }

  if (subpage) {
    const returnPage = schemaCtx.getPageByKey(subpage.returnPage);
    const setting = schemaCtx.getSettingByKey(subpage.settingKey);

    if (!setting) return null;

    return (
      <div>
        <Button
          variant="ghost"
          size="sm"
          onClick={closeSubpage}
          className="mb-3 -ml-2"
        >
          <ChevronLeftIcon className="size-4 mr-1" />
          {returnPage?.title ?? labels.back}
        </Button>
        <SetteraSubpageContent
          settingKey={subpage.settingKey}
          onBack={closeSubpage}
          customActionPages={customActionPages}
        />
      </div>
    );
  }

  const resolvedKey = pageKey ?? activePage;
  const page = schemaCtx.getPageByKey(resolvedKey);

  if (!page) return null;

  const customPageRendererKey = page.mode === "custom" ? page.renderer : null;
  const CustomPage =
    customPageRendererKey && customPages
      ? customPages[customPageRendererKey]
      : undefined;

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
      <h1 className="font-semibold" style={{ fontSize: "var(--settera-page-title-font-size, 1.5rem)" }}>{page.title}</h1>
      {page.description && (
        <p className="mt-1 text-sm text-muted-foreground">
          {parseDescriptionLinks(page.description)}
        </p>
      )}
      {page.mode === "custom" && customPageRendererKey && CustomPage && (
        <CustomPage page={page} pageKey={resolvedKey} />
      )}
      {page.mode === "custom" && customPageRendererKey && !CustomPage && (
        <div
          data-testid={`missing-custom-page-${resolvedKey}`}
          className="mt-3 text-sm italic text-muted-foreground"
        >
          Missing custom page renderer &ldquo;{customPageRendererKey}&rdquo;.
        </div>
      )}
      {page.mode === "custom" && !customPageRendererKey && (
        <div
          data-testid={`invalid-custom-page-${resolvedKey}`}
          className="mt-3 text-sm italic text-muted-foreground"
        >
          Custom page &ldquo;{resolvedKey}&rdquo; is missing a renderer key.
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
