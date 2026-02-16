import { useContext, useCallback } from "react";
import { SetteraSchemaContext, SetteraValuesContext } from "../context.js";
import type { SaveStatus } from "../context.js";
import { evaluateVisibility } from "../visibility.js";
import { validateSettingValue } from "../validation.js";
import type { SettingDefinition, ConfirmConfig } from "@settera/schema";

export interface UseSetteraSettingResult {
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
  const valuesCtx = useContext(SetteraValuesContext);

  if (!schemaCtx) {
    throw new Error("useSetteraSetting must be used within a SetteraProvider.");
  }
  if (!valuesCtx) {
    throw new Error("useSetteraSetting must be used within a SetteraRenderer.");
  }

  const definition = schemaCtx.getSettingByKey(key);
  if (!definition) {
    throw new Error(`Setting "${key}" not found in schema.`);
  }

  // Value from resolved values (defaults already merged by SetteraRenderer)
  const value = valuesCtx.values[key];

  // Setter — runs sync validation automatically, with confirm interception
  const contextSetValue = valuesCtx.setValue;
  const contextSetError = valuesCtx.setError;
  const requestConfirm = valuesCtx.requestConfirm;
  const setValue = useCallback(
    (newValue: unknown) => {
      const confirmConfig =
        "confirm" in definition
          ? (definition.confirm as ConfirmConfig | undefined)
          : undefined;

      const applyValue = () => {
        const syncError = validateSettingValue(definition, newValue);
        contextSetError(key, syncError);
        contextSetValue(key, newValue);
      };

      if (confirmConfig) {
        const dangerous =
          "dangerous" in definition && (definition.dangerous as boolean);
        requestConfirm({
          key,
          config: confirmConfig,
          dangerous: !!dangerous,
          onConfirm: applyValue,
          onCancel: () => {},
        });
      } else {
        applyValue();
      }
    },
    [contextSetValue, contextSetError, key, definition, requestConfirm],
  );

  // Full validation pipeline: sync + async (for blur).
  // NOTE: Without valueOverride, validate() reads from the values closure which
  // may be stale if called synchronously after setValue (React state hasn't
  // flushed yet). Components should either call validate() on blur (TextInput,
  // NumberInput) or pass the new value explicitly via valueOverride (Select).
  // Suppressed when a confirm dialog is pending for this key to avoid showing
  // validation errors for an uncommitted value.
  const onValidate = valuesCtx.onValidate;
  const pendingConfirm = valuesCtx.pendingConfirm;
  const validate = useCallback(
    async (valueOverride?: unknown): Promise<string | null> => {
      // Suppress validation while confirm is pending for this key
      if (pendingConfirm?.key === key) return null;

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
    [
      valuesCtx.values,
      definition,
      key,
      contextSetError,
      onValidate,
      pendingConfirm,
    ],
  );

  // Error
  const error = valuesCtx.errors[key] ?? null;

  // Visibility — resolved values include defaults, so visibility works
  // correctly even when the consumer hasn't explicitly set a value.
  const isVisible = evaluateVisibility(
    definition.visibleWhen,
    valuesCtx.values,
  );

  const saveStatus: SaveStatus = valuesCtx.saveStatus[key] ?? "idle";

  return { value, setValue, error, isVisible, definition, saveStatus, validate };
}
