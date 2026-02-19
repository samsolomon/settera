import React, { useCallback, useState } from "react";
import { useSetteraSetting } from "@settera/react";
import { PrimitiveInput } from "./SetteraPrimitives.js";

export interface DateInputProps {
  settingKey: string;
}

/**
 * A native date input for date settings.
 * Runs async validation on blur (like TextInput — edits are in-progress until blur).
 */
export function DateInput({ settingKey }: DateInputProps) {
  const { value, setValue, error, definition, validate } =
    useSetteraSetting(settingKey);
  const [isFocusVisible, setIsFocusVisible] = useState(false);

  const isDangerous =
    "dangerous" in definition && Boolean(definition.dangerous);
  const isDate = definition.type === "date";
  const minDate =
    isDate && definition.validation?.minDate
      ? definition.validation.minDate
      : undefined;
  const maxDate =
    isDate && definition.validation?.maxDate
      ? definition.validation.maxDate
      : undefined;

  const handleChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      setValue(e.target.value);
    },
    [setValue],
  );

  const handleBlur = useCallback(() => {
    setIsFocusVisible(false);
    validate();
  }, [validate]);

  const handleFocus = useCallback(() => {
    setIsFocusVisible(true);
  }, []);

  const isDisabled = "disabled" in definition && Boolean(definition.disabled);
  const isReadOnly = "readonly" in definition && Boolean(definition.readonly);
  const hasError = error !== null;

  return (
    <PrimitiveInput
      type="date"
      value={typeof value === "string" ? value : ""}
      onChange={handleChange}
      onBlur={handleBlur}
      onFocus={handleFocus}
      min={minDate}
      max={maxDate}
      disabled={isDisabled}
      readOnly={isReadOnly}
      aria-label={definition.title}
      aria-invalid={hasError}
      aria-describedby={hasError ? `settera-error-${settingKey}` : undefined}
      invalid={hasError}
      tone={isDangerous ? "destructive" : "default"}
      focusVisible={isFocusVisible}
    />
  );
}
