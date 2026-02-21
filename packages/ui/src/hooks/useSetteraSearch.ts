import { useContext } from "react";
import { SetteraNavigationContext } from "../contexts/SetteraNavigationContext.js";

/**
 * Access search state and matching results.
 *
 * Must be used inside a SetteraNavigationProvider (or SetteraLayout).
 */
export function useSetteraSearch() {
  const ctx = useContext(SetteraNavigationContext);

  if (!ctx) {
    throw new Error(
      "useSetteraSearch must be used within a SetteraNavigationProvider.",
    );
  }

  return {
    query: ctx.searchQuery,
    setQuery: ctx.setSearchQuery,
    matchingSettingKeys: ctx.matchingSettingKeys,
    matchingPageKeys: ctx.matchingPageKeys,
    isSearching: ctx.searchQuery.length > 0,
  };
}
