"use client";

import React, { useCallback } from "react";
import { useSetteraSetting, useBufferedInput } from "@settera/react";
import { Textarea } from "@/components/ui/textarea";
import {
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
} from "@/components/ui/input-group";
import { cn } from "@/lib/utils";
import { SetteraCopyButton } from "./settera-copy-button";

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

  const { inputProps } = useBufferedInput(committed, onCommit);

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

  const sharedClassName = cn(
    hasError && "border-destructive",
    isDangerous && "text-destructive",
  );

  if (isMultiline) {
    return (
      <Textarea
        {...inputProps}
        placeholder={placeholder}
        disabled={isDisabled}
        readOnly={isReadOnly}
        aria-label={definition.title}
        aria-invalid={hasError}
        aria-describedby={hasError ? `settera-error-${settingKey}` : undefined}
        className={cn("w-full md:w-[var(--settera-control-width,200px)]", sharedClassName)}
        maxLength={maxLength}
      />
    );
  }

  return (
    <InputGroup className={cn("w-full md:w-[var(--settera-control-width,200px)]", sharedClassName)}>
      <InputGroupInput
        type={inputType}
        {...inputProps}
        placeholder={placeholder}
        disabled={isDisabled}
        readOnly={isReadOnly}
        aria-label={definition.title}
        aria-invalid={hasError}
        aria-describedby={hasError ? `settera-error-${settingKey}` : undefined}
        maxLength={maxLength}
      />
      {isReadOnly && (
        <InputGroupAddon align="inline-end">
          <SetteraCopyButton value={committed} label={definition.title} />
        </InputGroupAddon>
      )}
    </InputGroup>
  );
}
