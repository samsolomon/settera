// Unified component
export { Settera } from "./settera.js";
export type { SetteraProps, ValidationMode } from "./settera.js";

// Store
export { SetteraValuesStore } from "./stores/index.js";
export type { SetteraValuesState } from "./stores/index.js";

// Contexts (for advanced usage)
export {
  SetteraSchemaContext,
  SetteraValuesContext,
} from "./context.js";
export type { SetteraSchemaContextValue } from "./context.js";
export type { SaveStatus } from "./stores/save-tracker.js";
export type { PendingConfirm } from "./stores/confirm-manager.js";

// Hooks
export { useSettera } from "./hooks/useSettera.js";
export { useSetteraSetting } from "./hooks/useSetteraSetting.js";
export type { UseSetteraSettingResult } from "./hooks/useSetteraSetting.js";
export { useSetteraAction } from "./hooks/useSetteraAction.js";
export type { UseSetteraActionResult, UseSetteraActionItemResult } from "./hooks/useSetteraAction.js";
export { useSetteraConfirm } from "./hooks/useSetteraConfirm.js";
export type { UseSetteraConfirmResult } from "./hooks/useSetteraConfirm.js";
export { useSetteraSection } from "./hooks/useSetteraSection.js";
export type { UseSetteraSectionResult } from "./hooks/useSetteraSection.js";

// Navigation
export { SetteraNavigation, SetteraNavigationContext, useSetteraNavigation } from "./navigation.js";
export type { SetteraNavigationContextValue, SetteraNavigationProps, SubpageState } from "./navigation.js";

// Store selector hooks
export { useStoreSelector, useStoreSlice } from "./hooks/useStoreSelector.js";

// Behavioral hooks (shared across UI implementations)
export { useBufferedInput } from "./hooks/useBufferedInput.js";
export { useFocusVisible } from "./hooks/useFocusVisible.js";
export { useCompoundDraft } from "./hooks/useCompoundDraft.js";
export { useActionModalDraft } from "./hooks/useActionModalDraft.js";
export { useSaveAndClose } from "./hooks/useSaveAndClose.js";

// Utilities
export { parseDescriptionLinks } from "./utils/parseDescriptionLinks.js";
export { isObjectRecord } from "./utils/isObjectRecord.js";
export { buildModalDraft, getDefaultFieldValue } from "./utils/actionModalUtils.js";
export type { ModalActionFieldSetting } from "./utils/actionModalUtils.js";
