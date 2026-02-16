import { useContext } from "react";
import { SettaraNavigationContext } from "../context.js";

/**
 * Access search state and matching results.
 * Must be used within a SettaraProvider.
 */
export function useSettaraSearch() {
  const ctx = useContext(SettaraNavigationContext);

  if (!ctx) {
    throw new Error("useSettaraSearch must be used within a SettaraProvider.");
  }

  return {
    query: ctx.searchQuery,
    setQuery: ctx.setSearchQuery,
    matchingSettingKeys: ctx.matchingSettingKeys,
    matchingPageKeys: ctx.matchingPageKeys,
    isSearching: ctx.searchQuery.length > 0,
  };
}
