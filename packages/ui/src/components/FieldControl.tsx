import React, { useCallback, useState } from "react";
import {
  token,
  type CompoundFieldDefinition,
  type SelectSetting,
  type MultiSelectSetting,
  type TextSetting,
} from "@settera/schema";
import { useBufferedInput } from "@settera/react";
import {
  PrimitiveInput,
  inputBaseStyle,
} from "./SetteraPrimitives.js";
import {
  PrimitiveCheckboxControl,
  PrimitiveCheckboxList,
  PrimitiveSelectControl,
  smallCheckboxStyle,
  stackGapStyle,
} from "./SetteraFieldPrimitives.js";

export const fieldControlInputStyle: React.CSSProperties = {
  ...inputBaseStyle,
  border: token("input-border"),
  width: token("input-width"),
};

export interface FieldControlProps {
  field: CompoundFieldDefinition;
  value: unknown;
  onChange: (nextValue: unknown) => void;
  fieldId?: string;
  ariaLabel?: string;
  disabled?: boolean;
  readOnly?: boolean;
  showFocusRing?: boolean;
  fullWidth?: boolean;
  inputStyle?: React.CSSProperties;
}

export function FieldControl({
  field,
  value,
  onChange,
  fieldId,
  ariaLabel,
  disabled,
  readOnly,
  showFocusRing = false,
  fullWidth,
  inputStyle: inputStyleOverride,
}: FieldControlProps) {
  const effectiveInputStyle: React.CSSProperties = {
    ...fieldControlInputStyle,
    ...(fullWidth && { width: "100%" }),
    ...inputStyleOverride,
  };

  switch (field.type) {
    case "text":
      return (
        <FieldControlText
          field={field as TextSetting}
          value={value}
          onChange={onChange}
          fieldId={fieldId}
          ariaLabel={ariaLabel}
          disabled={disabled}
          readOnly={readOnly}
          showFocusRing={showFocusRing}
          inputStyle={effectiveInputStyle}
        />
      );
    case "number":
      return (
        <FieldControlNumber
          value={value}
          onChange={onChange}
          fieldId={fieldId}
          ariaLabel={ariaLabel}
          disabled={disabled}
          readOnly={readOnly}
          showFocusRing={showFocusRing}
          inputStyle={effectiveInputStyle}
        />
      );
    case "date":
      return (
        <FieldControlDate
          value={value}
          onChange={onChange}
          fieldId={fieldId}
          ariaLabel={ariaLabel}
          disabled={disabled}
          readOnly={readOnly}
          showFocusRing={showFocusRing}
          inputStyle={effectiveInputStyle}
        />
      );
    case "select":
      return (
        <FieldControlSelect
          field={field as SelectSetting}
          value={value}
          onChange={onChange}
          fieldId={fieldId}
          ariaLabel={ariaLabel}
          disabled={disabled}
          showFocusRing={showFocusRing}
          inputStyle={effectiveInputStyle}
        />
      );
    case "boolean":
      return (
        <PrimitiveCheckboxControl
          id={fieldId}
          aria-label={ariaLabel}
          checked={Boolean(value)}
          onChange={(nextChecked) => onChange(nextChecked)}
          disabled={disabled}
          style={smallCheckboxStyle}
        />
      );
    case "multiselect": {
      const multiField = field as MultiSelectSetting;
      const selected = Array.isArray(value)
        ? value.filter((item): item is string => typeof item === "string")
        : [];
      return (
        <PrimitiveCheckboxList
          options={multiField.options}
          selected={selected}
          disabled={disabled}
          style={stackGapStyle}
          getAriaLabel={
            ariaLabel
              ? (optionLabel) => `${ariaLabel} ${optionLabel}`
              : undefined
          }
          onToggle={(optionValue, checked) => {
            const next = checked
              ? [...selected, optionValue]
              : selected.filter((v) => v !== optionValue);
            onChange(next);
          }}
        />
      );
    }
    default:
      return null;
  }
}

// --- Internal leaf components ---

const eyeIconPath =
  "M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z M12 9a3 3 0 1 0 0 6 3 3 0 0 0 0-6z";
const eyeOffIconPath =
  "M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94 M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19 M1 1l22 22";

function FieldControlText({
  field,
  value,
  onChange,
  fieldId,
  ariaLabel,
  disabled,
  readOnly,
  showFocusRing,
  inputStyle,
}: {
  field: TextSetting;
  value: unknown;
  onChange: (nextValue: unknown) => void;
  fieldId?: string;
  ariaLabel?: string;
  disabled?: boolean;
  readOnly?: boolean;
  showFocusRing: boolean;
  inputStyle: React.CSSProperties;
}) {
  const committed = typeof value === "string" ? value : "";

  const onCommit = useCallback(
    (local: string) => {
      if (local !== committed) {
        onChange(local);
      }
    },
    [committed, onChange],
  );

  const { inputProps, isFocused } = useBufferedInput(committed, onCommit);
  const [showPassword, setShowPassword] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const isPassword = field.inputType === "password";

  if (isPassword) {
    return (
      <div
        style={{
          display: "flex",
          alignItems: "center",
          border: inputStyle.border,
          borderRadius: inputStyle.borderRadius ?? token("input-border-radius"),
          backgroundColor: inputStyle.backgroundColor ?? token("input-bg"),
          width: inputStyle.width,
          boxShadow: showFocusRing && isFocused
            ? `0 0 0 2px ${token("focus-ring-color")}`
            : "none",
        }}
      >
        <PrimitiveInput
          id={fieldId}
          aria-label={ariaLabel}
          type={showPassword ? "text" : "password"}
          {...inputProps}
          disabled={disabled}
          readOnly={readOnly}
          focusVisible={false}
          style={{
            ...inputStyle,
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
            width: 28,
            height: 28,
            border: "none",
            borderRadius: token("input-border-radius"),
            background: isHovered
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
            {showPassword ? (
              <path d={eyeOffIconPath} />
            ) : (
              <path d={eyeIconPath} />
            )}
          </svg>
        </button>
      </div>
    );
  }

  return (
    <PrimitiveInput
      id={fieldId}
      aria-label={ariaLabel}
      type={field.inputType ?? "text"}
      {...inputProps}
      disabled={disabled}
      readOnly={readOnly}
      focusVisible={showFocusRing && isFocused}
      style={inputStyle}
    />
  );
}

function FieldControlNumber({
  value,
  onChange,
  fieldId,
  ariaLabel,
  disabled,
  readOnly,
  showFocusRing,
  inputStyle,
}: {
  value: unknown;
  onChange: (nextValue: unknown) => void;
  fieldId?: string;
  ariaLabel?: string;
  disabled?: boolean;
  readOnly?: boolean;
  showFocusRing: boolean;
  inputStyle: React.CSSProperties;
}) {
  const committed =
    value !== undefined && value !== null ? String(value) : "";

  const onCommit = useCallback(
    (local: string) => {
      if (local === "") {
        if (committed !== "") {
          onChange(undefined);
        }
        return;
      }
      const num = Number(local);
      if (Number.isNaN(num)) return;
      if (local !== committed) {
        onChange(num);
      }
    },
    [committed, onChange],
  );

  const { inputProps, isFocused } = useBufferedInput(committed, onCommit);

  return (
    <PrimitiveInput
      id={fieldId}
      aria-label={ariaLabel}
      type="number"
      {...inputProps}
      disabled={disabled}
      readOnly={readOnly}
      focusVisible={showFocusRing && isFocused}
      style={inputStyle}
    />
  );
}

function FieldControlDate({
  value,
  onChange,
  fieldId,
  ariaLabel,
  disabled,
  readOnly,
  showFocusRing,
  inputStyle,
}: {
  value: unknown;
  onChange: (nextValue: unknown) => void;
  fieldId?: string;
  ariaLabel?: string;
  disabled?: boolean;
  readOnly?: boolean;
  showFocusRing: boolean;
  inputStyle: React.CSSProperties;
}) {
  const [isFocused, setIsFocused] = useState(false);

  return (
    <PrimitiveInput
      id={fieldId}
      aria-label={ariaLabel}
      type="date"
      value={typeof value === "string" ? value : ""}
      onChange={(e) => onChange(e.target.value)}
      onFocus={() => setIsFocused(true)}
      onBlur={() => setIsFocused(false)}
      disabled={disabled}
      readOnly={readOnly}
      focusVisible={showFocusRing && isFocused}
      style={inputStyle}
    />
  );
}

function FieldControlSelect({
  field,
  value,
  onChange,
  fieldId,
  ariaLabel,
  disabled,
  showFocusRing,
  inputStyle,
}: {
  field: SelectSetting;
  value: unknown;
  onChange: (nextValue: unknown) => void;
  fieldId?: string;
  ariaLabel?: string;
  disabled?: boolean;
  showFocusRing: boolean;
  inputStyle: React.CSSProperties;
}) {
  const [isFocused, setIsFocused] = useState(false);

  return (
    <PrimitiveSelectControl
      id={fieldId}
      aria-label={ariaLabel}
      value={typeof value === "string" ? value : ""}
      options={field.options}
      onChange={(nextValue) => onChange(nextValue)}
      onFocus={() => setIsFocused(true)}
      onBlur={() => setIsFocused(false)}
      focusVisible={showFocusRing && isFocused}
      disabled={disabled}
      style={inputStyle}
    />
  );
}
