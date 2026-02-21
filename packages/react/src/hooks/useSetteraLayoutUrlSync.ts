import { useEffect, useMemo, useRef } from "react";
import type { SetteraSchemaContextValue } from "../context.js";
import type { SubpageState } from "../navigation.js";
import type { PageItem } from "@settera/schema";
import { flattenPageItems } from "@settera/schema";

export interface SetteraDeepLinkContextValue {
  getSettingUrl: (settingKey: string) => string;
  getSectionUrl: (pageKey: string, sectionKey: string) => string;
}

export function collectPageKeys(
  items: PageItem[],
  acc = new Set<string>(),
): Set<string> {
  const pages = flattenPageItems(items);
  for (const page of pages) {
    acc.add(page.key);
    if (page.pages && page.pages.length > 0) {
      collectPageKeys(page.pages, acc);
    }
  }
  return acc;
}

export interface UseSetteraLayoutUrlSyncOptions {
  schemaCtx: SetteraSchemaContextValue | null;
  activePage: string;
  setActivePage: (key: string) => void;
  activeSection: string | null;
  setActiveSection: (key: string | null) => void;
  syncActivePageWithUrl: boolean;
  activePageQueryParam: string;
  activeSectionQueryParam: string;
  activeSettingQueryParam: string;
  scrollToSetting: (key: string) => void;
  setPendingScrollKey: (key: string | null) => void;
  subpage: SubpageState | null;
  openSubpage: (settingKey: string) => void;
}

const SUBPAGE_QUERY_PARAM = "subpage";

/** @internal SetteraLayout implementation detail; not part of public API. */
export function useSetteraLayoutUrlSync({
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
}: UseSetteraLayoutUrlSyncOptions) {
  const didInitUrlSyncRef = useRef(false);
  const initialSettingKeyRef = useRef<string | null | undefined>(undefined);

  const validPageKeys = useMemo(() => {
    if (!schemaCtx) return new Set<string>();
    return collectPageKeys(schemaCtx.schema.pages);
  }, [schemaCtx]);

  // Capture the initial setting key from the URL during render (before effects)
  // so it survives React StrictMode's effect double-fire.
  if (
    initialSettingKeyRef.current === undefined &&
    syncActivePageWithUrl &&
    typeof window !== "undefined"
  ) {
    initialSettingKeyRef.current =
      new URL(window.location.href).searchParams.get(activeSettingQueryParam) ??
      null;
  }

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (!syncActivePageWithUrl || !validPageKeys.has(activePage)) return;
    if (!didInitUrlSyncRef.current) return;

    const url = new URL(window.location.href);
    const fromUrl = url.searchParams.get(activePageQueryParam);
    const sectionFromUrl = url.searchParams.get(activeSectionQueryParam);
    let changed = false;
    const pageChanged = fromUrl !== activePage;

    if (pageChanged) {
      url.searchParams.set(activePageQueryParam, activePage);
      // Clear stale setting param when page changes via navigation
      url.searchParams.delete(activeSettingQueryParam);
      changed = true;
    }

    if (activeSection) {
      if (sectionFromUrl !== activeSection) {
        url.searchParams.set(activeSectionQueryParam, activeSection);
        changed = true;
      }
    } else if (sectionFromUrl) {
      url.searchParams.delete(activeSectionQueryParam);
      changed = true;
    }

    if (!changed) return;
    const sectionChangedWithoutPageChange =
      !pageChanged && sectionFromUrl !== activeSection;
    if (sectionChangedWithoutPageChange) {
      window.history.pushState(window.history.state, "", url);
    } else {
      window.history.replaceState(window.history.state, "", url);
    }
  }, [
    activePage,
    activeSection,
    activePageQueryParam,
    activeSectionQueryParam,
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
      const sectionKey = url.searchParams.get(activeSectionQueryParam);
      if (pageKey && validPageKeys.has(pageKey) && pageKey !== activePage) {
        setActivePage(pageKey);
      }
      if (sectionKey !== activeSection) {
        setActiveSection(sectionKey);
      }
    };

    readFromUrl();
    didInitUrlSyncRef.current = true;
    window.addEventListener("popstate", readFromUrl);
    return () => window.removeEventListener("popstate", readFromUrl);
  }, [
    activePage,
    activeSection,
    activePageQueryParam,
    activeSectionQueryParam,
    setActivePage,
    setActiveSection,
    syncActivePageWithUrl,
    validPageKeys,
  ]);

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
        setPendingScrollKey(settingKey);
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
    setPendingScrollKey,
  ]);

  // --- Subpage URL sync ---

  const initialSubpageKeyRef = useRef<string | null | undefined>(undefined);

  // Capture the initial subpage key from URL during render
  if (
    initialSubpageKeyRef.current === undefined &&
    syncActivePageWithUrl &&
    typeof window !== "undefined"
  ) {
    initialSubpageKeyRef.current =
      new URL(window.location.href).searchParams.get(SUBPAGE_QUERY_PARAM) ??
      null;
  }

  // Write subpage state to URL
  useEffect(() => {
    if (typeof window === "undefined") return;
    if (!syncActivePageWithUrl) return;
    if (!didInitUrlSyncRef.current) return;

    const url = new URL(window.location.href);
    const currentParam = url.searchParams.get(SUBPAGE_QUERY_PARAM);

    if (subpage) {
      if (currentParam !== subpage.settingKey) {
        url.searchParams.set(SUBPAGE_QUERY_PARAM, subpage.settingKey);
        window.history.replaceState(window.history.state, "", url);
      }
    } else {
      if (currentParam) {
        url.searchParams.delete(SUBPAGE_QUERY_PARAM);
        window.history.replaceState(window.history.state, "", url);
      }
    }
  }, [subpage, syncActivePageWithUrl]);

  // Read subpage from URL on mount
  useEffect(() => {
    if (typeof window === "undefined") return;
    if (!syncActivePageWithUrl || !schemaCtx) return;

    const subpageKey = initialSubpageKeyRef.current;
    if (subpageKey !== undefined && subpageKey !== null) {
      initialSubpageKeyRef.current = undefined;
      // Verify the setting exists before opening the subpage
      const setting = schemaCtx.getSettingByKey(subpageKey);
      if (setting) {
        openSubpage(subpageKey);
      }
    }
  }, [syncActivePageWithUrl, schemaCtx, openSubpage]);

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
        getSectionUrl: (pageKey: string, sectionKey: string) => {
          const url = new URL(window.location.href);
          url.searchParams.set(activePageQueryParam, pageKey);
          url.searchParams.set(activeSectionQueryParam, sectionKey);
          url.searchParams.delete(activeSettingQueryParam);
          return url.toString();
        },
      };
    }, [
      syncActivePageWithUrl,
      schemaCtx,
      activePageQueryParam,
      activeSectionQueryParam,
      activeSettingQueryParam,
    ]);

  return {
    deepLinkContextValue,
    validPageKeys,
  };
}
