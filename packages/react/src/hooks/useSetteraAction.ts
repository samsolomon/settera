import { useContext, useCallback, useState, useRef, useEffect } from "react";
import { SetteraSchemaContext, SetteraValuesContext } from "../context.js";
import { useStoreSelector } from "./useStoreSelector.js";
import { evaluateVisibility } from "../visibility.js";
import type { SettingDefinition } from "@settera/schema";

export interface UseSetteraActionResult {
  /** The setting definition from the schema */
  definition: SettingDefinition;
  /** Whether this setting is currently visible */
  isVisible: boolean;
  /** The action handler. No-ops if no handler is registered for this key. */
  onAction: (payload?: unknown) => void;
  /** True while an async onAction handler is in-flight */
  isLoading: boolean;
}

/**
 * Access and invoke an action-type setting by key.
 * Must be used within both SetteraProvider and SetteraRenderer.
 */
export function useSetteraAction(key: string): UseSetteraActionResult {
  const schemaCtx = useContext(SetteraSchemaContext);
  const store = useContext(SetteraValuesContext);

  if (!schemaCtx) {
    throw new Error("useSetteraAction must be used within a SetteraProvider.");
  }
  if (!store) {
    throw new Error("useSetteraAction must be used within a SetteraRenderer.");
  }

  const definition = schemaCtx.getSettingByKey(key);
  if (!definition) {
    throw new Error(`Setting "${key}" not found in schema.`);
  }

  const [isLoading, setIsLoading] = useState(false);
  const mountedRef = useRef(true);
  const inFlightRef = useRef(false);

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
    };
  }, []);

  const onAction = useCallback(
    (payload?: unknown) => {
      const currentHandler = store.getOnAction()?.[key];
      if (!currentHandler || inFlightRef.current) return;
      const result = currentHandler(payload);
      if (result instanceof Promise) {
        inFlightRef.current = true;
        setIsLoading(true);
        result
          .catch((err: unknown) => {
            console.error(`[settera] Action "${key}" failed:`, err);
          })
          .finally(() => {
            inFlightRef.current = false;
            if (mountedRef.current) {
              setIsLoading(false);
            }
          });
      }
    },
    [store, key],
  );

  // Subscribe to values for visibility
  const hasVisibleWhen = definition.visibleWhen !== undefined;
  const allValues = useStoreSelector(
    store,
    (state) => (hasVisibleWhen ? state.values : undefined),
  );
  const isVisible = hasVisibleWhen
    ? evaluateVisibility(definition.visibleWhen, allValues!)
    : true;

  return {
    definition,
    isVisible,
    onAction,
    isLoading,
  };
}
