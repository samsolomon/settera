import React, { useCallback, useState } from "react";
import { token } from "@settera/schema";
import { useSetteraSetting, useBufferedInput } from "@settera/react";
import { PrimitiveInput } from "./SetteraPrimitives.js";

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

  const isDisabled = "disabled" in definition && Boolean(definition.disabled);
  const isReadOnly = "readonly" in definition && Boolean(definition.readonly);
  const hasError = error !== null;
  const isPassword = inputType === "password";

  if (isPassword) {
    return (
      <PasswordInputWrapper
        inputProps={inputProps}
        placeholder={placeholder}
        maxLength={maxLength}
        isDisabled={isDisabled}
        isReadOnly={isReadOnly}
        hasError={hasError}
        isDangerous={isDangerous}
        isFocused={isFocused}
        settingKey={settingKey}
        title={definition.title}
      />
    );
  }

  return (
    <PrimitiveInput
      type={inputType}
      {...inputProps}
      placeholder={placeholder}
      maxLength={maxLength}
      disabled={isDisabled}
      readOnly={isReadOnly}
      aria-label={definition.title}
      aria-invalid={hasError}
      aria-describedby={hasError ? `settera-error-${settingKey}` : undefined}
      invalid={hasError}
      tone={isDangerous ? "destructive" : "default"}
      focusVisible={isFocused}
    />
  );
}

// --- Password toggle wrapper ---

const eyeIconPath =
  "M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z M12 9a3 3 0 1 0 0 6 3 3 0 0 0 0-6z";
const eyeOffIconPath =
  "M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94 M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19 M1 1l22 22";
const eyeOffCirclePath = "M10.73 5.08A10.43 10.43 0 0 1 12 5c7 0 11 7 11 7a18.5 18.5 0 0 1-1.4 2.15";

function PasswordInputWrapper({
  inputProps,
  placeholder,
  maxLength,
  isDisabled,
  isReadOnly,
  hasError,
  isDangerous,
  isFocused,
  settingKey,
  title,
}: {
  inputProps: ReturnType<typeof useBufferedInput>["inputProps"];
  placeholder?: string;
  maxLength?: number;
  isDisabled: boolean;
  isReadOnly: boolean;
  hasError: boolean;
  isDangerous: boolean;
  isFocused: boolean;
  settingKey: string;
  title: string;
}) {
  const [showPassword, setShowPassword] = useState(false);
  const [isHovered, setIsHovered] = useState(false);

  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        border: hasError
          ? `1px solid ${token("error-color")}`
          : token("input-border"),
        borderRadius: token("input-border-radius"),
        backgroundColor: token("input-bg"),
        width: token("input-width"),
        boxShadow: isFocused
          ? `0 0 0 2px ${token("focus-ring-color")}`
          : "none",
      }}
    >
      <PrimitiveInput
        type={showPassword ? "text" : "password"}
        {...inputProps}
        placeholder={placeholder}
        maxLength={maxLength}
        disabled={isDisabled}
        readOnly={isReadOnly}
        aria-label={title}
        aria-invalid={hasError}
        aria-describedby={hasError ? `settera-error-${settingKey}` : undefined}
        invalid={false}
        tone={isDangerous ? "destructive" : "default"}
        focusVisible={false}
        style={{
          border: "none",
          borderRadius: 0,
          boxShadow: "none",
          width: "100%",
          backgroundColor: "transparent",
        }}
      />
      <button
        type="button"
        onClick={() => setShowPassword((prev) => !prev)}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        aria-label={showPassword ? "Hide password" : "Show password"}
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          border: "none",
          background: "none",
          cursor: "pointer",
          padding: `0 ${token("space-100")}`,
          color: token("description-color"),
          opacity: isHovered ? 0.7 : 1,
          flexShrink: 0,
        }}
      >
        <svg
          width="16"
          height="16"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden="true"
        >
          {showPassword ? (
            <>
              <path d={eyeOffIconPath} />
            </>
          ) : (
            <path d={eyeIconPath} />
          )}
        </svg>
      </button>
    </div>
  );
}
