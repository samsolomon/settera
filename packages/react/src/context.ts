import { createContext } from "react";
import type {
  SetteraSchema,
  SettingDefinition,
  FlattenedSetting,
  PageDefinition,
  SectionDefinition,
  ConfirmConfig,
} from "@settera/schema";
import type { SetteraValuesStore } from "./stores/index.js";

// ---- Schema Context (never re-renders after mount) ----

export interface SetteraSchemaContextValue {
  schema: SetteraSchema;
  flatSettings: FlattenedSetting[];
  getSettingByKey: (key: string) => SettingDefinition | undefined;
  getPageByKey: (key: string) => PageDefinition | undefined;
  settingIndex: Map<string, FlattenedSetting>;
  sectionIndex: Map<string, SectionDefinition>;
}

export const SetteraSchemaContext =
  createContext<SetteraSchemaContextValue | null>(null);

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
