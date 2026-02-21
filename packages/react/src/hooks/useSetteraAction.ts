import { useContext, useCallback, useMemo } from "react";
import { SetteraSchemaContext, SetteraValuesContext } from "../context.js";
import { useStoreSelector, useStoreSlice } from "./useStoreSelector.js";
import { useVisibility } from "./useVisibility.js";
import type { ActionSetting, ActionItem } from "@settera/schema";

export interface UseSetteraActionItemResult {
  /** The action item definition */
  item: ActionItem;
  /** Invoke this item's action */
  onAction: (payload?: unknown) => void;
  /** True while an async onAction handler is in-flight for this item */
  isLoading: boolean;
}

export interface UseSetteraActionResult {
  /** The setting definition from the schema */
  definition: ActionSetting;
  /** Whether this setting is currently visible */
  isVisible: boolean;
  /** The action handler for single-button form. No-ops if no handler is registered for this key. */
  onAction: (payload?: unknown) => void;
  /** True while an async onAction handler is in-flight (single-button form) */
  isLoading: boolean;
  /** Per-item results for multi-button form. Empty array for single-button form. */
  items: UseSetteraActionItemResult[];
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

  // Multi-button: build items array
  const actionItems = definition.actions;

  // Stable per-item callbacks — only change when schema or store identity changes
  const itemCallbacks = useMemo(() => {
    if (!actionItems) return [];
    return actionItems.map(
      (item) => (payload?: unknown) => store.invokeAction(item.key, payload),
    );
  }, [actionItems, store]);

  // Select only the loading states for this action's items (shallow-equal)
  // so unrelated action loading changes don't trigger re-renders.
  const itemLoadingSlice = useStoreSlice(store, (state) => {
    if (!actionItems) return {} as Record<string, boolean>;
    const slice: Record<string, boolean> = {};
    for (const item of actionItems) {
      slice[item.key] = state.actionLoading[item.key] === true;
    }
    return slice;
  });

  const items: UseSetteraActionItemResult[] = useMemo(() => {
    if (!actionItems) return [];
    return actionItems.map((item, i) => ({
      item,
      onAction: itemCallbacks[i],
      isLoading: itemLoadingSlice[item.key] ?? false,
    }));
  }, [actionItems, itemCallbacks, itemLoadingSlice]);

  return {
    definition,
    isVisible,
    onAction,
    isLoading,
    items,
  };
}
