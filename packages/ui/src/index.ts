// Re-export essentials from react layer
export {
  SCHEMA_VERSION,
  SetteraProvider,
  SetteraRenderer,
  useSettera,
  useSetteraSetting,
  useSetteraAction,
  useSetteraNavigation,
  useSetteraSearch,
  useRovingTabIndex,
  useSetteraGlobalKeys,
  useSetteraConfirm,
  evaluateVisibility,
  validateSettingValue,
} from "@settera/react";

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
export { MultiSelect } from "./components/MultiSelect.js";
export type { MultiSelectProps } from "./components/MultiSelect.js";
export { DateInput } from "./components/DateInput.js";
export type { DateInputProps } from "./components/DateInput.js";
export { ConfirmDialog } from "./components/ConfirmDialog.js";

// Search
export { SetteraSearch } from "./components/SetteraSearch.js";

// Layout components
export { SetteraSetting } from "./components/SetteraSetting.js";
export type { SetteraSettingProps } from "./components/SetteraSetting.js";
export { SetteraSection } from "./components/SetteraSection.js";
export type { SetteraSectionProps } from "./components/SetteraSection.js";
export { SetteraPage } from "./components/SetteraPage.js";
export type { SetteraPageProps } from "./components/SetteraPage.js";
export { SetteraSidebar } from "./components/SetteraSidebar.js";
export type { SetteraSidebarProps } from "./components/SetteraSidebar.js";
export { SetteraLayout } from "./components/SetteraLayout.js";
export type { SetteraLayoutProps } from "./components/SetteraLayout.js";
