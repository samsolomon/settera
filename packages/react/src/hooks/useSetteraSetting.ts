import { useContext, useCallback } from "react";
import { SetteraSchemaContext, SetteraValuesContext } from "../context.js";
import type { SaveStatus } from "../stores/save-tracker.js";
import { useStoreSlice } from "./useStoreSelector.js";
import { useVisibility } from "./useVisibility.js";
import type { ValueSetting } from "@settera/schema";

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
  definition: ValueSetting;
  /** Per-setting save status (idle/saving/saved/error) */
  saveStatus: SaveStatus;
  /** Run full validation pipeline (sync + async). Call on blur.
   *  Pass an explicit value to avoid stale-closure issues (e.g. Select onChange). */
  validate: (valueOverride?: unknown) => Promise<string | null>;
}

/**
 * Access and control a single setting by key.
 * Must be used within a Settera component.
 */
export function useSetteraSetting(key: string): UseSetteraSettingResult {
  const schemaCtx = useContext(SetteraSchemaContext);
  const store = useContext(SetteraValuesContext);

  if (!schemaCtx) {
    throw new Error("useSetteraSetting must be used within a Settera component.");
  }
  if (!store) {
    throw new Error("useSetteraSetting must be used within a Settera component.");
  }

  const definition = schemaCtx.getSettingByKey(key);
  if (!definition) {
    throw new Error(`Setting "${key}" not found in schema.`);
  }
  if (definition.type === "action") {
    throw new Error(
      `Setting "${key}" is an action. Use useSetteraAction instead of useSetteraSetting.`,
    );
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

  const isVisible = useVisibility(store, definition.visibleWhen);

  const isReadonly =
    "readonly" in definition && definition.readonly === true;

  const setValue = useCallback(
    (newValue: unknown) => store.setValue(key, newValue),
    [store, key],
  );

  const validate = useCallback(
    (valueOverride?: unknown) => store.validate(key, valueOverride),
    [store, key],
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
