import { useContext } from "react";
import { SetteraNavigationContext } from "../contexts/SetteraNavigationContext.js";

const EMPTY_SET = new Set<string>();
const isProduction = () =>
  (globalThis as { process?: { env?: { NODE_ENV?: string } } }).process?.env
    ?.NODE_ENV === "production";

/**
 * Access search state and matching results.
 *
 * When used inside a SetteraNavigationProvider (or SetteraLayout),
 * returns live search state. When no provider is present,
 * returns safe defaults (empty query, not searching, empty sets).
 */
export function useSetteraSearch() {
  const ctx = useContext(SetteraNavigationContext);

  if (!ctx) {
    if (!isProduction()) {
      throw new Error(
        "useSetteraSearch must be used within a SetteraNavigationProvider.",
      );
    }
    return {
      query: "",
      setQuery: (() => {}) as (query: string) => void,
      matchingSettingKeys: EMPTY_SET,
      matchingPageKeys: EMPTY_SET,
      isSearching: false,
    };
  }

  return {
    query: ctx.searchQuery,
    setQuery: ctx.setSearchQuery,
    matchingSettingKeys: ctx.matchingSettingKeys,
    matchingPageKeys: ctx.matchingPageKeys,
    isSearching: ctx.searchQuery.length > 0,
  };
}
