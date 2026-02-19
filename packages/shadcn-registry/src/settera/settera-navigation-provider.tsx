"use client";

import React, {
  createContext,
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
import type { SubpageState } from "@settera/react";
import { searchSchema } from "@settera/schema";

export interface SetteraNavigationContextValue {
  activePage: string;
  setActivePage: (key: string) => void;
  expandedGroups: Set<string>;
  toggleGroup: (key: string) => void;
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  matchingSettingKeys: Set<string>;
  matchingPageKeys: Set<string>;
  highlightedSettingKey: string | null;
  setHighlightedSettingKey: (key: string | null) => void;
  requestFocusContent: () => void;
  registerFocusContentHandler: (handler: () => void) => () => void;
  subpage: SubpageState | null;
  openSubpage: (settingKey: string) => void;
  closeSubpage: () => void;
}

export const SetteraNavigationContext =
  createContext<SetteraNavigationContextValue | null>(null);

export interface SetteraNavigationProviderProps {
  children: React.ReactNode;
}

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
      "SetteraNavigationProvider must be used within a Settera component.",
    );
  }
  const { schema } = schemaCtx;

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

  const [highlightedSettingKey, setHighlightedSettingKey] = useState<
    string | null
  >(null);

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
      setHighlightedSettingKey,
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
