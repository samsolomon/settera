import { useEffect, useMemo, useRef } from "react";
import type { SetteraSchemaContextValue } from "@settera/react";
import type { PageDefinition } from "@settera/schema";
import type { SetteraDeepLinkContextValue } from "../contexts/SetteraDeepLinkContext.js";

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

export interface UseSetteraLayoutUrlSyncOptions {
  schemaCtx: SetteraSchemaContextValue | null;
  activePage: string;
  setActivePage: (key: string) => void;
  syncActivePageWithUrl: boolean;
  activePageQueryParam: string;
  activeSettingQueryParam: string;
  scrollToSetting: (key: string) => void;
  setPendingScrollKey: (key: string | null) => void;
}

/** @internal SetteraLayout implementation detail; not part of public API. */
export function useSetteraLayoutUrlSync({
  schemaCtx,
  activePage,
  setActivePage,
  syncActivePageWithUrl,
  activePageQueryParam,
  activeSettingQueryParam,
  scrollToSetting,
  setPendingScrollKey,
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

  return {
    deepLinkContextValue,
    validPageKeys,
  };
}
