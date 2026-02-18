import { useContext } from "react";
import { SetteraNavigationContext } from "../contexts/SetteraNavigationContext.js";

const EMPTY_SET = new Set<string>();
const NOOP = () => {};
const NOOP_UNREGISTER = () => () => {};

/**
 * Access sidebar navigation state and controls.
 *
 * When used inside a SetteraNavigationProvider (or SetteraLayout),
 * returns live navigation state. When no provider is present,
 * returns safe defaults (empty page, no search, noop functions).
 */
export function useSetteraNavigation() {
  const ctx = useContext(SetteraNavigationContext);

  if (!ctx) {
    return {
      activePage: "",
      setActivePage: NOOP as (key: string) => void,
      expandedGroups: EMPTY_SET,
      toggleGroup: NOOP as (key: string) => void,
      searchQuery: "",
      setSearchQuery: NOOP as (query: string) => void,
      matchingSettingKeys: EMPTY_SET,
      matchingPageKeys: EMPTY_SET,
      highlightedSettingKey: null as string | null,
      setHighlightedSettingKey: NOOP as (key: string | null) => void,
      requestFocusContent: NOOP,
      registerFocusContentHandler: NOOP_UNREGISTER as (handler: () => void) => () => void,
    };
  }

  return {
    activePage: ctx.activePage,
    setActivePage: ctx.setActivePage,
    expandedGroups: ctx.expandedGroups,
    toggleGroup: ctx.toggleGroup,
    searchQuery: ctx.searchQuery,
    setSearchQuery: ctx.setSearchQuery,
    matchingSettingKeys: ctx.matchingSettingKeys,
    matchingPageKeys: ctx.matchingPageKeys,
    highlightedSettingKey: ctx.highlightedSettingKey,
    setHighlightedSettingKey: ctx.setHighlightedSettingKey,
    requestFocusContent: ctx.requestFocusContent,
    registerFocusContentHandler: ctx.registerFocusContentHandler,
  };
}
