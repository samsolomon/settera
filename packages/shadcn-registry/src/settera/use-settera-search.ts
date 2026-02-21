import { useContext } from "react";
import { SetteraSearchContext } from "./settera-navigation-provider";

const EMPTY_SET = new Set<string>();
const EMPTY_MAP = new Map<string, Set<string>>();

export function useSetteraSearch() {
  const ctx = useContext(SetteraSearchContext);

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
      matchingSectionsByPage: EMPTY_MAP,
      isSearching: false,
    };
  }

  return {
    query: ctx.searchQuery,
    setQuery: ctx.setSearchQuery,
    matchingSettingKeys: ctx.matchingSettingKeys,
    matchingPageKeys: ctx.matchingPageKeys,
    matchingSectionsByPage: ctx.matchingSectionsByPage,
    isSearching: ctx.searchQuery.length > 0,
  };
}
