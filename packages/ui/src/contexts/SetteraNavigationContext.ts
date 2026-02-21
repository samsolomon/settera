import { createContext } from "react";
import type { SubpageState } from "@settera/react";

export interface SetteraNavigationContextValue {
  activePage: string;
  setActivePage: (key: string) => void;
  activeSection: string | null;
  setActiveSection: (key: string | null) => void;
  expandedGroups: Set<string>;
  toggleGroup: (key: string) => void;
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  matchingSettingKeys: Set<string>;
  matchingPageKeys: Set<string>;
  matchingSectionsByPage: Map<string, Set<string>>;
  highlightedSettingKey: string | null;
  setHighlightedSettingKey: (key: string | null) => void;
  requestFocusContent: () => void;
  registerFocusContentHandler: (handler: () => void) => () => void;
  subpage: SubpageState | null;
  openSubpage: (settingKey: string) => void;
  closeSubpage: () => void;
  /** Returns path for a page key; enables `<a href>` in sidebar and path-based deep links. */
  getPageUrl?: (pageKey: string) => string;
}

export const SetteraNavigationContext =
  createContext<SetteraNavigationContextValue | null>(null);
