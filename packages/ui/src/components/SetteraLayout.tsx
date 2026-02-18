import React, {
  useRef,
  useCallback,
  useEffect,
  useMemo,
  useContext,
  useState,
  useId,
} from "react";
import { SetteraSchemaContext } from "@settera/react";
import type { PageDefinition } from "@settera/schema";
import { SetteraNavigationProvider } from "../providers/SetteraNavigationProvider.js";
import { useSetteraNavigation } from "../hooks/useSetteraNavigation.js";
import { useSetteraSearch } from "../hooks/useSetteraSearch.js";
import { useSetteraGlobalKeys, isTextInput } from "../hooks/useSetteraGlobalKeys.js";
import { useContentCardNavigation } from "../hooks/useContentCardNavigation.js";
import { SetteraSidebar } from "./SetteraSidebar.js";
import { SetteraPage } from "./SetteraPage.js";
import type { SetteraCustomPageProps } from "./SetteraPage.js";
import type { SetteraCustomSettingProps } from "./SetteraSetting.js";
import { ConfirmDialog } from "./ConfirmDialog.js";
import { SetteraDeepLinkContext } from "../contexts/SetteraDeepLinkContext.js";
import type { SetteraDeepLinkContextValue } from "../contexts/SetteraDeepLinkContext.js";

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

function collectPageKeys(
  pages: PageDefinition[],
  acc = new Set<string>(),
): Set<string> {
  for (const page of pages) {
    acc.add(page.key);
    if (page.pages && page.pages.length > 0) {
      collectPageKeys(page.pages, acc);
    }
  }
  return acc;
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
  const menuButtonRef = useRef<HTMLButtonElement>(null);
  const mobileDrawerRef = useRef<HTMLDivElement>(null);
  const didInitUrlSyncRef = useRef(false);
  const pendingScrollKeyRef = useRef<string | null>(null);
  const initialSettingKeyRef = useRef<string | null | undefined>(undefined);
  const highlightTimerRef = useRef<ReturnType<typeof setTimeout>>();
  const mobileDrawerId = useId();
  const schemaCtx = useContext(SetteraSchemaContext);
  const { query: searchQuery, setQuery } = useSetteraSearch();
  const {
    activePage,
    setActivePage,
    setHighlightedSettingKey,
    registerFocusContentHandler,
  } = useSetteraNavigation();
  const [isMobile, setIsMobile] = useState(() => {
    if (typeof window === "undefined") return false;
    return window.innerWidth < mobileBreakpoint;
  });
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);
  const [isMobileNavOpen, setIsMobileNavOpen] = useState(false);

  const escapeSelectorValue = useCallback((value: string) => {
    if (typeof CSS !== "undefined" && typeof CSS.escape === "function") {
      return CSS.escape(value);
    }
    return value.replace(/["\\]/g, "\\$&");
  }, []);

  // Capture the initial setting key from the URL during render (before effects)
  // so it survives React StrictMode's effect double-fire, which would otherwise
  // let the URL-write effect delete the param before readSettingFromUrl runs.
  if (
    initialSettingKeyRef.current === undefined &&
    syncActivePageWithUrl &&
    typeof window !== "undefined"
  ) {
    initialSettingKeyRef.current =
      new URL(window.location.href).searchParams.get(activeSettingQueryParam) ??
      null;
  }

  const clearSearch = useCallback(() => setQuery(""), [setQuery]);

  const openMobileNav = useCallback(() => setIsMobileNavOpen(true), []);
  const closeMobileNav = useCallback(() => setIsMobileNavOpen(false), []);

  useSetteraGlobalKeys({ containerRef, clearSearch, searchQuery });

  const { onKeyDown: cardNavKeyDown } = useContentCardNavigation({ mainRef });

  const resolvedMobileTitle =
    mobileTitle ?? schemaCtx?.schema.meta?.title ?? "Settings";

  const breadcrumbItems = useMemo<BreadcrumbItem[]>(() => {
    if (!schemaCtx) return [];
    const path = findPagePathByKey(schemaCtx.schema.pages, activePage) ?? [];
    return path.map((page) => ({ key: page.key, title: page.title }));
  }, [schemaCtx, activePage]);

  const validPageKeys = useMemo(() => {
    if (!schemaCtx) return new Set<string>();
    return collectPageKeys(schemaCtx.schema.pages);
  }, [schemaCtx]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (!syncActivePageWithUrl || !validPageKeys.has(activePage)) return;
    if (!didInitUrlSyncRef.current) return;

    const url = new URL(window.location.href);
    const fromUrl = url.searchParams.get(activePageQueryParam);
    if (fromUrl === activePage) return;
    url.searchParams.set(activePageQueryParam, activePage);
    // Clear stale setting param when page changes via navigation
    url.searchParams.delete(activeSettingQueryParam);
    window.history.replaceState(window.history.state, "", url);
  }, [
    activePage,
    activePageQueryParam,
    activeSettingQueryParam,
    syncActivePageWithUrl,
    validPageKeys,
  ]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (!syncActivePageWithUrl) return;

    const readFromUrl = () => {
      const url = new URL(window.location.href);
      const pageKey = url.searchParams.get(activePageQueryParam);
      if (pageKey && validPageKeys.has(pageKey) && pageKey !== activePage) {
        setActivePage(pageKey);
      }
    };

    readFromUrl();
    didInitUrlSyncRef.current = true;
    window.addEventListener("popstate", readFromUrl);
    return () => window.removeEventListener("popstate", readFromUrl);
  }, [
    activePage,
    activePageQueryParam,
    setActivePage,
    syncActivePageWithUrl,
    validPageKeys,
  ]);

  useEffect(() => {
    if (typeof window === "undefined" || !window.matchMedia) return;

    const media = window.matchMedia("(prefers-reduced-motion: reduce)");
    const onChange = () => setPrefersReducedMotion(media.matches);

    onChange();
    if (typeof media.addEventListener === "function") {
      media.addEventListener("change", onChange);
      return () => media.removeEventListener("change", onChange);
    }

    media.addListener(onChange);
    return () => media.removeListener(onChange);
  }, []);

  // Scroll-and-highlight for deep-linked settings.
  const scrollToSettingNow = useCallback(
    (key: string) => {
      const main = mainRef.current;
      if (!main) return false;
      const el = main.querySelector(
        `[data-setting-key="${escapeSelectorValue(key)}"]`,
      );
      if (!el) return false;

      if (typeof el.scrollIntoView === "function") {
        el.scrollIntoView({
          behavior: prefersReducedMotion ? "instant" : "smooth",
          block: "center",
        });
      }
      setHighlightedSettingKey(key);
      clearTimeout(highlightTimerRef.current);
      highlightTimerRef.current = setTimeout(
        () => setHighlightedSettingKey(null),
        2000,
      );
      return true;
    },
    [escapeSelectorValue, prefersReducedMotion, setHighlightedSettingKey],
  );

  const scrollToSetting = useCallback(
    (key: string) => {
      requestAnimationFrame(() => {
        void scrollToSettingNow(key);
      });
    },
    [scrollToSettingNow],
  );

  // Clean up highlight timer on unmount.
  useEffect(() => {
    return () => clearTimeout(highlightTimerRef.current);
  }, []);
  // Consume pending scroll key after page renders.
  useEffect(() => {
    const key = pendingScrollKeyRef.current;
    if (!key) return;

    if (scrollToSettingNow(key)) {
      pendingScrollKeyRef.current = null;
      return;
    }

    let cancelled = false;
    let attempts = 0;
    const maxAttempts = 8;

    const attemptScroll = () => {
      if (cancelled) return;

      const didScroll = scrollToSettingNow(key);
      if (didScroll) {
        pendingScrollKeyRef.current = null;
        return;
      }

      attempts += 1;
      if (attempts >= maxAttempts) return;
      requestAnimationFrame(attemptScroll);
    };

    requestAnimationFrame(attemptScroll);

    return () => {
      cancelled = true;
    };
  }, [activePage, scrollToSettingNow]);

  // Read setting param from URL on mount and popstate.
  // Separate from page-sync to avoid re-running on every activePage change.
  useEffect(() => {
    if (typeof window === "undefined") return;
    if (!syncActivePageWithUrl || !schemaCtx) return;

    const processSettingKey = (settingKey: string | null) => {
      if (!settingKey) return;

      const flat = schemaCtx.flatSettings.find(
        (f) => f.definition.key === settingKey,
      );
      if (!flat) return;

      const targetPage = flat.pageKey;
      if (!targetPage || !validPageKeys.has(targetPage)) return;

      if (targetPage !== activePage) {
        setActivePage(targetPage);
        // Page will change — scroll after render via pending ref
        pendingScrollKeyRef.current = settingKey;
      } else {
        // Already on the correct page — scroll immediately
        scrollToSetting(settingKey);
      }
    };

    const initialKey = initialSettingKeyRef.current;
    if (initialKey !== undefined) {
      initialSettingKeyRef.current = undefined;
      processSettingKey(initialKey);
    }

    const onPopState = () => {
      const settingKey = new URL(window.location.href).searchParams.get(
        activeSettingQueryParam,
      );
      processSettingKey(settingKey);
    };

    window.addEventListener("popstate", onPopState);
    return () => window.removeEventListener("popstate", onPopState);
    // activePage intentionally read but not in deps — we only want this
    // to run on mount and popstate, not on every page navigation.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    activeSettingQueryParam,
    syncActivePageWithUrl,
    validPageKeys,
    schemaCtx,
    setActivePage,
    scrollToSetting,
  ]);

  // Deep-link context value for copy-link buttons.
  const deepLinkContextValue =
    useMemo<SetteraDeepLinkContextValue | null>(() => {
      if (!syncActivePageWithUrl) return null;
      return {
        getSettingUrl: (settingKey: string) => {
          const url = new URL(window.location.href);
          // Look up the setting's page
          const flat = schemaCtx?.flatSettings.find(
            (f) => f.definition.key === settingKey,
          );
          if (flat) {
            url.searchParams.set(activePageQueryParam, flat.pageKey);
          }
          url.searchParams.set(activeSettingQueryParam, settingKey);
          return url.toString();
        },
      };
    }, [
      syncActivePageWithUrl,
      schemaCtx,
      activePageQueryParam,
      activeSettingQueryParam,
    ]);

  // Keep isMobile in sync with viewport width.
  useEffect(() => {
    if (typeof window === "undefined") return;

    const current = window.innerWidth < mobileBreakpoint;
    if (current !== isMobile) {
      setIsMobile(current);
    }

    const onResize = () => {
      const next = window.innerWidth < mobileBreakpoint;
      setIsMobile((prev) => (prev === next ? prev : next));
    };

    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, [mobileBreakpoint, isMobile]);

  // Close mobile nav when switching to desktop mode.
  useEffect(() => {
    if (!isMobile && isMobileNavOpen) {
      setIsMobileNavOpen(false);
    }
  }, [isMobile, isMobileNavOpen]);

  // Lock background scrolling while the mobile drawer is open.
  useEffect(() => {
    if (typeof document === "undefined") return;
    if (!isMobile || !isMobileNavOpen) return;

    const previousBodyOverflow = document.body.style.overflow;
    const previousHtmlOverflow = document.documentElement.style.overflow;
    document.body.style.overflow = "hidden";
    document.documentElement.style.overflow = "hidden";

    return () => {
      document.body.style.overflow = previousBodyOverflow;
      document.documentElement.style.overflow = previousHtmlOverflow;
    };
  }, [isMobile, isMobileNavOpen]);

  // Focus drawer search on open and restore trigger focus on close.
  useEffect(() => {
    if (!isMobile) return;

    if (isMobileNavOpen) {
      requestAnimationFrame(() => {
        const drawer = mobileDrawerRef.current;
        if (!drawer) return;
        const searchInput = drawer.querySelector<HTMLInputElement>(
          'input[role="searchbox"]',
        );
        const fallback = drawer.querySelector<HTMLElement>("button, a, input");
        if (searchInput) {
          searchInput.focus();
        } else if (fallback) {
          fallback.focus();
        } else {
          drawer.focus();
        }
      });
      return;
    }

    menuButtonRef.current?.focus();
  }, [isMobile, isMobileNavOpen]);

  // Register handler so sidebar Enter can focus the first card in content.
  useEffect(() => {
    return registerFocusContentHandler(() => {
      requestAnimationFrame(() => {
        const main = mainRef.current;
        if (!main) return;
        const target = main.querySelector<HTMLElement>("[data-setting-key]");
        if (target) {
          target.focus();
        } else {
          main.focus();
        }
      });
    });
  }, [registerFocusContentHandler]);

  // Ctrl+ArrowDown/Up section heading jumping within <main>.
  const handleSectionKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLElement>) => {
      if (!e.ctrlKey) return;
      if (e.key !== "ArrowDown" && e.key !== "ArrowUp") return;
      if (isTextInput(e.target)) return;

      const main = e.currentTarget;
      const headings = Array.from(
        main.querySelectorAll<HTMLElement>(
          'h2[id^="settera-section-"], h3[id^="settera-subsection-"]',
        ),
      );
      if (headings.length === 0) return;

      e.preventDefault();

      const activeEl = document.activeElement;
      let currentIndex = -1;
      for (let i = 0; i < headings.length; i++) {
        if (headings[i] === activeEl || headings[i].contains(activeEl)) {
          currentIndex = i;
          break;
        }
      }

      const nextIndex =
        e.key === "ArrowDown"
          ? currentIndex < headings.length - 1
            ? currentIndex + 1
            : 0
          : currentIndex > 0
            ? currentIndex - 1
            : headings.length - 1;

      headings[nextIndex].focus();
    },
    [],
  );

  // Compose card navigation + section heading jumping.
  const handleComposedKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLElement>) => {
      cardNavKeyDown(e);
      if (!e.defaultPrevented) {
        handleSectionKeyDown(e);
      }
    },
    [cardNavKeyDown, handleSectionKeyDown],
  );

  const handleDrawerKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLDivElement>) => {
      if (!isMobileNavOpen) return;
      if (e.key === "Escape") {
        e.preventDefault();
        closeMobileNav();
        return;
      }

      if (e.key !== "Tab") return;
      const drawer = mobileDrawerRef.current;
      if (!drawer) return;

      const focusable = Array.from(
        drawer.querySelectorAll<HTMLElement>(
          'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])',
        ),
      ).filter((el) => {
        if (el.hasAttribute("hidden")) return false;
        const styles = window.getComputedStyle(el);
        return styles.display !== "none" && styles.visibility !== "hidden";
      });

      if (focusable.length === 0) return;

      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      const active = document.activeElement as HTMLElement | null;

      if (!e.shiftKey && active === last) {
        e.preventDefault();
        first.focus();
      } else if (e.shiftKey && active === first) {
        e.preventDefault();
        last.focus();
      }
    },
    [closeMobileNav, isMobileNavOpen],
  );

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

  const overlayIsVisible = isMobile && isMobileNavOpen;
  const drawerTransition = prefersReducedMotion
    ? "none"
    : "transform 220ms cubic-bezier(0.2, 0.7, 0.2, 1)";
  const overlayTransition = prefersReducedMotion
    ? "none"
    : "opacity 180ms ease";

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
                        <li aria-hidden="true" style={{ color: "#9ca3af" }}>
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
