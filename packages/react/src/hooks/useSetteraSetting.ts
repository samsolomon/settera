import { useContext, useCallback } from "react";
import { SetteraSchemaContext, SetteraValuesContext } from "../context.js";
import type { SaveStatus } from "../context.js";
import { useStoreSlice, useStoreSelector } from "./useStoreSelector.js";
import {
  evaluateVisibility,
  validateSettingValue,
  type SettingDefinition,
  type ValueSetting,
} from "@settera/schema";

export interface UseSetteraSettingResult {
  /** Current value (falls back to definition.default via resolved values) */
  value: unknown;
  /** Set a new value for this setting */
  setValue: (value: unknown) => void;
  /** Current validation error, if any */
  error: string | null;
  /** Whether this setting is currently visible */
  isVisible: boolean;
  /** Whether this setting is readonly (value displayed but not editable) */
  isReadonly: boolean;
  /** The setting definition from the schema */
  definition: SettingDefinition;
  /** Per-setting save status (idle/saving/saved/error) */
  saveStatus: SaveStatus;
  /** Run full validation pipeline (sync + async). Call on blur.
   *  Pass an explicit value to avoid stale-closure issues (e.g. Select onChange). */
  validate: (valueOverride?: unknown) => Promise<string | null>;
}

/**
 * Access and control a single setting by key.
 * Must be used within both SetteraProvider and SetteraRenderer.
 */
export function useSetteraSetting(key: string): UseSetteraSettingResult {
  const schemaCtx = useContext(SetteraSchemaContext);
  const store = useContext(SetteraValuesContext);

  if (!schemaCtx) {
    throw new Error("useSetteraSetting must be used within a SetteraProvider.");
  }
  if (!store) {
    throw new Error("useSetteraSetting must be used within a SetteraRenderer.");
  }

  const definition = schemaCtx.getSettingByKey(key);
  if (!definition) {
    throw new Error(`Setting "${key}" not found in schema.`);
  }

  // Per-key slice — only re-renders when this key's data changes.
  // isConfirmPending is only tracked for settings with a confirm config,
  // so confirm dialog open/close doesn't re-render unrelated settings.
  const hasConfirm =
    "confirm" in definition && definition.confirm !== undefined;
  const slice = useStoreSlice(store, (state) => ({
    value: state.values[key],
    error: state.errors[key] ?? null,
    saveStatus: (state.saveStatus[key] ?? "idle") as SaveStatus,
    isConfirmPending: hasConfirm && state.pendingConfirm?.key === key,
  }));

  const { value, error, saveStatus } = slice;

  // Visibility — subscribe to full values only when visibleWhen exists
  const hasVisibleWhen = definition.visibleWhen !== undefined;
  const allValues = useStoreSelector(
    store,
    (state) => (hasVisibleWhen ? state.values : undefined),
  );
  const isVisible = hasVisibleWhen
    ? evaluateVisibility(definition.visibleWhen, allValues!)
    : true;

  const isReadonly =
    "readonly" in definition && definition.readonly === true;

  // Setter — runs sync validation automatically, with confirm interception
  const setValue = useCallback(
    (newValue: unknown) => {
      if (definition.disabled) return;
      if ("readonly" in definition && definition.readonly) return;

      const confirmConfig =
        definition.type !== "action"
          ? (definition as ValueSetting).confirm
          : undefined;

      const applyValue = () => {
        const syncError = validateSettingValue(definition, newValue);
        store.setError(key, syncError);
        store.setValue(key, newValue);
      };

      if (confirmConfig) {
        store.requestConfirm({
          key,
          config: confirmConfig,
          dangerous: !!definition.dangerous,
          onConfirm: applyValue,
          onCancel: () => {},
        });
      } else {
        applyValue();
      }
    },
    [store, key, definition],
  );

  // Full validation pipeline: sync + async (for blur).
  // Reads current value from store at call time — fixes stale closure issue.
  // Suppressed when a confirm dialog is pending for this key.
  const validate = useCallback(
    async (valueOverride?: unknown): Promise<string | null> => {
      // Suppress validation while confirm is pending for this key
      if (store.getState().pendingConfirm?.key === key) return null;

      // Use explicit value when provided, otherwise read fresh from store
      const currentValue =
        valueOverride !== undefined
          ? valueOverride
          : store.getState().values[key];
      const syncError = validateSettingValue(definition, currentValue);
      if (syncError) {
        store.setError(key, syncError);
        return syncError;
      }

      // Sync passed — clear any previous error
      store.setError(key, null);

      // Run async validation if provided
      const onValidate = store.getOnValidate();
      const asyncValidator = onValidate?.[key];
      if (asyncValidator) {
        const asyncError = await asyncValidator(currentValue);
        if (asyncError) {
          store.setError(key, asyncError);
          return asyncError;
        }
      }

      return null;
    },
    [store, key, definition],
  );

  return {
    value,
    setValue,
    error,
    isVisible,
    isReadonly,
    definition,
    saveStatus,
    validate,
  };
}
