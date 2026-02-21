import { useContext } from "react";
import { SetteraNavigationContext } from "../contexts/SetteraNavigationContext.js";

/**
 * Access sidebar navigation state and controls.
 *
 * Must be used inside a SetteraNavigationProvider (or SetteraLayout).
 */
export function useSetteraNavigation() {
  const ctx = useContext(SetteraNavigationContext);

  if (!ctx) {
    throw new Error(
      "useSetteraNavigation must be used within a SetteraNavigationProvider.",
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
    subpage: ctx.subpage,
    openSubpage: ctx.openSubpage,
    closeSubpage: ctx.closeSubpage,
  };
}
