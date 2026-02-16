// Re-export essentials from react layer
export {
  SCHEMA_VERSION,
  SettaraProvider,
  SettaraRenderer,
  useSettara,
  useSettaraSetting,
  useSettaraNavigation,
  evaluateVisibility,
} from "@settara/react";

// UI Components
export { BooleanSwitch } from "./components/BooleanSwitch.js";
export type { BooleanSwitchProps } from "./components/BooleanSwitch.js";
export { SettingRow } from "./components/SettingRow.js";
export type { SettingRowProps } from "./components/SettingRow.js";
