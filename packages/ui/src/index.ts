// Re-export essentials from react layer
export {
  SCHEMA_VERSION,
  SettaraProvider,
  SettaraRenderer,
  useSettara,
  useSettaraSetting,
  useSettaraAction,
  useSettaraNavigation,
  useSettaraSearch,
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

// Search
export { SettaraSearch } from "./components/SettaraSearch.js";

// Layout components
export { SettaraSetting } from "./components/SettaraSetting.js";
export type { SettaraSettingProps } from "./components/SettaraSetting.js";
export { SettaraSection } from "./components/SettaraSection.js";
export type { SettaraSectionProps } from "./components/SettaraSection.js";
export { SettaraPage } from "./components/SettaraPage.js";
export type { SettaraPageProps } from "./components/SettaraPage.js";
export { SettaraSidebar } from "./components/SettaraSidebar.js";
export type { SettaraSidebarProps } from "./components/SettaraSidebar.js";
export { SettaraLayout } from "./components/SettaraLayout.js";
export type { SettaraLayoutProps } from "./components/SettaraLayout.js";
