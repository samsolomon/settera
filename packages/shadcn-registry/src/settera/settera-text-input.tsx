"use client";

import React, { useCallback, useState } from "react";
import { useSetteraSetting, useBufferedInput } from "@settera/react";
import { EyeIcon, EyeOffIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
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
      <TextareaBuffered
        committed={committed}
        onCommit={onCommit}
        settingKey={settingKey}
        title={definition.title}
        placeholder={placeholder}
        maxLength={maxLength}
        isDisabled={isDisabled}
        isReadOnly={isReadOnly}
        hasError={hasError}
        className={sharedClassName}
      />
    );
  }

  return (
    <InputBuffered
      committed={committed}
      onCommit={onCommit}
      settingKey={settingKey}
      title={definition.title}
      inputType={inputType}
      placeholder={placeholder}
      maxLength={maxLength}
      isDisabled={isDisabled}
      isReadOnly={isReadOnly}
      hasError={hasError}
      className={sharedClassName}
    />
  );
}

function TextareaBuffered({
  committed,
  onCommit,
  settingKey,
  title,
  placeholder,
  maxLength,
  isDisabled,
  isReadOnly,
  hasError,
  className: extraClassName,
}: {
  committed: string;
  onCommit: (local: string) => void;
  settingKey: string;
  title: string;
  placeholder?: string;
  maxLength?: number;
  isDisabled: boolean;
  isReadOnly: boolean;
  hasError: boolean;
  className?: string;
}) {
  const { inputProps } = useBufferedInput<HTMLTextAreaElement>(committed, onCommit);

  return (
    <Textarea
      {...inputProps}
      placeholder={placeholder}
      disabled={isDisabled}
      readOnly={isReadOnly}
      aria-label={title}
      aria-invalid={hasError}
      aria-describedby={hasError ? `settera-error-${settingKey}` : undefined}
      className={cn("w-full md:w-[var(--settera-control-width,200px)]", extraClassName)}
      maxLength={maxLength}
    />
  );
}

function InputBuffered({
  committed,
  onCommit,
  settingKey,
  title,
  inputType,
  placeholder,
  maxLength,
  isDisabled,
  isReadOnly,
  hasError,
  className: extraClassName,
}: {
  committed: string;
  onCommit: (local: string) => void;
  settingKey: string;
  title: string;
  inputType: string;
  placeholder?: string;
  maxLength?: number;
  isDisabled: boolean;
  isReadOnly: boolean;
  hasError: boolean;
  className?: string;
}) {
  const { inputProps } = useBufferedInput(committed, onCommit);
  const [showPassword, setShowPassword] = useState(false);
  const isPassword = inputType === "password";

  return (
    <InputGroup className={cn("w-full md:w-[var(--settera-control-width,200px)]", extraClassName)}>
      <InputGroupInput
        type={isPassword && showPassword ? "text" : inputType}
        {...inputProps}
        placeholder={placeholder}
        disabled={isDisabled}
        readOnly={isReadOnly}
        aria-label={title}
        aria-invalid={hasError}
        aria-describedby={hasError ? `settera-error-${settingKey}` : undefined}
        maxLength={maxLength}
      />
      {isPassword && (
        <InputGroupAddon align="inline-end">
          <Button
            type="button"
            variant="ghost"
            size="icon-xs"
            onClick={() => setShowPassword((prev) => !prev)}
            aria-label={showPassword ? "Hide password" : "Show password"}
            className="text-muted-foreground shadow-none"
          >
            {showPassword ? (
              <EyeOffIcon className="size-4" />
            ) : (
              <EyeIcon className="size-4" />
            )}
          </Button>
        </InputGroupAddon>
      )}
      {isReadOnly && (
        <InputGroupAddon align="inline-end">
          <SetteraCopyButton value={committed} label={title} />
        </InputGroupAddon>
      )}
    </InputGroup>
  );
}
