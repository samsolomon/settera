import { useContext, useCallback } from "react";
import { SettaraSchemaContext, SettaraValuesContext } from "../context.js";
import { evaluateVisibility } from "../visibility.js";
import { validateSettingValue } from "../validation.js";
import type { SettingDefinition } from "@settara/schema";

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
  /** Run full validation pipeline (sync + async). Call on blur.
   *  Pass an explicit value to avoid stale-closure issues (e.g. Select onChange). */
  validate: (valueOverride?: unknown) => Promise<string | null>;
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

  // Setter — runs sync validation automatically
  const contextSetValue = valuesCtx.setValue;
  const contextSetError = valuesCtx.setError;
  const setValue = useCallback(
    (newValue: unknown) => {
      const syncError = validateSettingValue(definition, newValue);
      contextSetError(key, syncError);
      contextSetValue(key, newValue);
    },
    [contextSetValue, contextSetError, key, definition],
  );

  // Full validation pipeline: sync + async (for blur).
  // NOTE: Without valueOverride, validate() reads from the values closure which
  // may be stale if called synchronously after setValue (React state hasn't
  // flushed yet). Components should either call validate() on blur (TextInput,
  // NumberInput) or pass the new value explicitly via valueOverride (Select).
  const onValidate = valuesCtx.onValidate;
  const validate = useCallback(
    async (valueOverride?: unknown): Promise<string | null> => {
      // Use explicit value when provided (avoids stale-closure after setValue)
      const currentValue =
        valueOverride !== undefined ? valueOverride : valuesCtx.values[key];
      const syncError = validateSettingValue(definition, currentValue);
      if (syncError) {
        contextSetError(key, syncError);
        return syncError;
      }

      // Sync passed — clear any previous error
      contextSetError(key, null);

      // Run async validation if provided
      const asyncValidator = onValidate?.[key];
      if (asyncValidator) {
        const asyncError = await asyncValidator(currentValue);
        if (asyncError) {
          contextSetError(key, asyncError);
          return asyncError;
        }
      }

      return null;
    },
    [valuesCtx.values, definition, key, contextSetError, onValidate],
  );

  // Error
  const error = valuesCtx.errors[key] ?? null;

  // Visibility — resolved values include defaults, so visibility works
  // correctly even when the consumer hasn't explicitly set a value.
  const isVisible = evaluateVisibility(
    definition.visibleWhen,
    valuesCtx.values,
  );

  return { value, setValue, error, isVisible, definition, validate };
}
