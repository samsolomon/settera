import { useContext } from "react";
import type { SubpageState } from "@settera/react";
import { SetteraNavigationContext } from "./settera-navigation-provider";

const EMPTY_SET = new Set<string>();
const NOOP = () => {};
const NOOP_UNREGISTER = () => () => {};

export function useSetteraNavigation() {
  const ctx = useContext(SetteraNavigationContext);

  if (!ctx) {
    if (process.env.NODE_ENV !== "production") {
      throw new Error(
        "useSetteraNavigation must be used within a SetteraNavigationProvider.",
      );
    }
    return {
      activePage: "",
      setActivePage: NOOP as (key: string) => void,
      activeSection: null as string | null,
      setActiveSection: NOOP as (key: string | null) => void,
      expandedGroups: EMPTY_SET,
      toggleGroup: NOOP as (key: string) => void,
      highlightedSettingKey: null as string | null,
      setHighlightedSettingKey: NOOP as (key: string | null) => void,
      requestFocusContent: NOOP,
      registerFocusContentHandler: NOOP_UNREGISTER as (handler: () => void) => () => void,
      subpage: null as SubpageState | null,
      openSubpage: NOOP as (settingKey: string) => void,
      closeSubpage: NOOP,
    };
  }

  return ctx;
}
