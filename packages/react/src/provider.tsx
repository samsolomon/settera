import React, { useMemo, useState, useCallback, useEffect } from "react";
import {
  validateSchema,
  flattenSettings,
  getSettingByKey,
  getPageByKey,
  resolveDependencies,
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
    schema.pages[0]?.key ?? "",
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

  const navigationContext: SettaraNavigationContextValue = useMemo(
    () => ({
      activePage,
      setActivePage,
      expandedGroups,
      toggleGroup,
    }),
    [activePage, expandedGroups, toggleGroup],
  );

  return (
    <SettaraSchemaContext.Provider value={schemaContext}>
      <SettaraNavigationContext.Provider value={navigationContext}>
        {children}
      </SettaraNavigationContext.Provider>
    </SettaraSchemaContext.Provider>
  );
}
