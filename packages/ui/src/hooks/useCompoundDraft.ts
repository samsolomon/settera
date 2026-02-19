import { useMemo, useCallback } from "react";
import type { CompoundFieldDefinition } from "@settera/schema";

function isObjectRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

/**
 * Shared hook for compound setting field state.
 * Merges defaults with current value, provides getFieldValue and updateField.
 * Used by CompoundInput (inline/modal/page) and CompoundSubpage.
 */
export function useCompoundDraft(
  value: unknown,
  fields: CompoundFieldDefinition[],
  setValue: (next: Record<string, unknown>) => void,
  validate: (next: Record<string, unknown>) => void,
) {
  const compoundValue = useMemo(
    () => (isObjectRecord(value) ? value : {}),
    [value],
  );

  const effectiveValue = useMemo(() => {
    const merged: Record<string, unknown> = {};
    for (const field of fields) {
      if ("default" in field && field.default !== undefined) {
        merged[field.key] = field.default;
      }
    }
    return { ...merged, ...compoundValue };
  }, [compoundValue, fields]);

  const getFieldValue = useCallback(
    (field: CompoundFieldDefinition): unknown => {
      return effectiveValue[field.key];
    },
    [effectiveValue],
  );

  const updateField = useCallback(
    (fieldKey: string, nextFieldValue: unknown) => {
      const nextValue = { ...effectiveValue, [fieldKey]: nextFieldValue };
      setValue(nextValue);
      validate(nextValue);
    },
    [effectiveValue, setValue, validate],
  );

  return { effectiveValue, getFieldValue, updateField };
}
