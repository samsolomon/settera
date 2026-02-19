import React, { createContext, useContext, useState, useMemo } from "react";
import { resolvePageKey } from "@settera/schema";
import type { PageDefinition } from "@settera/schema";
import { SetteraSchemaContext } from "./context.js";

// ---- Context ----

export interface SetteraNavigationContextValue {
  /** The key of the currently active page */
  activePage: string;
  /** Set the active page by key */
  setActivePage: (key: string) => void;
  /** The pages array from the schema */
  pages: PageDefinition[];
}

export const SetteraNavigationContext =
  createContext<SetteraNavigationContextValue | null>(null);

// ---- Provider ----

export interface SetteraNavigationProps {
  children: React.ReactNode;
}

/**
 * Provides headless navigation state (active page tracking).
 * Must be nested inside a Settera component (needs schema context).
 */
export function SetteraNavigation({ children }: SetteraNavigationProps) {
  const schemaCtx = useContext(SetteraSchemaContext);

  if (!schemaCtx) {
    throw new Error(
      "SetteraNavigation must be used within a Settera component.",
    );
  }

  const { schema } = schemaCtx;

  const [activePage, setActivePage] = useState<string>(
    schema.pages[0] ? resolvePageKey(schema.pages[0]) : "",
  );

  const value: SetteraNavigationContextValue = useMemo(
    () => ({
      activePage,
      setActivePage,
      pages: schema.pages,
    }),
    [activePage, schema.pages],
  );

  return (
    <SetteraNavigationContext.Provider value={value}>
      {children}
    </SetteraNavigationContext.Provider>
  );
}

// ---- Hook ----

/**
 * Access navigation state (activePage, setActivePage, pages).
 * Must be used within a SetteraNavigation component.
 */
export function useSetteraNavigation(): SetteraNavigationContextValue {
  const ctx = useContext(SetteraNavigationContext);
  if (!ctx) {
    throw new Error(
      "useSetteraNavigation must be used within a SetteraNavigation component.",
    );
  }
  return ctx;
}
