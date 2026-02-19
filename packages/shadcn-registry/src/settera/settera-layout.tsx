"use client";

import React, { useMemo, useContext, useRef, useCallback } from "react";
import { SetteraSchemaContext } from "@settera/react";
import type { PageDefinition } from "@settera/schema";
import { SetteraNavigationProvider } from "./settera-navigation-provider";
import { useSetteraNavigation } from "./use-settera-navigation";
import { useSetteraSearch } from "./use-settera-search";
import { useSetteraLayoutMainKeys } from "./use-settera-layout-main-keys";
import { useSetteraLayoutMobileShell } from "./use-settera-layout-mobile-shell";
import { useSetteraLayoutHighlight } from "./use-settera-layout-highlight";
import { useSetteraLayoutUrlSync } from "./use-settera-layout-url-sync";
import { SetteraSidebar } from "./settera-sidebar";
import { SetteraPage } from "./settera-page";
import type { SetteraCustomPageProps } from "./settera-page";
import type { SetteraCustomSettingProps } from "./settera-setting";
import type { SetteraActionPageProps } from "./settera-subpage-content";
import { SetteraConfirmDialog } from "./settera-confirm-dialog";
import { SetteraDeepLinkContext } from "./settera-setting-row";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetTitle,
} from "@/components/ui/sheet";
import { cn } from "@/lib/utils";

export interface SetteraBackToAppConfig {
  label?: string;
  href?: string;
  onClick?: () => void;
}

export interface SetteraLayoutProps {
  renderIcon?: (iconName: string) => React.ReactNode;
  children?: React.ReactNode;
  mobileBreakpoint?: number;
  showBreadcrumbs?: boolean;
  mobileTitle?: string;
  backToApp?: SetteraBackToAppConfig;
  syncActivePageWithUrl?: boolean;
  activePageQueryParam?: string;
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

export function SetteraLayout(props: SetteraLayoutProps) {
  return (
    <SetteraNavigationProvider>
      <SetteraLayoutInner {...props} />
    </SetteraNavigationProvider>
  );
}

function SetteraLayoutInner({
  renderIcon,
  children,
  mobileBreakpoint = 900,
  showBreadcrumbs = true,
  mobileTitle,
  backToApp,
  syncActivePageWithUrl = true,
  activePageQueryParam = "setteraPage",
  customPages,
  customSettings,
  customActionPages,
  activeSettingQueryParam = "setting",
  hideFooterHints,
}: SetteraLayoutProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mainRef = useRef<HTMLElement>(null);

  const schemaCtx = useContext(SetteraSchemaContext);
  const { query: searchQuery, setQuery } = useSetteraSearch();
  const {
    activePage,
    setActivePage,
    setHighlightedSettingKey,
    registerFocusContentHandler,
    subpage,
    openSubpage,
    closeSubpage,
  } = useSetteraNavigation();

  const clearSearch = useCallback(() => setQuery(""), [setQuery]);

  const {
    menuButtonRef,
    isMobile,
    prefersReducedMotion,
    isMobileNavOpen,
    openMobileNav,
    closeMobileNav,
  } = useSetteraLayoutMobileShell(mobileBreakpoint);

  const { handleComposedKeyDown } = useSetteraLayoutMainKeys({
    containerRef,
    mainRef,
    clearSearch,
    searchQuery,
    registerFocusContentHandler,
    closeSubpage,
    subpageSettingKey: subpage?.settingKey ?? null,
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
    syncActivePageWithUrl,
    activePageQueryParam,
    activeSettingQueryParam,
    scrollToSetting,
    setPendingScrollKey,
    subpage,
    openSubpage,
  });

  const resolvedMobileTitle =
    mobileTitle ?? schemaCtx?.schema.meta?.title ?? "Settings";

  const breadcrumbItems = useMemo<BreadcrumbItem[]>(() => {
    if (!schemaCtx) return [];
    const path = findPagePathByKey(schemaCtx.schema.pages, activePage) ?? [];
    return path.map((page) => ({ key: page.key, title: page.title }));
  }, [schemaCtx, activePage]);

  const mobileBackToApp = useMemo(() => {
    if (!backToApp) return undefined;
    if (!backToApp.onClick) return backToApp;
    return {
      ...backToApp,
      onClick: () => {
        backToApp.onClick?.();
        closeMobileNav();
      },
    };
  }, [backToApp, closeMobileNav]);

  const content = (
    <main
      ref={mainRef}
      tabIndex={-1}
      onKeyDown={handleComposedKeyDown}
      className={cn(
        "flex-1 overflow-y-auto outline-none bg-background",
        isMobile ? "p-4" : "px-8 py-6",
      )}
    >
      <div className="max-w-[640px] mx-auto">
        {children ?? (
          <SetteraPage
            customPages={customPages}
            customSettings={customSettings}
            customActionPages={customActionPages}
          />
        )}
      </div>
    </main>
  );

  return (
    <SetteraDeepLinkContext.Provider value={deepLinkContextValue}>
      <div
        ref={containerRef}
        className={cn(
          "flex h-full relative",
          isMobile ? "flex-col" : "flex-row",
        )}
      >
        {!isMobile && (
          <SetteraSidebar
            renderIcon={renderIcon}
            backToApp={backToApp}
            hideFooterHints={hideFooterHints}
          />
        )}

        {isMobile && (
          <header className="sticky top-0 z-[5] flex items-center gap-2 min-h-[52px] px-3 py-2 border-b bg-background">
            <Button
              ref={menuButtonRef}
              variant="ghost"
              size="icon"
              aria-label="Open navigation"
              aria-expanded={isMobileNavOpen}
              onClick={openMobileNav}
              className="shrink-0"
            >
              <svg
                width="18"
                height="18"
                viewBox="0 0 18 18"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
              >
                <path d="M3 5h12M3 9h12M3 13h12" />
              </svg>
            </Button>

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
                              onClick={() => setActivePage(crumb.key)}
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

        {content}

        {isMobile && (
          <Sheet open={isMobileNavOpen} onOpenChange={(open) => { if (!open) closeMobileNav(); }}>
            <SheetContent side="left" className="w-[min(85vw,320px)] p-0">
              <SheetTitle className="sr-only">Settings navigation</SheetTitle>
              <div className="h-full overflow-hidden pb-[env(safe-area-inset-bottom,0px)]">
                <SetteraSidebar
                  renderIcon={renderIcon}
                  onNavigate={closeMobileNav}
                  backToApp={mobileBackToApp}
                  hideFooterHints={hideFooterHints}
                />
              </div>
            </SheetContent>
          </Sheet>
        )}

        <SetteraConfirmDialog />
      </div>
    </SetteraDeepLinkContext.Provider>
  );
}
