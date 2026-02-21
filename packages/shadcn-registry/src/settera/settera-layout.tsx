"use client";

import React, { useMemo, useContext, useRef, useCallback, useEffect, useState } from "react";
import { SetteraSchemaContext } from "@settera/react";
import type { PageDefinition } from "@settera/schema";
import { flattenPageItems } from "@settera/schema";
import { SetteraNavigationProvider } from "./settera-navigation-provider";
import { useSetteraNavigation } from "./use-settera-navigation";
import { useSetteraSearch } from "./use-settera-search";
import { useSetteraLayoutMainKeys, useSetteraLayoutHighlight, useSetteraLayoutUrlSync } from "@settera/react";
import { SetteraSidebar } from "./settera-sidebar";
import { SetteraPage } from "./settera-page";
import type { SetteraCustomPageProps } from "./settera-page";
import type { SetteraCustomSettingProps } from "./settera-setting";
import type { SetteraActionPageProps } from "./settera-subpage-content";
import { SetteraConfirmDialog } from "./settera-confirm-dialog";
import { SetteraDeepLinkContext } from "./settera-deep-link-context";
import type { SetteraLabels } from "./settera-labels";
import { SetteraLabelsContext, mergeLabels } from "./settera-labels";
import {
  SidebarProvider,
  SidebarTrigger,
  useSidebar,
} from "@/components/ui/sidebar";

export interface SetteraBackToAppConfig {
  label?: string;
  href?: string;
  onClick?: () => void;
}

export interface SetteraLayoutProps {
  renderIcon?: (iconName: string) => React.ReactNode;
  children?: React.ReactNode;
  showBreadcrumbs?: boolean;
  mobileTitle?: string;
  backToApp?: SetteraBackToAppConfig;
  syncActivePageWithUrl?: boolean;
  activePageQueryParam?: string;
  activeSectionQueryParam?: string;
  customPages?: Record<string, React.ComponentType<SetteraCustomPageProps>>;
  customSettings?: Record<
    string,
    React.ComponentType<SetteraCustomSettingProps>
  >;
  customActionPages?: Record<
    string,
    React.ComponentType<SetteraActionPageProps>
  >;
  activeSettingQueryParam?: string;
  hideFooterHints?: boolean;
  labels?: SetteraLabels;
}

interface BreadcrumbItem {
  key: string;
  title: string;
}

function findPagePathByKey(
  pages: PageDefinition[],
  targetKey: string,
  trail: PageDefinition[] = [],
): PageDefinition[] | null {
  for (const page of pages) {
    const nextTrail = [...trail, page];
    if (page.key === targetKey) return nextTrail;
    if (page.pages && page.pages.length > 0) {
      const nested = findPagePathByKey(page.pages, targetKey, nextTrail);
      if (nested) return nested;
    }
  }
  return null;
}

function usePrefersReducedMotion(): boolean {
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined" || !window.matchMedia) return;

    const media = window.matchMedia("(prefers-reduced-motion: reduce)");
    const onChange = () => setPrefersReducedMotion(media.matches);

    onChange();
    media.addEventListener("change", onChange);
    return () => media.removeEventListener("change", onChange);
  }, []);

  return prefersReducedMotion;
}

export function SetteraLayout(props: SetteraLayoutProps) {
  return (
    <SetteraNavigationProvider>
      <SidebarProvider
        className="h-svh overflow-hidden"
        style={
          {
            "--sidebar-width": "280px",
            "--sidebar-width-mobile": "min(85vw, 320px)",
          } as React.CSSProperties
        }
      >
        <SetteraLayoutInner {...props} />
      </SidebarProvider>
    </SetteraNavigationProvider>
  );
}

function SetteraLayoutInner({
  renderIcon,
  children,
  showBreadcrumbs = true,
  mobileTitle,
  backToApp,
  syncActivePageWithUrl = true,
  activePageQueryParam = "setteraPage",
  activeSectionQueryParam = "section",
  customPages,
  customSettings,
  customActionPages,
  activeSettingQueryParam = "setting",
  hideFooterHints,
  labels,
}: SetteraLayoutProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mainRef = useRef<HTMLElement>(null);

  const schemaCtx = useContext(SetteraSchemaContext);
  const { query: searchQuery, setQuery } = useSetteraSearch();
  const {
    activePage,
    setActivePage,
    activeSection,
    setActiveSection,
    setHighlightedSettingKey,
    registerFocusContentHandler,
    subpage,
    openSubpage,
    closeSubpage,
  } = useSetteraNavigation();

  const { isMobile } = useSidebar();
  const prefersReducedMotion = usePrefersReducedMotion();

  const resolvedLabels = useMemo(() => mergeLabels(labels), [labels]);

  const clearSearch = useCallback(() => setQuery(""), [setQuery]);

  const { handleComposedKeyDown } = useSetteraLayoutMainKeys({
    containerRef,
    mainRef,
    clearSearch,
    searchQuery,
    registerFocusContentHandler,
    closeSubpage,
    subpageSettingKey: subpage?.settingKey ?? null,
    sidebarSelector: '[data-sidebar="sidebar"]',
  });

  const { setPendingScrollKey, scrollToSetting } = useSetteraLayoutHighlight({
    activePage,
    mainRef,
    prefersReducedMotion,
    setHighlightedSettingKey,
  });

  const { deepLinkContextValue } = useSetteraLayoutUrlSync({
    schemaCtx,
    activePage,
    setActivePage,
    activeSection,
    setActiveSection,
    syncActivePageWithUrl,
    activePageQueryParam,
    activeSectionQueryParam,
    activeSettingQueryParam,
    scrollToSetting,
    setPendingScrollKey,
    subpage,
    openSubpage,
  });

  const resolvedMobileTitle =
    mobileTitle ?? schemaCtx?.schema.meta?.title ?? "Settings";

  const escapeSelectorValue = useCallback((value: string) => {
    if (typeof CSS !== "undefined" && typeof CSS.escape === "function") {
      return CSS.escape(value);
    }
    return value.replace(/["\\]/g, "\\$&");
  }, []);

  useEffect(() => {
    if (subpage) return;
    const main = mainRef.current;
    if (!main) return;

    if (!activeSection) {
      if (typeof main.scrollTo === "function") {
        main.scrollTo({
          top: 0,
          behavior: prefersReducedMotion ? "instant" : "smooth",
        });
      } else {
        main.scrollTop = 0;
      }
      return;
    }

    const section = main.querySelector(
      `[data-settera-page-key="${escapeSelectorValue(activePage)}"][data-settera-section-key="${escapeSelectorValue(activeSection)}"]`,
    );
    if (!section || typeof (section as HTMLElement).scrollIntoView !== "function") {
      return;
    }
    (section as HTMLElement).scrollIntoView({
      behavior: prefersReducedMotion ? "instant" : "smooth",
      block: "start",
    });
  }, [activePage, activeSection, subpage, mainRef, prefersReducedMotion, escapeSelectorValue]);

  const breadcrumbItems = useMemo<BreadcrumbItem[]>(() => {
    if (!schemaCtx) return [];
    const path = findPagePathByKey(flattenPageItems(schemaCtx.schema.pages), activePage) ?? [];
    const items = path.map((page) => ({ key: page.key, title: page.title }));
    if (subpage) {
      const setting = schemaCtx.getSettingByKey(subpage.settingKey);
      if (setting && "title" in setting && setting.title) {
        items.push({ key: subpage.settingKey, title: setting.title });
      }
    }
    return items;
  }, [schemaCtx, activePage, subpage]);

  return (
    <SetteraLabelsContext.Provider value={resolvedLabels}>
      <SetteraDeepLinkContext.Provider value={deepLinkContextValue}>
        <div
          ref={containerRef}
          className="flex h-full w-full relative"
        >
          <SetteraSidebar
            renderIcon={renderIcon}
            backToApp={backToApp}
            hideFooterHints={hideFooterHints}
          />

          <div className="flex flex-1 flex-col min-w-0">
            {isMobile && (
              <header className="sticky top-0 z-[5] flex items-center gap-2 min-h-[52px] px-3 py-2 border-b bg-background">
                <SidebarTrigger className="shrink-0" />

                {showBreadcrumbs && (
                  <nav
                    aria-label="Breadcrumb"
                    className="min-w-0 flex-1"
                  >
                    <ol className="list-none m-0 p-0 flex items-center gap-1.5 text-muted-foreground text-[13px] min-w-0 whitespace-nowrap overflow-hidden">
                      <li className="overflow-hidden text-ellipsis">
                        {resolvedMobileTitle}
                      </li>
                      {breadcrumbItems.map((crumb, index) => {
                        const isLast = index === breadcrumbItems.length - 1;
                        return (
                          <React.Fragment key={crumb.key}>
                            <li aria-hidden="true">/</li>
                            <li className="min-w-0 overflow-hidden text-ellipsis">
                              {isLast ? (
                                <span
                                  aria-current="page"
                                  className="text-foreground font-semibold"
                                >
                                  {crumb.title}
                                </span>
                              ) : (
                                <button
                                  type="button"
                                  onClick={() => {
                                    if (subpage) closeSubpage();
                                    setActivePage(crumb.key);
                                  }}
                                  className="border-none bg-transparent p-0 text-[13px] text-inherit cursor-pointer"
                                >
                                  {crumb.title}
                                </button>
                              )}
                            </li>
                          </React.Fragment>
                        );
                      })}
                    </ol>
                  </nav>
                )}
              </header>
            )}

            <main
              ref={mainRef}
              tabIndex={-1}
              onKeyDown={handleComposedKeyDown}
              className="flex-1 min-h-0 overflow-y-auto outline-none bg-background"
              style={{
                padding: isMobile
                  ? "var(--settera-page-padding-mobile, 1rem)"
                  : "var(--settera-page-padding, 1.5rem 2rem)",
                paddingBottom: isMobile
                  ? "var(--settera-page-padding-bottom-mobile, 3rem)"
                  : "var(--settera-page-padding-bottom, 4rem)",
              }}
            >
              <div
                style={{
                  maxWidth: "var(--settera-content-max-width, 640px)",
                  marginInline: "auto",
                }}
              >
                {children ?? (
                  <SetteraPage
                    customPages={customPages}
                    customSettings={customSettings}
                    customActionPages={customActionPages}
                  />
                )}
              </div>
            </main>
          </div>

          <SetteraConfirmDialog />
        </div>
      </SetteraDeepLinkContext.Provider>
    </SetteraLabelsContext.Provider>
  );
}
