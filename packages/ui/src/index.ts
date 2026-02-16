// Re-export essentials from react layer
export {
  SCHEMA_VERSION,
  SettaraProvider,
  SettaraRenderer,
  useSettara,
  useSettaraSetting,
  useSettaraAction,
  useSettaraNavigation,
  evaluateVisibility,
  validateSettingValue,
} from "@settara/react";

// UI Components
export { BooleanSwitch } from "./components/BooleanSwitch.js";
export type { BooleanSwitchProps } from "./components/BooleanSwitch.js";
export { SettingRow } from "./components/SettingRow.js";
export type { SettingRowProps } from "./components/SettingRow.js";
export { TextInput } from "./components/TextInput.js";
export type { TextInputProps } from "./components/TextInput.js";
export { NumberInput } from "./components/NumberInput.js";
export type { NumberInputProps } from "./components/NumberInput.js";
export { Select } from "./components/Select.js";
export type { SelectProps } from "./components/Select.js";
export { ActionButton } from "./components/ActionButton.js";
export type { ActionButtonProps } from "./components/ActionButton.js";
