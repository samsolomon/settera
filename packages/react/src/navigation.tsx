import React, { createContext, useContext, useState, useMemo, useCallback, useRef } from "react";
import { resolvePageKey, flattenPageItems } from "@settera/schema";
import type { PageItem } from "@settera/schema";
import { SetteraSchemaContext } from "./context.js";

// ---- Types ----

export interface SubpageState {
  /** Key of the setting that opened this subpage */
  settingKey: string;
  /** Page key to return to when closing */
  returnPage: string;
}

// ---- Context ----

export interface SetteraNavigationContextValue {
  /** The key of the currently active page */
  activePage: string;
  /** Set the active page by key */
  setActivePage: (key: string) => void;
  /** The pages array from the schema (may contain PageGroup items) */
  pages: PageItem[];
  /** Currently active subpage, or null if none */
  subpage: SubpageState | null;
  /** Open a subpage for the given setting key */
  openSubpage: (settingKey: string) => void;
  /** Close the active subpage */
  closeSubpage: () => void;
}

export const SetteraNavigationContext =
  createContext<SetteraNavigationContextValue | null>(null);

// ---- Provider ----

export interface SetteraNavigationProps {
  children: React.ReactNode;
  /** Controlled active page key from the consumer's router. When provided, internal state is bypassed. */
  activePage?: string;
  /** Called when the user navigates to a different page. Required when `activePage` is controlled. */
  onPageChange?: (key: string) => void;
}

/**
 * Provides headless navigation state (active page tracking).
 * Must be nested inside a Settera component (needs schema context).
 */
export function SetteraNavigation({
  children,
  activePage: controlledPage,
  onPageChange,
}: SetteraNavigationProps) {
  const schemaCtx = useContext(SetteraSchemaContext);

  if (!schemaCtx) {
    throw new Error(
      "SetteraNavigation must be used within a Settera component.",
    );
  }

  const { schema } = schemaCtx;
  const isControlled = controlledPage !== undefined;

  const hasWarnedRef = useRef(false);
  if (process.env.NODE_ENV !== "production") {
    if (isControlled && !onPageChange && !hasWarnedRef.current) {
      hasWarnedRef.current = true;
      console.warn(
        "SetteraNavigation: `activePage` was provided without `onPageChange`. " +
        "The active page will not change when the user clicks navigation.",
      );
    }
  }

  const [internalPage, setInternalPage] = useState<string>(() => {
    const firstPage = flattenPageItems(schema.pages)[0];
    return firstPage ? resolvePageKey(firstPage) : "";
  });

  const activePage = isControlled ? controlledPage : internalPage;

  const [subpage, setSubpage] = useState<SubpageState | null>(null);

  // Ref for openSubpage to read current page without deps
  const activePageRef = useRef(activePage);
  activePageRef.current = activePage;

  // When setActivePage is called, auto-close any open subpage
  const setActivePage = useCallback((key: string) => {
    setSubpage(null);
    if (isControlled) {
      onPageChange?.(key);
    } else {
      setInternalPage(key);
    }
  }, [isControlled, onPageChange]);

  const openSubpage = useCallback((settingKey: string) => {
    setSubpage({ settingKey, returnPage: activePageRef.current });
  }, []);

  const closeSubpage = useCallback(() => {
    setSubpage(null);
  }, []);

  const value: SetteraNavigationContextValue = useMemo(
    () => ({
      activePage,
      setActivePage,
      pages: schema.pages,
      subpage,
      openSubpage,
      closeSubpage,
    }),
    [activePage, setActivePage, schema.pages, subpage, openSubpage, closeSubpage],
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
