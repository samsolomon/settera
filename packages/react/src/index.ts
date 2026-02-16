// Re-export schema essentials
export {
  SCHEMA_VERSION,
  isFlattenedPage,
  resolvePageKey,
} from "@settera/schema";
export type {
  SetteraSchema,
  SettingDefinition,
  BooleanSetting,
  VisibilityCondition,
} from "@settera/schema";

// Provider
export { SetteraProvider } from "./provider.js";
export type { SetteraProviderProps } from "./provider.js";

// Renderer
export { SetteraRenderer } from "./renderer.js";
export type { SetteraRendererProps } from "./renderer.js";

// Contexts (for advanced usage)
export {
  SetteraSchemaContext,
  SetteraNavigationContext,
  SetteraValuesContext,
} from "./context.js";
export type {
  SetteraSchemaContextValue,
  SetteraNavigationContextValue,
  SetteraValuesContextValue,
  PendingConfirm,
} from "./context.js";

// Hooks
export { useSettera } from "./hooks/useSettera.js";
export { useSetteraSetting } from "./hooks/useSetteraSetting.js";
export type { UseSetteraSettingResult } from "./hooks/useSetteraSetting.js";
export { useSetteraAction } from "./hooks/useSetteraAction.js";
export type { UseSetteraActionResult } from "./hooks/useSetteraAction.js";
export { useSetteraConfirm } from "./hooks/useSetteraConfirm.js";
export type { UseSetteraConfirmResult } from "./hooks/useSetteraConfirm.js";
export { useSetteraNavigation } from "./hooks/useSetteraNavigation.js";
export { useSetteraSearch } from "./hooks/useSetteraSearch.js";
export { useRovingTabIndex } from "./hooks/useRovingTabIndex.js";
export type {
  UseRovingTabIndexOptions,
  UseRovingTabIndexResult,
} from "./hooks/useRovingTabIndex.js";
export {
  useSetteraGlobalKeys,
  isTextInput,
} from "./hooks/useSetteraGlobalKeys.js";
export type { UseSetteraGlobalKeysOptions } from "./hooks/useSetteraGlobalKeys.js";

// Validation (pure function, useful for custom renderers)
export { validateSettingValue } from "./validation.js";

// Visibility (pure function, useful for custom renderers)
export { evaluateVisibility } from "./visibility.js";
