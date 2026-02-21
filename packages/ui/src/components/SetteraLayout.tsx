import React, { useMemo, useContext, useRef, useId, useCallback, useEffect } from "react";
import { SetteraSchemaContext } from "@settera/react";
import type { PageDefinition } from "@settera/schema";
import { flattenPageItems, token } from "@settera/schema";
import { SetteraNavigationProvider } from "../providers/SetteraNavigationProvider.js";
import { useSetteraNavigation } from "../hooks/useSetteraNavigation.js";
import { useSetteraSearch } from "../hooks/useSetteraSearch.js";
import { useSetteraLayoutMainKeys, useSetteraLayoutHighlight, useSetteraLayoutUrlSync } from "@settera/react";
import { useSetteraLayoutMobileShell } from "../hooks/useSetteraLayoutMobileShell.js";
import { SetteraSidebar } from "./SetteraSidebar.js";
import { SetteraPage } from "./SetteraPage.js";
import type { SetteraCustomPageProps, SetteraActionPageProps } from "./SetteraPage.js";
import type { SetteraCustomSettingProps } from "./SetteraSetting.js";
import { ConfirmDialog } from "./ConfirmDialog.js";
import { SETTERA_SYSTEM_FONT } from "./SetteraPrimitives.js";
import { SetteraDeepLinkContext } from "../contexts/SetteraDeepLinkContext.js";
import type { SetteraLabels } from "../contexts/SetteraLabelsContext.js";
import { SetteraLabelsContext, mergeLabels, useSetteraLabels } from "../contexts/SetteraLabelsContext.js";

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
  activeSectionQueryParam?: string;
  customPages?: Record<string, React.ComponentType<SetteraCustomPageProps>>;
  customSettings?: Record<
    string,
    React.ComponentType<SetteraCustomSettingProps>
  >;
  customActionPages?: Record<string, React.ComponentType<SetteraActionPageProps>>;
  activeSettingQueryParam?: string;
  /** Controlled active page key from the consumer's router. */
  activePage?: string;
  /** Called when the user navigates to a different page (controlled mode). */
  onPageChange?: (key: string) => void;
  /** Returns path for a page key; enables `<a href>` in sidebar and path-based deep links. */
  getPageUrl?: (pageKey: string) => string;
  /** Override UI chrome strings for localization. Merged with DEFAULT_LABELS. */
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

/**
 * Two-column layout shell: sidebar navigation + content area.
 * Switches to a mobile drawer navigation below mobileBreakpoint.
 *
 * Wraps children in SetteraNavigationProvider internally so all
 * navigation hooks (useSetteraNavigation, useSetteraSearch) work
 * without extra setup.
 */
export function SetteraLayout(props: SetteraLayoutProps) {
  const resolvedLabels = useMemo(() => mergeLabels(props.labels), [props.labels]);

  return (
    <SetteraLabelsContext.Provider value={resolvedLabels}>
      <SetteraNavigationProvider
        activePage={props.activePage}
        onPageChange={props.onPageChange}
        getPageUrl={props.getPageUrl}
      >
        <SetteraLayoutInner {...props} />
      </SetteraNavigationProvider>
    </SetteraLabelsContext.Provider>
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
  activeSectionQueryParam = "section",
  customPages,
  customSettings,
  customActionPages,
  activeSettingQueryParam = "setting",
}: SetteraLayoutProps) {
  const labels = useSetteraLabels();
  const containerRef = useRef<HTMLDivElement>(null);
  const mainRef = useRef<HTMLElement>(null);
  const mobileDrawerId = useId();

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
    getPageUrl,
  } = useSetteraNavigation();

  const clearSearch = useCallback(() => setQuery(""), [setQuery]);

  const {
    menuButtonRef,
    mobileDrawerRef,
    isMobile,
    prefersReducedMotion,
    isMobileNavOpen,
    openMobileNav,
    closeMobileNav,
    handleDrawerKeyDown,
    overlayIsVisible,
    drawerTransition,
    overlayTransition,
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
    getPageUrl,
  });

  const resolvedMobileTitle =
    mobileTitle ?? schemaCtx?.schema.meta?.title ?? "Settings";

  const escapeSelectorValue = useCallback((value: string) => {
    if (typeof CSS !== "undefined" && typeof CSS.escape === "function") {
      return CSS.escape(value);
    }
    return value.replace(/["\\]/g, "\\$&");
  }, []);
  const previousPageRef = useRef(activePage);
  const previousSectionRef = useRef<string | null>(activeSection);

  useEffect(() => {
    if (subpage) return;
    const main = mainRef.current;
    if (!main) return;

    if (!activeSection) {
      // Only force top-scroll when a section on this same page was just cleared.
      const didClearSectionOnSamePage =
        previousPageRef.current === activePage &&
        previousSectionRef.current !== null;
      if (didClearSectionOnSamePage) {
        if (typeof main.scrollTo === "function") {
          main.scrollTo({ top: 0, behavior: prefersReducedMotion ? "instant" : "smooth" });
        } else {
          main.scrollTop = 0;
        }
      }
      previousPageRef.current = activePage;
      previousSectionRef.current = activeSection;
      return;
    }

    const selector = `[data-settera-page-key="${escapeSelectorValue(activePage)}"][data-settera-section-key="${escapeSelectorValue(activeSection)}"]`;

    const scrollToSection = () => {
      const section = main.querySelector(selector);
      if (!section || typeof (section as HTMLElement).scrollIntoView !== "function") {
        return false;
      }
      (section as HTMLElement).scrollIntoView({
        behavior: prefersReducedMotion ? "instant" : "smooth",
        block: "start",
      });
      previousPageRef.current = activePage;
      previousSectionRef.current = activeSection;
      return true;
    };

    // The section element may not exist yet if the page changed in the same
    // render cycle.  Try immediately, then retry after the browser paints.
    if (!scrollToSection()) {
      const raf = requestAnimationFrame(() => {
        scrollToSection();
      });
      return () => cancelAnimationFrame(raf);
    }
  }, [activePage, activeSection, subpage, mainRef, prefersReducedMotion, escapeSelectorValue]);

  const breadcrumbItems = useMemo<BreadcrumbItem[]>(() => {
    if (!schemaCtx) return [];
    const path = findPagePathByKey(flattenPageItems(schemaCtx.schema.pages), activePage) ?? [];
    return path.map((page) => ({ key: page.key, title: page.title }));
  }, [schemaCtx, activePage]);

  const content = (
    <main
      ref={mainRef}
      tabIndex={-1}
      onKeyDown={handleComposedKeyDown}
      style={{
        flex: 1,
        padding: isMobile
          ? token("page-padding-mobile")
          : token("page-padding"),
        backgroundColor: token("page-bg"),
        overflowY: "auto",
        outline: "none",
      }}
    >
      <div
        style={{
          maxWidth: token("content-max-width"),
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
  );

  const mobileBackToApp = useMemo(() => {
    if (!backToApp) return undefined;
    if (!backToApp.onClick) {
      return backToApp;
    }

    return {
      ...backToApp,
      onClick: () => {
        backToApp.onClick?.();
        closeMobileNav();
      },
    };
  }, [backToApp, closeMobileNav]);

  return (
    <SetteraDeepLinkContext.Provider value={deepLinkContextValue}>
      <div
        ref={containerRef}
        style={{
          display: "flex",
          flexDirection: isMobile ? "column" : "row",
          height: "100%",
          position: "relative",
          fontFamily: SETTERA_SYSTEM_FONT,
        }}
      >
        {!isMobile && (
          <SetteraSidebar renderIcon={renderIcon} backToApp={backToApp} />
        )}

        {isMobile && (
          <header
            style={{
              position: "sticky",
              top: 0,
              zIndex: 5,
              display: "flex",
              alignItems: "center",
              gap: "8px",
              minHeight: token("mobile-topbar-height"),
              padding: "calc(env(safe-area-inset-top, 0px) + 8px) 12px 8px",
              borderBottom: token("mobile-topbar-border"),
              backgroundColor: token("mobile-topbar-bg"),
            }}
          >
            <button
              ref={menuButtonRef}
              type="button"
              aria-label={labels.openNavigation}
              aria-expanded={isMobileNavOpen}
              aria-controls={mobileDrawerId}
              onClick={openMobileNav}
              style={{
                width: "36px",
                height: "36px",
                display: "inline-flex",
                alignItems: "center",
                justifyContent: "center",
                borderRadius: "8px",
                border: token("mobile-menu-border"),
                backgroundColor: token("mobile-menu-bg"),
                color: token("mobile-menu-color"),
                cursor: "pointer",
                flexShrink: 0,
              }}
            >
              <span
                aria-hidden="true"
                style={{ fontSize: "18px", lineHeight: 1 }}
              >
                ≡
              </span>
            </button>

            {showBreadcrumbs && (
              <nav aria-label="Breadcrumb" style={{ minWidth: 0, flex: 1 }}>
                <ol
                  style={{
                    listStyle: "none",
                    margin: 0,
                    padding: 0,
                    display: "flex",
                    alignItems: "center",
                    gap: "6px",
                    color: token("breadcrumb-muted"),
                    minWidth: 0,
                    whiteSpace: "nowrap",
                    overflow: "hidden",
                  }}
                >
                  <li
                    style={{
                      fontSize: "13px",
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                    }}
                  >
                    {resolvedMobileTitle}
                  </li>
                  {breadcrumbItems.map((crumb, index) => {
                    const isLast = index === breadcrumbItems.length - 1;
                    return (
                      <React.Fragment key={crumb.key}>
                        <li aria-hidden="true" style={{ color: "inherit" }}>
                          /
                        </li>
                        <li
                          style={{
                            minWidth: 0,
                            overflow: "hidden",
                            textOverflow: "ellipsis",
                          }}
                        >
                          {isLast ? (
                            <span
                              aria-current="page"
                              style={{
                                fontSize: "13px",
                                color: token("breadcrumb-current"),
                                fontWeight: 600,
                              }}
                            >
                              {crumb.title}
                            </span>
                          ) : (
                            <button
                              type="button"
                              onClick={() => setActivePage(crumb.key)}
                              style={{
                                border: "none",
                                background: "transparent",
                                padding: 0,
                                fontSize: "13px",
                                color: "inherit",
                                cursor: "pointer",
                              }}
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
          <>
            <div
              role="presentation"
              onClick={overlayIsVisible ? closeMobileNav : undefined}
              style={{
                position: "fixed",
                inset: 0,
                backgroundColor: token("mobile-overlay-bg"),
                opacity: overlayIsVisible ? 1 : 0,
                transition: overlayTransition,
                pointerEvents: overlayIsVisible ? "auto" : "none",
                zIndex: 20,
              }}
            />
            <div
              id={mobileDrawerId}
              ref={mobileDrawerRef}
              role="dialog"
              aria-modal="true"
              aria-hidden={!overlayIsVisible}
              aria-label="Settings navigation"
              tabIndex={-1}
              onKeyDown={handleDrawerKeyDown}
              style={{
                position: "fixed",
                left: 0,
                top: 0,
                bottom: 0,
                width: token("mobile-drawer-width"),
                maxWidth: "100%",
                zIndex: 21,
                display: "flex",
                flexDirection: "column",
                backgroundColor: token("mobile-drawer-bg"),
                borderRight: token("mobile-drawer-border"),
                boxShadow: token("mobile-drawer-shadow"),
                overflow: "hidden",
                transform: overlayIsVisible
                  ? "translateX(0)"
                  : "translateX(-100%)",
                transition: drawerTransition,
                pointerEvents: overlayIsVisible ? "auto" : "none",
              }}
            >
              <div
                style={{
                  display: "flex",
                  height: "100%",
                  minHeight: 0,
                  overflow: "hidden",
                  paddingBottom: "env(safe-area-inset-bottom, 0px)",
                  ...({
                    "--settera-sidebar-width": "100%",
                  } as React.CSSProperties),
                }}
              >
                <SetteraSidebar
                  renderIcon={renderIcon}
                  onNavigate={closeMobileNav}
                  backToApp={mobileBackToApp}
                />
              </div>
            </div>
          </>
        )}

        <ConfirmDialog />
      </div>
    </SetteraDeepLinkContext.Provider>
  );
}
