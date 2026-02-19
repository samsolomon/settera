import { useContext } from "react";
import { SetteraNavigationContext } from "./settera-navigation-provider";

const EMPTY_SET = new Set<string>();

export function useSetteraSearch() {
  const ctx = useContext(SetteraNavigationContext);

  if (!ctx) {
    if (process.env.NODE_ENV !== "production") {
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
