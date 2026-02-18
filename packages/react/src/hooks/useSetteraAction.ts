import { useContext, useCallback } from "react";
import { SetteraSchemaContext, SetteraValuesContext } from "../context.js";
import { useStoreSelector } from "./useStoreSelector.js";
import { useVisibility } from "./useVisibility.js";
import type { ActionSetting } from "@settera/schema";

export interface UseSetteraActionResult {
  /** The setting definition from the schema */
  definition: ActionSetting;
  /** Whether this setting is currently visible */
  isVisible: boolean;
  /** The action handler. No-ops if no handler is registered for this key. */
  onAction: (payload?: unknown) => void;
  /** True while an async onAction handler is in-flight */
  isLoading: boolean;
}

/**
 * Access and invoke an action-type setting by key.
 * Must be used within a Settera component.
 */
export function useSetteraAction(key: string): UseSetteraActionResult {
  const schemaCtx = useContext(SetteraSchemaContext);
  const store = useContext(SetteraValuesContext);

  if (!schemaCtx) {
    throw new Error("useSetteraAction must be used within a Settera component.");
  }
  if (!store) {
    throw new Error("useSetteraAction must be used within a Settera component.");
  }

  const definition = schemaCtx.getSettingByKey(key);
  if (!definition) {
    throw new Error(`Setting "${key}" not found in schema.`);
  }
  if (definition.type !== "action") {
    throw new Error(
      `Setting "${key}" is not an action. Use useSetteraSetting instead of useSetteraAction.`,
    );
  }

  const isLoading = useStoreSelector(
    store,
    (state) => state.actionLoading[key] === true,
  );

  const onAction = useCallback(
    (payload?: unknown) => store.invokeAction(key, payload),
    [store, key],
  );

  const isVisible = useVisibility(store, definition.visibleWhen);

  return {
    definition,
    isVisible,
    onAction,
    isLoading,
  };
}
