import { createContext } from "react";
import type {
  SettaraSchema,
  SettingDefinition,
  FlattenedSetting,
  PageDefinition,
  ConfirmConfig,
} from "@settara/schema";

// ---- Schema Context (never re-renders after mount) ----

export interface SettaraSchemaContextValue {
  schema: SettaraSchema;
  flatSettings: FlattenedSetting[];
  getSettingByKey: (key: string) => SettingDefinition | undefined;
  getPageByKey: (key: string) => PageDefinition | undefined;
  dependencies: Map<string, string[]>;
}

export const SettaraSchemaContext =
  createContext<SettaraSchemaContextValue | null>(null);

// ---- Navigation Context (re-renders on page change) ----

export interface SettaraNavigationContextValue {
  activePage: string;
  setActivePage: (key: string) => void;
  expandedGroups: Set<string>;
  toggleGroup: (key: string) => void;
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  matchingSettingKeys: Set<string>;
  matchingPageKeys: Set<string>;
}

export const SettaraNavigationContext =
  createContext<SettaraNavigationContextValue | null>(null);

// ---- Values Context (re-renders on setting change) ----

export interface PendingConfirm {
  key: string;
  config: ConfirmConfig;
  dangerous: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

export interface SettaraValuesContextValue {
  values: Record<string, unknown>;
  setValue: (key: string, value: unknown) => void;
  errors: Record<string, string>;
  setError: (key: string, error: string | null) => void;
  onValidate?: Record<
    string,
    (value: unknown) => string | null | Promise<string | null>
  >;
  onAction?: Record<string, () => void | Promise<void>>;
  pendingConfirm: PendingConfirm | null;
  requestConfirm: (pending: PendingConfirm) => void;
  resolveConfirm: (confirmed: boolean) => void;
}

export const SettaraValuesContext =
  createContext<SettaraValuesContextValue | null>(null);
