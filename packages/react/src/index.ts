// Re-export schema essentials
export { SCHEMA_VERSION } from "@settara/schema";
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
} from "./context.js";

// Hooks
export { useSettara } from "./hooks/useSettara.js";
export { useSettaraSetting } from "./hooks/useSettaraSetting.js";
export type { UseSettaraSettingResult } from "./hooks/useSettaraSetting.js";
export { useSettaraNavigation } from "./hooks/useSettaraNavigation.js";

// Visibility (pure function, useful for custom renderers)
export { evaluateVisibility } from "./visibility.js";
