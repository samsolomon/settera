// Re-export essentials from schema layer
export {
  SCHEMA_VERSION,
  evaluateVisibility,
  validateSettingValue,
  validateConfirmText,
} from "@settera/schema";

// Re-export essentials from react layer
export {
  Settera,
  useSettera,
  useSetteraSetting,
  useSetteraAction,
  useSetteraConfirm,
  useSetteraSection,
} from "@settera/react";

// Navigation provider and hooks (UI-specific)
export { SetteraNavigationProvider } from "./providers/SetteraNavigationProvider.js";
export type { SetteraNavigationProviderProps } from "./providers/SetteraNavigationProvider.js";
export { SetteraNavigationContext } from "./contexts/SetteraNavigationContext.js";
export type { SetteraNavigationContextValue } from "./contexts/SetteraNavigationContext.js";
export { useSetteraNavigation } from "./hooks/useSetteraNavigation.js";
export { useSetteraSearch } from "./hooks/useSetteraSearch.js";

// Keyboard navigation hooks (UI-specific, DOM-dependent)
export { useRovingTabIndex } from "./hooks/useRovingTabIndex.js";
export { useSetteraGlobalKeys, isTextInput } from "./hooks/useSetteraGlobalKeys.js";
export { useContentCardNavigation } from "./hooks/useContentCardNavigation.js";

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
export { CompoundInput } from "./components/CompoundInput.js";
export type { CompoundInputProps } from "./components/CompoundInput.js";
export { RepeatableInput } from "./components/ListInput.js";
export type { RepeatableInputProps } from "./components/ListInput.js";
export { ConfirmDialog } from "./components/ConfirmDialog.js";

// Contexts
export { SetteraDeepLinkContext } from "./contexts/SetteraDeepLinkContext.js";
export type { SetteraDeepLinkContextValue } from "./contexts/SetteraDeepLinkContext.js";

// Utilities
export { parseDescriptionLinks } from "./utils/parseDescriptionLinks.js";

// Search
export { SetteraSearch } from "./components/SetteraSearch.js";

// Layout components
export { SetteraSetting } from "./components/SetteraSetting.js";
export type {
  SetteraSettingProps,
  SetteraCustomSettingProps,
} from "./components/SetteraSetting.js";
export { SetteraSection } from "./components/SetteraSection.js";
export type { SetteraSectionProps } from "./components/SetteraSection.js";
export { SetteraPage } from "./components/SetteraPage.js";
export type {
  SetteraPageProps,
  SetteraCustomPageProps,
} from "./components/SetteraPage.js";
export { SetteraSidebar } from "./components/SetteraSidebar.js";
export type { SetteraSidebarProps } from "./components/SetteraSidebar.js";
export { SetteraLayout } from "./components/SetteraLayout.js";
export type {
  SetteraLayoutProps,
  SetteraBackToAppConfig,
} from "./components/SetteraLayout.js";
