import React, { useState, useCallback, useContext, useMemo } from "react";
import { SettaraSchemaContext, SettaraValuesContext } from "./context.js";
import type { SettaraValuesContextValue } from "./context.js";

export interface SettaraRendererProps {
  /** Current values object (flat keys) */
  values: Record<string, unknown>;
  /** Called on every setting change (instant-apply) */
  onChange: (key: string, value: unknown) => void;
  /** Optional batch change handler for compound settings */
  onBatchChange?: (changes: Array<{ key: string; value: unknown }>) => void;
  /** Handlers for action-type settings */
  onAction?: Record<string, () => void | Promise<void>>;
  /** Custom validation callbacks */
  onValidate?: Record<
    string,
    (value: unknown) => string | null | Promise<string | null>
  >;
  children: React.ReactNode;
}

/**
 * Context bridge that provides SettaraValuesContext to children.
 * In M1, this is a thin wrapper. Auto-layout renderer comes in M2.
 */
export function SettaraRenderer({
  values,
  onChange,
  onAction,
  onValidate,
  children,
}: SettaraRendererProps) {
  const schemaCtx = useContext(SettaraSchemaContext);

  // Merge schema defaults with provided values so that visibility conditions
  // and value reads resolve correctly even when the consumer hasn't set a value.
  const resolvedValues = useMemo(() => {
    if (!schemaCtx) return values;
    const defaults: Record<string, unknown> = {};
    for (const { definition } of schemaCtx.flatSettings) {
      if ("default" in definition && definition.default !== undefined) {
        defaults[definition.key] = definition.default;
      }
    }
    return { ...defaults, ...values };
  }, [values, schemaCtx]);

  const [errors, setErrors] = useState<Record<string, string>>({});

  const setError = useCallback((key: string, error: string | null) => {
    setErrors((prev) => {
      if (error === null) {
        if (!(key in prev)) return prev;
        const next = { ...prev };
        delete next[key];
        return next;
      }
      return { ...prev, [key]: error };
    });
  }, []);

  const setValue = useCallback(
    (key: string, value: unknown) => {
      onChange(key, value);
    },
    [onChange],
  );

  const contextValue: SettaraValuesContextValue = useMemo(
    () => ({
      values: resolvedValues,
      setValue,
      errors,
      setError,
      onValidate,
      onAction,
    }),
    [resolvedValues, setValue, errors, setError, onValidate, onAction],
  );

  return (
    <SettaraValuesContext.Provider value={contextValue}>
      {children}
    </SettaraValuesContext.Provider>
  );
}
