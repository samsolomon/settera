"use client";

import React, { useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
import { SetteraSchemaContext, useSettera, parseDescriptionLinks } from "@settera/react";
import { evaluateVisibility } from "@settera/schema";
import type { SectionDefinition } from "@settera/schema";
import { CheckIcon, ChevronDownIcon, LinkIcon } from "lucide-react";
import { useSetteraSearch } from "./use-settera-search";
import { SetteraDeepLinkContext } from "./settera-deep-link-context";
import { useSetteraLabels } from "./settera-labels";
import { SetteraSetting } from "./settera-setting";
import type { SetteraCustomSettingProps } from "./settera-setting";
import { Button } from "@/components/ui/button";
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
  const { isSearching } = useSetteraSearch();
  const { values } = useSettera();
  const deepLinkCtx = useContext(SetteraDeepLinkContext);
  const labels = useSetteraLabels();
  const [isHovered, setIsHovered] = useState(false);
  const [copyFeedback, setCopyFeedback] = useState(false);
  const copyTimeoutRef = useRef<ReturnType<typeof setTimeout>>();

  const handleCopyLink = useCallback(async (e: React.MouseEvent) => {
    e.stopPropagation();
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
  const showCopyButton = !!(deepLinkCtx && (isHovered || copyFeedback));

  const copyButton = showCopyButton ? (
    <Button
      type="button"
      variant="ghost"
      size="icon-xs"
      tabIndex={-1}
      data-settera-copy-link="true"
      aria-label={labels.copyLinkToSection}
      onClick={handleCopyLink}
    >
      {copyFeedback ? (
        <CheckIcon className="size-4" style={{ color: "var(--settera-success-color, #16a34a)" }} />
      ) : (
        <LinkIcon className="size-4" />
      )}
    </Button>
  ) : null;

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
          <div
            className="flex items-center gap-1"
            style={{ marginBottom: "var(--settera-section-title-gap, 0.75rem)" }}
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
          >
            <CollapsibleTrigger asChild>
              <button
                type="button"
                className="flex items-center gap-1 group cursor-pointer p-0"
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
            {deepLinkCtx && (
              <span className="inline-flex w-6 h-6 shrink-0">
                {copyButton}
              </span>
            )}
          </div>
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
      <div
        className="flex items-center gap-1"
        style={{ marginBottom: "var(--settera-section-title-gap, 0.75rem)" }}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      >
        <h2 id={sectionTitleId} tabIndex={-1} className="font-semibold" style={{ fontSize: "var(--settera-section-title-font-size, 1rem)" }}>
          {section.title}
        </h2>
        {deepLinkCtx && (
          <span className="inline-flex w-6 h-6 shrink-0">
            {copyButton}
          </span>
        )}
      </div>
      <div id={sectionContentId}>
        {sectionContent}
      </div>
    </section>
  );
}
