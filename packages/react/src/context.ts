import { createContext } from "react";
import type {
  SetteraSchema,
  SettingDefinition,
  FlattenedSetting,
  PageDefinition,
  ConfirmConfig,
} from "@settera/schema";
import type { SetteraValuesStore } from "./store.js";

// ---- Schema Context (never re-renders after mount) ----

export interface SetteraSchemaContextValue {
  schema: SetteraSchema;
  flatSettings: FlattenedSetting[];
  getSettingByKey: (key: string) => SettingDefinition | undefined;
  getPageByKey: (key: string) => PageDefinition | undefined;
  dependencies: Map<string, string[]>;
}

export const SetteraSchemaContext =
  createContext<SetteraSchemaContextValue | null>(null);

// ---- Navigation Context (re-renders on page change) ----

export interface SetteraNavigationContextValue {
  activePage: string;
  setActivePage: (key: string) => void;
  expandedGroups: Set<string>;
  toggleGroup: (key: string) => void;
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  matchingSettingKeys: Set<string>;
  matchingPageKeys: Set<string>;
  highlightedSettingKey: string | null;
  setHighlightedSettingKey: (key: string | null) => void;
  requestFocusContent: () => void;
  registerFocusContentHandler: (handler: () => void) => () => void;
}

export const SetteraNavigationContext =
  createContext<SetteraNavigationContextValue | null>(null);

// ---- Values Context (now holds a stable store reference) ----

export type SaveStatus = "idle" | "saving" | "saved" | "error";

export interface PendingConfirm {
  key: string;
  config: ConfirmConfig;
  dangerous: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

export const SetteraValuesContext =
  createContext<SetteraValuesStore | null>(null);
