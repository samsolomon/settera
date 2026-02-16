import { useContext } from "react";
import { SettaraNavigationContext } from "../context.js";

/**
 * Access sidebar navigation state and controls.
 * Must be used within a SettaraProvider.
 */
export function useSettaraNavigation() {
  const ctx = useContext(SettaraNavigationContext);

  if (!ctx) {
    throw new Error(
      "useSettaraNavigation must be used within a SettaraProvider.",
    );
  }

  return {
    activePage: ctx.activePage,
    setActivePage: ctx.setActivePage,
    expandedGroups: ctx.expandedGroups,
    toggleGroup: ctx.toggleGroup,
  };
}
