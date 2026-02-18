export const SCHEMA_VERSION = "1.0";

// Types
export type {
  SetteraSchema,
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
  ColorSetting,
  CompoundSetting,
  CompoundFieldDefinition,
  RepeatableSetting,
  RepeatableFieldDefinition,
  ActionSetting,
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

// Validation
export { validateSchema } from "./validate.js";

// Traversal
export {
  walkSchema,
  flattenSettings,
  getSettingByKey,
  getPageByKey,
  resolveDependencies,
  isFlattenedPage,
  resolvePageKey,
} from "./traversal.js";

export type { SchemaWalkContext, SchemaVisitor } from "./traversal.js";
