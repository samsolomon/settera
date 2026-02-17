import { useContext } from "react";
import { SetteraNavigationContext } from "../context.js";

/**
 * Access sidebar navigation state and controls.
 * Must be used within a SetteraProvider.
 */
export function useSetteraNavigation() {
  const ctx = useContext(SetteraNavigationContext);

  if (!ctx) {
    throw new Error(
      "useSetteraNavigation must be used within a SetteraProvider.",
    );
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
