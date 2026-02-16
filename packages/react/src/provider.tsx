import React, { useMemo, useState, useCallback, useEffect } from "react";
import {
  validateSchema,
  flattenSettings,
  getSettingByKey,
  getPageByKey,
  resolveDependencies,
  resolvePageKey,
} from "@settara/schema";
import type { SettaraSchema } from "@settara/schema";
import { SettaraSchemaContext, SettaraNavigationContext } from "./context.js";
import type {
  SettaraSchemaContextValue,
  SettaraNavigationContextValue,
} from "./context.js";

export interface SettaraProviderProps {
  schema: SettaraSchema;
  children: React.ReactNode;
}

export function SettaraProvider({ schema, children }: SettaraProviderProps) {
  // Validate schema on mount (warn, don't throw)
  useEffect(() => {
    const errors = validateSchema(schema);
    if (errors.length > 0) {
      for (const error of errors) {
        console.warn(
          `[settara] Schema validation: ${error.code} at ${error.path} — ${error.message}`,
        );
      }
    }
  }, [schema]);

  // Memoize schema context (stable after mount)
  const schemaContext: SettaraSchemaContextValue = useMemo(
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

  // Search state
  const [searchQuery, setSearchQuery] = useState("");

  const { matchingSettingKeys, matchingPageKeys } = useMemo(() => {
    const settingKeys = new Set<string>();
    const pageKeys = new Set<string>();

    if (!searchQuery) {
      return { matchingSettingKeys: settingKeys, matchingPageKeys: pageKeys };
    }

    const q = searchQuery.toLowerCase();

    // Walk pages for page/section title matches
    const walkPages = (pages: typeof schema.pages) => {
      for (const page of pages) {
        const pageMatches = page.title.toLowerCase().includes(q);

        if (pageMatches) {
          // Page title matches — include all settings on this page
          pageKeys.add(page.key);
          for (const section of page.sections ?? []) {
            for (const setting of section.settings ?? []) {
              settingKeys.add(setting.key);
            }
            for (const sub of section.subsections ?? []) {
              for (const setting of sub.settings) {
                settingKeys.add(setting.key);
              }
            }
          }
        } else {
          // Check section titles and individual settings
          let pageHasMatch = false;

          for (const section of page.sections ?? []) {
            const sectionMatches = section.title.toLowerCase().includes(q);

            if (sectionMatches) {
              // Section title matches — include all settings in this section
              pageHasMatch = true;
              for (const setting of section.settings ?? []) {
                settingKeys.add(setting.key);
              }
              for (const sub of section.subsections ?? []) {
                for (const setting of sub.settings) {
                  settingKeys.add(setting.key);
                }
              }
            } else {
              // Check individual settings
              for (const setting of section.settings ?? []) {
                const titleMatch = setting.title.toLowerCase().includes(q);
                const descMatch =
                  setting.description?.toLowerCase().includes(q) ?? false;
                if (titleMatch || descMatch) {
                  settingKeys.add(setting.key);
                  pageHasMatch = true;
                }
              }
              for (const sub of section.subsections ?? []) {
                const subMatches = sub.title.toLowerCase().includes(q);
                if (subMatches) {
                  pageHasMatch = true;
                  for (const setting of sub.settings) {
                    settingKeys.add(setting.key);
                  }
                } else {
                  for (const setting of sub.settings) {
                    const titleMatch = setting.title.toLowerCase().includes(q);
                    const descMatch =
                      setting.description?.toLowerCase().includes(q) ?? false;
                    if (titleMatch || descMatch) {
                      settingKeys.add(setting.key);
                      pageHasMatch = true;
                    }
                  }
                }
              }
            }
          }

          if (pageHasMatch) {
            pageKeys.add(page.key);
          }
        }

        // Recurse into child pages
        if (page.pages) {
          walkPages(page.pages);
          // If any child matched, include the parent in matchingPageKeys
          for (const child of page.pages) {
            if (pageKeys.has(child.key)) {
              pageKeys.add(page.key);
            }
          }
        }
      }
    };

    walkPages(schema.pages);

    return { matchingSettingKeys: settingKeys, matchingPageKeys: pageKeys };
  }, [searchQuery, schema]);

  const navigationContext: SettaraNavigationContextValue = useMemo(
    () => ({
      activePage,
      setActivePage,
      expandedGroups,
      toggleGroup,
      searchQuery,
      setSearchQuery,
      matchingSettingKeys,
      matchingPageKeys,
    }),
    [
      activePage,
      expandedGroups,
      toggleGroup,
      searchQuery,
      matchingSettingKeys,
      matchingPageKeys,
    ],
  );

  return (
    <SettaraSchemaContext.Provider value={schemaContext}>
      <SettaraNavigationContext.Provider value={navigationContext}>
        {children}
      </SettaraNavigationContext.Provider>
    </SettaraSchemaContext.Provider>
  );
}
