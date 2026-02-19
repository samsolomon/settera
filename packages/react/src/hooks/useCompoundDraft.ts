import { useMemo, useCallback, useState, useRef } from "react";
import type { CompoundFieldDefinition } from "@settera/schema";
import { isObjectRecord } from "../utils/isObjectRecord.js";

/**
 * Shared hook for compound setting field state.
 * Merges defaults with current value, provides getFieldValue and updateField.
 *
 * When `draft: true`, changes are accumulated locally instead of calling
 * setValue/validate on each keystroke. Call `commitDraft()` to persist,
 * or `resetDraft()` to discard.
 */
export function useCompoundDraft(
  value: unknown,
  fields: CompoundFieldDefinition[],
  setValue: (next: Record<string, unknown>) => void,
  validate: (next: Record<string, unknown>) => void,
  options?: { draft?: boolean },
) {
  const isDraft = options?.draft === true;

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

  // Draft state — only used when draft: true
  const [draftValue, setDraftValue] = useState<Record<string, unknown>>(effectiveValue);
  const draftRef = useRef(draftValue);

  // Keep draft in sync with external value when not focused / on reset
  // Re-initialize draft when effectiveValue changes from external source
  const prevEffectiveRef = useRef(effectiveValue);
  if (prevEffectiveRef.current !== effectiveValue) {
    prevEffectiveRef.current = effectiveValue;
    if (isDraft) {
      draftRef.current = effectiveValue;
      setDraftValue(effectiveValue);
    }
  }

  const currentValue = isDraft ? draftValue : effectiveValue;

  const getFieldValue = useCallback(
    (field: CompoundFieldDefinition): unknown => {
      return currentValue[field.key];
    },
    [currentValue],
  );

  const updateField = useCallback(
    (fieldKey: string, nextFieldValue: unknown) => {
      if (isDraft) {
        const next = { ...draftRef.current, [fieldKey]: nextFieldValue };
        draftRef.current = next;
        setDraftValue(next);
      } else {
        const nextValue = { ...effectiveValue, [fieldKey]: nextFieldValue };
        setValue(nextValue);
        validate(nextValue);
      }
    },
    [isDraft, effectiveValue, setValue, validate],
  );

  const commitDraft = useCallback(() => {
    const current = draftRef.current;
    setValue(current);
    validate(current);
  }, [setValue, validate]);

  const resetDraft = useCallback(() => {
    draftRef.current = effectiveValue;
    setDraftValue(effectiveValue);
  }, [effectiveValue]);

  return {
    effectiveValue: currentValue,
    getFieldValue,
    updateField,
    commitDraft,
    resetDraft,
  };
}
