import React, { useCallback } from "react";
import { useSetteraSetting } from "@settera/react";
import { ControlInput } from "./ControlPrimitives.js";
import { useBufferedInput } from "../hooks/useBufferedInput.js";

export interface TextInputProps {
  settingKey: string;
}

/**
 * A text input for text settings.
 * Buffers edits locally. Commits on blur or Enter. Reverts on Escape.
 */
export function TextInput({ settingKey }: TextInputProps) {
  const { value, setValue, error, definition, validate } =
    useSetteraSetting(settingKey);

  const committed = typeof value === "string" ? value : "";

  const onCommit = useCallback(
    (local: string) => {
      if (local !== committed) {
        setValue(local);
      }
      validate(local);
    },
    [committed, setValue, validate],
  );

  const { inputProps, isFocused } = useBufferedInput(committed, onCommit);

  const isDangerous =
    "dangerous" in definition && Boolean(definition.dangerous);
  const isText = definition.type === "text";
  const inputType =
    isText && definition.inputType ? definition.inputType : "text";
  const placeholder = isText ? definition.placeholder : undefined;
  const maxLength =
    isText && definition.validation?.maxLength !== undefined
      ? definition.validation.maxLength
      : undefined;

  const isDisabled =
    "disabled" in definition && Boolean(definition.disabled);
  const isReadOnly =
    "readonly" in definition && Boolean(definition.readonly);
  const hasError = error !== null;

  return (
    <ControlInput
      type={inputType}
      {...inputProps}
      placeholder={placeholder}
      maxLength={maxLength}
      disabled={isDisabled}
      readOnly={isReadOnly}
      aria-label={definition.title}
      aria-invalid={hasError}
      aria-describedby={hasError ? `settera-error-${settingKey}` : undefined}
      hasError={hasError}
      isDangerous={isDangerous}
      isFocusVisible={isFocused}
    />
  );
}
