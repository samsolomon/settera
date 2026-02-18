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

// Unified component
export { Settera } from "./settera.js";
export type { SetteraProps } from "./settera.js";

// Store
export { SetteraValuesStore } from "./store.js";
export type { SetteraValuesState } from "./store.js";

// Contexts (for advanced usage)
export {
  SetteraSchemaContext,
  SetteraValuesContext,
} from "./context.js";
export type {
  SetteraSchemaContextValue,
  PendingConfirm,
  SaveStatus,
} from "./context.js";

// Hooks
export { useSettera } from "./hooks/useSettera.js";
export { useSetteraSetting } from "./hooks/useSetteraSetting.js";
export type { UseSetteraSettingResult } from "./hooks/useSetteraSetting.js";
export { useSetteraAction } from "./hooks/useSetteraAction.js";
export type { UseSetteraActionResult } from "./hooks/useSetteraAction.js";
export { useSetteraConfirm } from "./hooks/useSetteraConfirm.js";
export type { UseSetteraConfirmResult } from "./hooks/useSetteraConfirm.js";
export { useSetteraSection } from "./hooks/useSetteraSection.js";
export type { UseSetteraSectionResult } from "./hooks/useSetteraSection.js";

// Store selector hooks
export { useStoreSelector, useStoreSlice } from "./hooks/useStoreSelector.js";

// Validation (pure function, useful for custom renderers)
export { validateSettingValue, validateConfirmText } from "./validation.js";

// Visibility (pure function, useful for custom renderers)
export { evaluateVisibility } from "./visibility.js";
