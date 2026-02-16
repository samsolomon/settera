import { useContext, useCallback } from "react";
import { SettaraSchemaContext, SettaraValuesContext } from "../context.js";
import { evaluateVisibility } from "../visibility.js";
import type { SettingDefinition, VisibilityCondition } from "@settara/schema";

export interface UseSettaraSettingResult {
  /** Current value (falls back to definition.default via resolved values) */
  value: unknown;
  /** Set a new value for this setting */
  setValue: (value: unknown) => void;
  /** Current validation error, if any */
  error: string | null;
  /** Whether this setting is currently visible */
  isVisible: boolean;
  /** The setting definition from the schema */
  definition: SettingDefinition;
}

/**
 * Access and control a single setting by key.
 * Must be used within both SettaraProvider and SettaraRenderer.
 */
export function useSettaraSetting(key: string): UseSettaraSettingResult {
  const schemaCtx = useContext(SettaraSchemaContext);
  const valuesCtx = useContext(SettaraValuesContext);

  if (!schemaCtx) {
    throw new Error("useSettaraSetting must be used within a SettaraProvider.");
  }
  if (!valuesCtx) {
    throw new Error("useSettaraSetting must be used within a SettaraRenderer.");
  }

  const definition = schemaCtx.getSettingByKey(key);
  if (!definition) {
    throw new Error(`Setting "${key}" not found in schema.`);
  }

  // Value from resolved values (defaults already merged by SettaraRenderer)
  const value = valuesCtx.values[key];

  // Setter — depend on the stable setValue function, not the whole context object
  const contextSetValue = valuesCtx.setValue;
  const setValue = useCallback(
    (newValue: unknown) => {
      contextSetValue(key, newValue);
    },
    [contextSetValue, key],
  );

  // Error
  const error = valuesCtx.errors[key] ?? null;

  // Visibility — resolved values include defaults, so visibility works
  // correctly even when the consumer hasn't explicitly set a value.
  const visibleWhen =
    "visibleWhen" in definition
      ? (definition.visibleWhen as
          | VisibilityCondition
          | VisibilityCondition[]
          | undefined)
      : undefined;
  const isVisible = evaluateVisibility(visibleWhen, valuesCtx.values);

  return { value, setValue, error, isVisible, definition };
}
