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

export interface SetteraSearchContextValue {
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  matchingSettingKeys: Set<string>;
  matchingPageKeys: Set<string>;
  matchingSectionsByPage: Map<string, Set<string>>;
}

export interface SetteraNavigationContextValue {
  activePage: string;
  setActivePage: (key: string) => void;
  activeSection: string | null;
  setActiveSection: (key: string | null) => void;
  expandedGroups: Set<string>;
  toggleGroup: (key: string) => void;
  highlightedSettingKey: string | null;
  setHighlightedSettingKey: (key: string | null) => void;
  requestFocusContent: () => void;
  registerFocusContentHandler: (handler: () => void) => () => void;
  subpage: SubpageState | null;
  openSubpage: (settingKey: string) => void;
  closeSubpage: () => void;
}

export const SetteraSearchContext =
  createContext<SetteraSearchContextValue | null>(null);

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
  const {
    activePage,
    setActivePage: setActivePageRaw,
    subpage,
    openSubpage,
    closeSubpage,
  } = useReactNavigation();

  if (!schemaCtx) {
    throw new Error(
      "SetteraNavigationProvider must be used within a Settera component.",
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

  // Use a ref so setSearchQuery can call closeSubpage without depending on the nav context
  const closeSubpageRef = useRef(closeSubpage);
  closeSubpageRef.current = closeSubpage;

  const [searchQuery, setSearchQueryRaw] = useState("");
  const setSearchQuery = useCallback((query: string) => {
    setSearchQueryRaw(query);
    if (query.length > 0) {
      closeSubpageRef.current();
    }
  }, []);

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
      activeSection,
      setActiveSection,
      expandedGroups,
      toggleGroup,
      highlightedSettingKey,
      setHighlightedSettingKey,
      requestFocusContent,
      registerFocusContentHandler,
      subpage,
      openSubpage,
      closeSubpage,
    ],
  );

  const searchContext: SetteraSearchContextValue = useMemo(
    () => ({
      searchQuery,
      setSearchQuery,
      matchingSettingKeys,
      matchingPageKeys,
      matchingSectionsByPage,
    }),
    [
      searchQuery,
      setSearchQuery,
      matchingSettingKeys,
      matchingPageKeys,
      matchingSectionsByPage,
    ],
  );

  return (
    <SetteraNavigationContext.Provider value={navigationContext}>
      <SetteraSearchContext.Provider value={searchContext}>
        {children}
      </SetteraSearchContext.Provider>
    </SetteraNavigationContext.Provider>
  );
}
