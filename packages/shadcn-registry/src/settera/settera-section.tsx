"use client";

import React, { useContext, useEffect, useMemo, useState } from "react";
import { SetteraSchemaContext, useSettera, parseDescriptionLinks } from "@settera/react";
import { evaluateVisibility } from "@settera/schema";
import type { SectionDefinition } from "@settera/schema";
import { ChevronDownIcon } from "lucide-react";
import { useSetteraSearch } from "./use-settera-search";
import { SetteraSetting } from "./settera-setting";
import type { SetteraCustomSettingProps } from "./settera-setting";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";

export interface SetteraSectionProps {
  pageKey: string;
  sectionKey: string;
  customSettings?: Record<
    string,
    React.ComponentType<SetteraCustomSettingProps>
  >;
}

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

  const visibleSettings = isSearching
    ? (section.settings ?? []).filter((s) => matchingSettingKeys.has(s.key))
    : (section.settings ?? []);

  if (
    isSearching &&
    visibleSettings.length === 0 &&
    visibleSubsections.length === 0
  ) {
    return null;
  }

  const sectionContentId = `settera-section-content-${pageKey}-${sectionKey}`;
  const sectionTitleId = `settera-section-title-${pageKey}-${sectionKey}`;
  const sectionElementId = `settera-section-${pageKey}-${sectionKey}`;
  const isEffectivelyCollapsed = isCollapsible && isCollapsed && !isSearching;

  const sectionContent = (
    <>
      {section.description && (
        <p className="text-sm text-muted-foreground mb-2">
          {parseDescriptionLinks(section.description)}
        </p>
      )}
      {visibleSettings.length > 0 && (
        <div className="rounded-lg border bg-card overflow-hidden">
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
            style={{ marginTop: "var(--settera-subsection-gap, 1.5rem)" }}
          >
            <h3
              id={`settera-subsection-${sub.key}`}
              tabIndex={-1}
              className="text-sm font-semibold mb-2"
            >
              {sub.title}
            </h3>
            {sub.description && (
              <p className="text-sm text-muted-foreground mb-2">
                {parseDescriptionLinks(sub.description)}
              </p>
            )}
            <div className="rounded-lg border bg-card overflow-hidden">
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
    </>
  );

  if (isCollapsible) {
    return (
      <section
        id={sectionElementId}
        data-settera-page-key={pageKey}
        data-settera-section-key={sectionKey}
        aria-labelledby={sectionTitleId}
        style={{
          marginTop: "var(--settera-section-gap, 1.5rem)",
          scrollMarginTop: "var(--settera-section-scroll-margin-top, 1.5rem)",
        }}
      >
        <Collapsible open={!isEffectivelyCollapsed} onOpenChange={(open) => setIsCollapsed(!open)}>
          <CollapsibleTrigger asChild>
            <button
              type="button"
              className="flex items-center gap-1 group cursor-pointer p-0"
              style={{ marginBottom: "var(--settera-section-title-gap, 0.75rem)" }}
            >
              <h2 id={sectionTitleId} tabIndex={-1} className="font-semibold group-hover:text-muted-foreground transition-colors" style={{ fontSize: "var(--settera-section-title-font-size, 1rem)" }}>
                {section.title}
              </h2>
              <ChevronDownIcon
                className="size-4 text-muted-foreground shrink-0 transition-transform duration-200"
                style={{
                  transform: isEffectivelyCollapsed ? "rotate(-90deg)" : "rotate(0deg)",
                }}
              />
            </button>
          </CollapsibleTrigger>
          <CollapsibleContent id={sectionContentId}>
            {sectionContent}
          </CollapsibleContent>
        </Collapsible>
      </section>
    );
  }

  return (
    <section
      id={sectionElementId}
      data-settera-page-key={pageKey}
      data-settera-section-key={sectionKey}
      aria-labelledby={sectionTitleId}
      style={{
        marginTop: "var(--settera-section-gap, 1.5rem)",
        scrollMarginTop: "var(--settera-section-scroll-margin-top, 1.5rem)",
      }}
    >
      <h2 id={sectionTitleId} tabIndex={-1} className="font-semibold" style={{ fontSize: "var(--settera-section-title-font-size, 1rem)", marginBottom: "var(--settera-section-title-gap, 0.75rem)" }}>
        {section.title}
      </h2>
      <div id={sectionContentId}>
        {sectionContent}
      </div>
    </section>
  );
}
