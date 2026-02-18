import { createContext } from "react";
import type {
  SetteraSchema,
  SettingDefinition,
  FlattenedSetting,
  PageDefinition,
  SectionDefinition,
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

export const SetteraValuesContext =
  createContext<SetteraValuesStore | null>(null);
