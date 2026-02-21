import React, {
  useMemo,
  useState,
  useCallback,
  useRef,
  useContext,
} from "react";
import {
  SetteraNavigation,
  useSetteraNavigation as useReactNavigation,
  SetteraSchemaContext,
} from "@settera/react";
import { searchSchema } from "@settera/schema";
import { SetteraNavigationContext } from "../contexts/SetteraNavigationContext.js";
import type { SetteraNavigationContextValue } from "../contexts/SetteraNavigationContext.js";

export interface SetteraNavigationProviderProps {
  children: React.ReactNode;
  /** Controlled active page key from the consumer's router. */
  activePage?: string;
  /** Called when the user navigates to a different page. */
  onPageChange?: (key: string) => void;
  /** Returns path for a page key; enables `<a href>` in sidebar and path-based deep links. */
  getPageUrl?: (pageKey: string) => string;
}

/**
 * Provides navigation state (active page, expanded groups, search, highlight)
 * for the settings UI. Must be nested inside a Settera component (needs schema context).
 *
 * Composes with SetteraNavigation from @settera/react for activePage/setActivePage,
 * adding UI-specific state (search, expanded groups, highlight, focus).
 */
export function SetteraNavigationProvider({
  children,
  activePage,
  onPageChange,
  getPageUrl,
}: SetteraNavigationProviderProps) {
  const hasWarnedGetPageUrlRef = useRef(false);
  if (process.env.NODE_ENV !== "production") {
    if (getPageUrl && activePage === undefined && !hasWarnedGetPageUrlRef.current) {
      hasWarnedGetPageUrlRef.current = true;
      console.warn(
        "SetteraNavigationProvider: `getPageUrl` was provided without `activePage`. " +
        "Page-level URL sync will be skipped but navigation is uncontrolled. " +
        "Provide `activePage` and `onPageChange` for router integration.",
      );
    }
  }

  return (
    <SetteraNavigation activePage={activePage} onPageChange={onPageChange}>
      <SetteraNavigationProviderInner getPageUrl={getPageUrl}>
        {children}
      </SetteraNavigationProviderInner>
    </SetteraNavigation>
  );
}

function SetteraNavigationProviderInner({
  children,
  getPageUrl,
}: {
  children: React.ReactNode;
  getPageUrl?: (pageKey: string) => string;
}) {
  const schemaCtx = useContext(SetteraSchemaContext);
  const { activePage, setActivePage: setActivePageRaw, subpage, openSubpage, closeSubpage } = useReactNavigation();

  if (!schemaCtx) {
    throw new Error(
      "SetteraNavigationProviderInner must be used within a Settera component.",
    );
  }
  const { schema } = schemaCtx;
  const [activeSection, setActiveSection] = useState<string | null>(null);

  const setActivePage = useCallback(
    (key: string) => {
      setActiveSection(null);
      setActivePageRaw(key);
    },
    [setActivePageRaw],
  );

  // UI-specific state
  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(
    () => new Set(),
  );

  const toggleGroup = useCallback((key: string) => {
    setExpandedGroups((prev) => {
      const next = new Set(prev);
      if (next.has(key)) {
        next.delete(key);
      } else {
        next.add(key);
      }
      return next;
    });
  }, []);

  // Focus-content signal (ref-based to avoid re-rendering all nav consumers)
  const focusHandlerRef = useRef<(() => void) | null>(null);
  const requestFocusContent = useCallback(() => {
    focusHandlerRef.current?.();
  }, []);
  const registerFocusContentHandler = useCallback(
    (handler: () => void) => {
      focusHandlerRef.current = handler;
      return () => {
        focusHandlerRef.current = null;
      };
    },
    [],
  );

  // Highlighted setting (deep-link)
  const [highlightedSettingKey, setHighlightedSettingKey] = useState<
    string | null
  >(null);

  // Search state — close subpage when search activates
  const [searchQuery, setSearchQueryRaw] = useState("");
  const setSearchQuery = useCallback((query: string) => {
    setSearchQueryRaw(query);
    if (query.length > 0) {
      closeSubpage();
    }
  }, [closeSubpage]);

  const { matchingSettingKeys, matchingPageKeys, matchingSectionsByPage } =
    useMemo(() => {
    if (!searchQuery) {
      return {
        matchingSettingKeys: new Set<string>(),
        matchingPageKeys: new Set<string>(),
        matchingSectionsByPage: new Map<string, Set<string>>(),
      };
    }
    const { settingKeys, pageKeys } = searchSchema(schema, searchQuery);
    const sectionMatches = new Map<string, Set<string>>();
    for (const flat of schemaCtx.flatSettings) {
      if (!settingKeys.has(flat.definition.key) || !flat.sectionKey) continue;
      const pageMatches = sectionMatches.get(flat.pageKey);
      if (pageMatches) {
        pageMatches.add(flat.sectionKey);
        continue;
      }
      sectionMatches.set(flat.pageKey, new Set([flat.sectionKey]));
    }

    return {
      matchingSettingKeys: settingKeys,
      matchingPageKeys: pageKeys,
      matchingSectionsByPage: sectionMatches,
    };
  }, [searchQuery, schema, schemaCtx.flatSettings]);

  const navigationContext: SetteraNavigationContextValue = useMemo(
    () => ({
      activePage,
      setActivePage,
      activeSection,
      setActiveSection,
      expandedGroups,
      toggleGroup,
      searchQuery,
      setSearchQuery,
      matchingSettingKeys,
      matchingPageKeys,
      matchingSectionsByPage,
      highlightedSettingKey,
      setHighlightedSettingKey,
      requestFocusContent,
      registerFocusContentHandler,
      subpage,
      openSubpage,
      closeSubpage,
      getPageUrl,
    }),
    [
      activePage,
      setActivePage,
      activeSection,
      expandedGroups,
      toggleGroup,
      searchQuery,
      setSearchQuery,
      matchingSettingKeys,
      matchingPageKeys,
      matchingSectionsByPage,
      highlightedSettingKey,
      requestFocusContent,
      registerFocusContentHandler,
      subpage,
      openSubpage,
      closeSubpage,
      setActiveSection,
      getPageUrl,
    ],
  );

  return (
    <SetteraNavigationContext.Provider value={navigationContext}>
      {children}
    </SetteraNavigationContext.Provider>
  );
}
