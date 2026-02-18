import React, {
  useMemo,
  useState,
  useCallback,
  useRef,
  useContext,
} from "react";
import { SetteraSchemaContext } from "@settera/react";
import { resolvePageKey, walkSchema } from "@settera/schema";
import { SetteraNavigationContext } from "../contexts/SetteraNavigationContext.js";
import type { SetteraNavigationContextValue } from "../contexts/SetteraNavigationContext.js";

export interface SetteraNavigationProviderProps {
  children: React.ReactNode;
}

/**
 * Provides navigation state (active page, expanded groups, search, highlight)
 * for the settings UI. Must be nested inside a Settera component (needs schema context).
 */
export function SetteraNavigationProvider({
  children,
}: SetteraNavigationProviderProps) {
  const schemaCtx = useContext(SetteraSchemaContext);

  if (!schemaCtx) {
    throw new Error(
      "SetteraNavigationProvider must be used within a Settera component.",
    );
  }

  const { schema } = schemaCtx;

  // Navigation state
  const [activePage, setActivePage] = useState<string>(
    schema.pages[0] ? resolvePageKey(schema.pages[0]) : "",
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

  // Search state
  const [searchQuery, setSearchQuery] = useState("");

  const { matchingSettingKeys, matchingPageKeys } = useMemo(() => {
    const settingKeys = new Set<string>();
    const pageKeys = new Set<string>();

    if (!searchQuery) {
      return { matchingSettingKeys: settingKeys, matchingPageKeys: pageKeys };
    }

    const q = searchQuery.toLowerCase();

    const matchedPages = new Set<string>();
    const matchedSections = new Set<string>();
    const subsectionMatchedSettings = new Set<string>();
    const parentMap = new Map<string, string>();

    walkSchema(schema, {
      onPage(page) {
        if (page.pages) {
          for (const child of page.pages) {
            parentMap.set(child.key, page.key);
          }
        }
        if (page.title?.toLowerCase().includes(q)) {
          matchedPages.add(page.key);
          pageKeys.add(page.key);
        }
      },
      onSection(section, ctx) {
        if (section.title?.toLowerCase().includes(q)) {
          matchedSections.add(`${ctx.pageKey}:${section.key}`);
        }
        if (section.subsections) {
          for (const sub of section.subsections) {
            if (sub.title.toLowerCase().includes(q)) {
              for (const setting of sub.settings) {
                subsectionMatchedSettings.add(setting.key);
              }
            }
          }
        }
      },
      onSetting(setting, ctx) {
        const pageMatched = matchedPages.has(ctx.pageKey);
        const sectionMatched = matchedSections.has(
          `${ctx.pageKey}:${ctx.sectionKey}`,
        );
        const subMatched = subsectionMatchedSettings.has(setting.key);
        const titleMatch =
          setting.title?.toLowerCase().includes(q) ?? false;
        const descMatch =
          setting.description?.toLowerCase().includes(q) ?? false;

        if (pageMatched || sectionMatched || subMatched || titleMatch || descMatch) {
          settingKeys.add(setting.key);
          pageKeys.add(ctx.pageKey);
        }
      },
    });

    // Propagate: if a child page matched, include all ancestor pages
    for (const key of [...pageKeys]) {
      let current = key;
      while (parentMap.has(current)) {
        const parent = parentMap.get(current)!;
        pageKeys.add(parent);
        current = parent;
      }
    }

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
    }),
    [
      activePage,
      expandedGroups,
      toggleGroup,
      searchQuery,
      matchingSettingKeys,
      matchingPageKeys,
      highlightedSettingKey,
      requestFocusContent,
      registerFocusContentHandler,
    ],
  );

  return (
    <SetteraNavigationContext.Provider value={navigationContext}>
      {children}
    </SetteraNavigationContext.Provider>
  );
}
