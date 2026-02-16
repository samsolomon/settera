import { useContext, useCallback, useState, useRef, useEffect } from "react";
import { SettaraSchemaContext, SettaraValuesContext } from "../context.js";
import { evaluateVisibility } from "../visibility.js";
import type { SettingDefinition } from "@settara/schema";

export interface UseSettaraActionResult {
  /** The setting definition from the schema */
  definition: SettingDefinition;
  /** Whether this setting is currently visible */
  isVisible: boolean;
  /** The action handler, or undefined if none provided */
  onAction: (() => void) | undefined;
  /** True while an async onAction handler is in-flight */
  isLoading: boolean;
}

/**
 * Access and invoke an action-type setting by key.
 * Must be used within both SettaraProvider and SettaraRenderer.
 */
export function useSettaraAction(key: string): UseSettaraActionResult {
  const schemaCtx = useContext(SettaraSchemaContext);
  const valuesCtx = useContext(SettaraValuesContext);

  if (!schemaCtx) {
    throw new Error("useSettaraAction must be used within a SettaraProvider.");
  }
  if (!valuesCtx) {
    throw new Error("useSettaraAction must be used within a SettaraRenderer.");
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

  const handler = valuesCtx.onAction?.[key];

  const onAction = useCallback(() => {
    if (!handler || inFlightRef.current) return;
    const result = handler();
    // If the handler returns a thenable, track loading state.
    // Errors are caught here to prevent unhandled rejections since
    // onClick handlers don't await the return value.
    if (result instanceof Promise) {
      inFlightRef.current = true;
      setIsLoading(true);
      result
        .catch((err: unknown) => {
          console.error(`[settara] Action "${key}" failed:`, err);
        })
        .finally(() => {
          inFlightRef.current = false;
          if (mountedRef.current) {
            setIsLoading(false);
          }
        });
    }
  }, [handler, key]);

  const isVisible = evaluateVisibility(
    definition.visibleWhen,
    valuesCtx.values,
  );

  return {
    definition,
    isVisible,
    onAction: handler ? onAction : undefined,
    isLoading,
  };
}
