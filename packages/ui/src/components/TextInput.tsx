import React, { useCallback, useEffect, useRef, useState } from "react";
import { useSetteraSetting } from "@settera/react";
import { ControlInput } from "./ControlPrimitives.js";

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
  const [isFocusVisible, setIsFocusVisible] = useState(false);

  const committed = typeof value === "string" ? value : "";
  const [localValue, setLocalValue] = useState(committed);
  const localValueRef = useRef(localValue);
  const isFocusedRef = useRef(false);

  // Sync from external value when not focused
  useEffect(() => {
    if (!isFocusedRef.current) {
      const synced = typeof value === "string" ? value : "";
      localValueRef.current = synced;
      setLocalValue(synced);
    }
  }, [value]);

  const commit = useCallback(() => {
    const local = localValueRef.current;
    const current = typeof value === "string" ? value : "";
    if (local !== current) {
      setValue(local);
    }
    validate(local);
  }, [value, setValue, validate]);

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

  const handleChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    localValueRef.current = e.target.value;
    setLocalValue(e.target.value);
  }, []);

  const handleBlur = useCallback(() => {
    setIsFocusVisible(false);
    isFocusedRef.current = false;
    commit();
  }, [commit]);

  const pointerDownRef = useRef(false);

  const handlePointerDown = useCallback(() => {
    pointerDownRef.current = true;
  }, []);

  const handleFocus = useCallback(() => {
    isFocusedRef.current = true;
    setIsFocusVisible(!pointerDownRef.current);
    pointerDownRef.current = false;
  }, []);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLInputElement>) => {
      if (e.key === "Enter") {
        commit();
      } else if (e.key === "Escape") {
        const current = typeof value === "string" ? value : "";
        localValueRef.current = current;
        setLocalValue(current);
      }
    },
    [commit, value],
  );

  const hasError = error !== null;

  return (
    <ControlInput
      type={inputType}
      value={localValue}
      onChange={handleChange}
      onBlur={handleBlur}
      onPointerDown={handlePointerDown}
      onFocus={handleFocus}
      onKeyDown={handleKeyDown}
      placeholder={placeholder}
      maxLength={maxLength}
      aria-label={definition.title}
      aria-invalid={hasError}
      aria-describedby={hasError ? `settera-error-${settingKey}` : undefined}
      hasError={hasError}
      isDangerous={isDangerous}
      isFocusVisible={isFocusVisible}
    />
  );
}
