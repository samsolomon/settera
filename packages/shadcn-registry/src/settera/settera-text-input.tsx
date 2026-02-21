"use client";

import React, { useCallback } from "react";
import { useSetteraSetting, useBufferedInput } from "@settera/react";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";

export interface SetteraTextInputProps {
  settingKey: string;
}

export function SetteraTextInput({ settingKey }: SetteraTextInputProps) {
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
  const isMultiline = isText && definition.inputType === "textarea";

  const isDisabled = "disabled" in definition && Boolean(definition.disabled);
  const isReadOnly = "readonly" in definition && Boolean(definition.readonly);
  const hasError = error !== null;

  const sharedProps = {
    ...inputProps,
    placeholder,
    disabled: isDisabled,
    readOnly: isReadOnly,
    "aria-label": definition.title,
    "aria-invalid": hasError as boolean,
    "aria-describedby": hasError ? `settera-error-${settingKey}` : undefined,
    className: cn(
      "w-full md:w-[200px]",
      hasError && "border-destructive",
      isDangerous && "text-destructive",
    ),
  };

  if (isMultiline) {
    return (
      <Textarea
        {...sharedProps}
        maxLength={maxLength}
      />
    );
  }

  return (
    <Input
      type={inputType}
      {...sharedProps}
      maxLength={maxLength}
    />
  );
}
