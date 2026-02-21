import React, { useCallback, useState } from "react";
import { token } from "@settera/schema";
import { useSetteraSetting, useBufferedInput } from "@settera/react";
import { PrimitiveInput } from "./SetteraPrimitives.js";

export interface TextInputProps {
  settingKey: string;
}

// --- Password toggle icons (inline SVG, no icon library) ---

const eyeIconPath =
  "M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z M12 9a3 3 0 1 0 0 6 3 3 0 0 0 0-6z";
const eyeOffIconPath =
  "M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94 M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19 M1 1l22 22";

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

  const [showPassword, setShowPassword] = useState(false);
  const [toggleHovered, setToggleHovered] = useState(false);

  if (isPassword) {
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
          aria-label={definition.title}
          aria-invalid={hasError}
          aria-describedby={
            hasError ? `settera-error-${settingKey}` : undefined
          }
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
          onMouseEnter={() => setToggleHovered(true)}
          onMouseLeave={() => setToggleHovered(false)}
          aria-label={showPassword ? "Hide password" : "Show password"}
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            width: 28,
            height: 28,
            border: "none",
            borderRadius: token("input-border-radius"),
            background: toggleHovered
              ? token("sidebar-item-hover-bg")
              : "transparent",
            cursor: "pointer",
            marginRight: 4,
            color: token("description-color"),
            flexShrink: 0,
            transition: "background-color 120ms ease",
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
            <path d={showPassword ? eyeOffIconPath : eyeIconPath} />
          </svg>
        </button>
      </div>
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
