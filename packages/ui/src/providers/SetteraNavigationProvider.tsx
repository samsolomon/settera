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
}: SetteraNavigationProviderProps) {
  return (
    <SetteraNavigation>
      <SetteraNavigationProviderInner>
        {children}
      </SetteraNavigationProviderInner>
    </SetteraNavigation>
  );
}

function SetteraNavigationProviderInner({
  children,
}: {
  children: React.ReactNode;
}) {
  const schemaCtx = useContext(SetteraSchemaContext);
  const { activePage, setActivePage, subpage, openSubpage, closeSubpage } = useReactNavigation();

  if (!schemaCtx) {
    throw new Error(
      "SetteraNavigationProviderInner must be used within a Settera component.",
    );
  }
  const { schema } = schemaCtx;

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

  const { matchingSettingKeys, matchingPageKeys } = useMemo(() => {
    if (!searchQuery) {
      return { matchingSettingKeys: new Set<string>(), matchingPageKeys: new Set<string>() };
    }
    const { settingKeys, pageKeys } = searchSchema(schema, searchQuery);
    return { matchingSettingKeys: settingKeys, matchingPageKeys: pageKeys };
  }, [searchQuery, schema]);

  const navigationContext: SetteraNavigationContextValue = useMemo(
    () => ({
      activePage,
      setActivePage,
      expandedGroups,
      toggleGroup,
      searchQuery,
      setSearchQuery,
      matchingSettingKeys,
      matchingPageKeys,
      highlightedSettingKey,
      setHighlightedSettingKey,
      requestFocusContent,
      registerFocusContentHandler,
      subpage,
      openSubpage,
      closeSubpage,
    }),
    [
      activePage,
      setActivePage,
      expandedGroups,
      toggleGroup,
      searchQuery,
      setSearchQuery,
      matchingSettingKeys,
      matchingPageKeys,
      highlightedSettingKey,
      requestFocusContent,
      registerFocusContentHandler,
      subpage,
      openSubpage,
      closeSubpage,
    ],
  );

  return (
    <SetteraNavigationContext.Provider value={navigationContext}>
      {children}
    </SetteraNavigationContext.Provider>
  );
}
