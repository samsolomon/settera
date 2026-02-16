// Re-export schema essentials
export {
  SCHEMA_VERSION,
  isFlattenedPage,
  resolvePageKey,
} from "@settara/schema";
export type {
  SettaraSchema,
  SettingDefinition,
  BooleanSetting,
  VisibilityCondition,
} from "@settara/schema";

// Provider
export { SettaraProvider } from "./provider.js";
export type { SettaraProviderProps } from "./provider.js";

// Renderer
export { SettaraRenderer } from "./renderer.js";
export type { SettaraRendererProps } from "./renderer.js";

// Contexts (for advanced usage)
export {
  SettaraSchemaContext,
  SettaraNavigationContext,
  SettaraValuesContext,
} from "./context.js";
export type {
  SettaraSchemaContextValue,
  SettaraNavigationContextValue,
  SettaraValuesContextValue,
  PendingConfirm,
} from "./context.js";

// Hooks
export { useSettara } from "./hooks/useSettara.js";
export { useSettaraSetting } from "./hooks/useSettaraSetting.js";
export type { UseSettaraSettingResult } from "./hooks/useSettaraSetting.js";
export { useSettaraAction } from "./hooks/useSettaraAction.js";
export type { UseSettaraActionResult } from "./hooks/useSettaraAction.js";
export { useSettaraConfirm } from "./hooks/useSettaraConfirm.js";
export type { UseSettaraConfirmResult } from "./hooks/useSettaraConfirm.js";
export { useSettaraNavigation } from "./hooks/useSettaraNavigation.js";
export { useSettaraSearch } from "./hooks/useSettaraSearch.js";
export { useRovingTabIndex } from "./hooks/useRovingTabIndex.js";
export type {
  UseRovingTabIndexOptions,
  UseRovingTabIndexResult,
} from "./hooks/useRovingTabIndex.js";
export {
  useSettaraGlobalKeys,
  isTextInput,
} from "./hooks/useSettaraGlobalKeys.js";
export type { UseSettaraGlobalKeysOptions } from "./hooks/useSettaraGlobalKeys.js";

// Validation (pure function, useful for custom renderers)
export { validateSettingValue } from "./validation.js";

// Visibility (pure function, useful for custom renderers)
export { evaluateVisibility } from "./visibility.js";
