import React, {
  useMemo,
  useState,
  useCallback,
  useEffect,
  useRef,
} from "react";
import {
  validateSchema,
  flattenSettings,
  getSettingByKey,
  getPageByKey,
  resolveDependencies,
  resolvePageKey,
  walkSchema,
} from "@settera/schema";
import type { SetteraSchema } from "@settera/schema";
import { SetteraSchemaContext, SetteraNavigationContext } from "./context.js";
import type {
  SetteraSchemaContextValue,
  SetteraNavigationContextValue,
} from "./context.js";

export interface SetteraProviderProps {
  schema: SetteraSchema;
  children: React.ReactNode;
}

export function SetteraProvider({ schema, children }: SetteraProviderProps) {
  // Validate schema on mount (warn, don't throw)
  useEffect(() => {
    const errors = validateSchema(schema);
    if (errors.length > 0) {
      for (const error of errors) {
        console.warn(
          `[settera] Schema validation: ${error.code} at ${error.path} — ${error.message}`,
        );
      }
    }
  }, [schema]);

  // Memoize schema context (stable after mount)
  const schemaContext: SetteraSchemaContextValue = useMemo(
    () => ({
      schema,
      flatSettings: flattenSettings(schema),
      getSettingByKey: (key: string) => getSettingByKey(schema, key),
      getPageByKey: (key: string) => getPageByKey(schema, key),
      dependencies: resolveDependencies(schema),
    }),
    [schema],
  );

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

    // Track which pages/sections matched by title so we can bulk-include their settings
    const matchedPages = new Set<string>();
    const matchedSections = new Set<string>();
    // Pre-collect setting keys from matching subsections (checked in onSection)
    const subsectionMatchedSettings = new Set<string>();
    // Build child→parent map for page propagation
    const parentMap = new Map<string, string>();

    walkSchema(schema, {
      onPage(page) {
        // Record parent→child relationships for propagation
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
        // Check subsection titles and pre-collect their setting keys
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
    <SetteraSchemaContext.Provider value={schemaContext}>
      <SetteraNavigationContext.Provider value={navigationContext}>
        {children}
      </SetteraNavigationContext.Provider>
    </SetteraSchemaContext.Provider>
  );
}
