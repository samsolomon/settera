export const SCHEMA_VERSION = "1.0";

// Types
export type {
  SetteraSchema,
  PageDefinition,
  PageGroup,
  PageItem,
  SectionDefinition,
  SubsectionDefinition,
  SettingDefinition,
  ValueSetting,
  BaseSettingFields,
  BaseValueSettingFields,
  BooleanSetting,
  TextSetting,
  NumberSetting,
  SelectSetting,
  MultiSelectSetting,
  DateSetting,
  CompoundSetting,
  CompoundFieldDefinition,
  RepeatableSetting,
  RepeatableFieldDefinition,
  ActionSetting,
  ActionItem,
  ActionModalConfig,
  ActionPageConfig,
  ModalActionFieldSetting,
  CustomSetting,
  SelectOption,
  ConfirmConfig,
  VisibilityCondition,
  VisibilityConditionGroup,
  VisibilityRule,
  VisibilityValue,
  SchemaValidationError,
  FlattenedSetting,
} from "./types.js";

// Schema validation
export { validateSchema } from "./validate.js";

// Value validation (per-setting runtime validation)
export { validateSettingValue, validateConfirmText } from "./value-validation.js";

// Visibility
export { evaluateVisibility } from "./visibility.js";

// Traversal
export {
  isPageGroup,
  flattenPageItems,
  walkSchema,
  flattenSettings,
  getSettingByKey,
  getPageByKey,
  isFlattenedPage,
  resolvePageKey,
  buildSettingIndex,
  buildSectionIndex,
} from "./traversal.js";

export type { SchemaWalkContext, SchemaVisitor } from "./traversal.js";

// Search
export { searchSchema } from "./search.js";
export type { SearchSchemaResult } from "./search.js";
