import React, { useMemo, useContext, useRef, useId, useCallback } from "react";
import { SetteraSchemaContext } from "@settera/react";
import type { PageDefinition } from "@settera/schema";
import { SetteraNavigationProvider } from "../providers/SetteraNavigationProvider.js";
import { useSetteraNavigation } from "../hooks/useSetteraNavigation.js";
import { useSetteraSearch } from "../hooks/useSetteraSearch.js";
import { useSetteraLayoutMainKeys } from "../hooks/useSetteraLayoutMainKeys.js";
import { useSetteraLayoutMobileShell } from "../hooks/useSetteraLayoutMobileShell.js";
import { useSetteraLayoutHighlight } from "../hooks/useSetteraLayoutHighlight.js";
import { useSetteraLayoutUrlSync } from "../hooks/useSetteraLayoutUrlSync.js";
import { SetteraSidebar } from "./SetteraSidebar.js";
import { SetteraPage } from "./SetteraPage.js";
import type { SetteraCustomPageProps } from "./SetteraPage.js";
import type { SetteraCustomSettingProps } from "./SetteraSetting.js";
import { ConfirmDialog } from "./ConfirmDialog.js";
import { SetteraDeepLinkContext } from "../contexts/SetteraDeepLinkContext.js";

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
  activeSettingQueryParam?: string;
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
  activeSettingQueryParam = "setting",
}: SetteraLayoutProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mainRef = useRef<HTMLElement>(null);
  const mobileDrawerId = useId();

  const schemaCtx = useContext(SetteraSchemaContext);
  const { query: searchQuery, setQuery } = useSetteraSearch();
  const {
    activePage,
    setActivePage,
    setHighlightedSettingKey,
    registerFocusContentHandler,
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
  });

  const resolvedMobileTitle =
    mobileTitle ?? schemaCtx?.schema.meta?.title ?? "Settings";

  const breadcrumbItems = useMemo<BreadcrumbItem[]>(() => {
    if (!schemaCtx) return [];
    const path = findPagePathByKey(schemaCtx.schema.pages, activePage) ?? [];
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
          ? "var(--settera-page-padding-mobile, 16px)"
          : "var(--settera-page-padding, 24px 32px)",
        backgroundColor: "var(--settera-page-bg, #f9fafb)",
        overflowY: "auto",
        outline: "none",
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
          fontFamily:
            '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
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
              minHeight: "var(--settera-mobile-topbar-height, 52px)",
              padding: "calc(env(safe-area-inset-top, 0px) + 8px) 12px 8px",
              borderBottom:
                "var(--settera-mobile-topbar-border, 1px solid #e5e7eb)",
              backgroundColor: "var(--settera-mobile-topbar-bg, #f9fafb)",
            }}
          >
            <button
              ref={menuButtonRef}
              type="button"
              aria-label="Open navigation"
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
                border: "var(--settera-mobile-menu-border, 1px solid #d1d5db)",
                backgroundColor: "var(--settera-mobile-menu-bg, #ffffff)",
                color: "var(--settera-mobile-menu-color, #111827)",
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
                    color: "var(--settera-breadcrumb-muted, #6b7280)",
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
                                color:
                                  "var(--settera-breadcrumb-current, #111827)",
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
                backgroundColor:
                  "var(--settera-mobile-overlay-bg, rgba(17, 24, 39, 0.45))",
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
                width: "var(--settera-mobile-drawer-width, min(85vw, 320px))",
                maxWidth: "100%",
                zIndex: 21,
                display: "flex",
                flexDirection: "column",
                backgroundColor: "var(--settera-mobile-drawer-bg, #f3f4f6)",
                borderRight:
                  "var(--settera-mobile-drawer-border, 1px solid #d1d5db)",
                boxShadow: "0 16px 40px rgba(0, 0, 0, 0.18)",
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
