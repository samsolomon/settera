export const SCHEMA_VERSION = "1.0";

// Types
export type {
  SettaraSchema,
  PageDefinition,
  SectionDefinition,
  SubsectionDefinition,
  SettingDefinition,
  ValueSetting,
  BooleanSetting,
  TextSetting,
  NumberSetting,
  SelectSetting,
  MultiSelectSetting,
  DateSetting,
  CompoundSetting,
  ListSetting,
  ActionSetting,
  CustomSetting,
  ConfirmConfig,
  VisibilityCondition,
  SchemaValidationError,
  FlattenedSetting,
} from "./types.js";

// Validation
export { validateSchema } from "./validate.js";

// Traversal
export {
  flattenSettings,
  getSettingByKey,
  getPageByKey,
  resolveDependencies,
} from "./traversal.js";
