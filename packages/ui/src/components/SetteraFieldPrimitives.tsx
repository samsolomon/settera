import React from "react";
import { inputBaseStyle } from "./SetteraPrimitives.js";

export const fieldShellStyle: React.CSSProperties = {
  display: "flex",
  flexDirection: "column",
  gap: "4px",
  fontSize: "var(--settera-description-font-size, 13px)",
  color: "var(--settera-description-color, #4b5563)",
};

export const sectionPanelStyle: React.CSSProperties = {
  border: "1px solid #e5e7eb",
  borderRadius: "8px",
  padding: "8px",
  display: "flex",
  flexDirection: "column",
  gap: "8px",
};

export const stackGapStyle: React.CSSProperties = {
  display: "flex",
  flexDirection: "column",
  gap: "6px",
};

export const inlineRowStyle: React.CSSProperties = {
  display: "flex",
  alignItems: "center",
  gap: "8px",
};

export const smallCheckboxStyle: React.CSSProperties = {
  width: "16px",
  height: "16px",
};

export const smallActionButtonStyle: React.CSSProperties = {
  fontSize: "var(--settera-button-font-size, 13px)",
  padding: "4px 8px",
  borderRadius: "var(--settera-button-border-radius, 6px)",
};

export interface SelectOptionLike {
  value: string;
  label: string;
}

export function PrimitiveSelectControl({
  id,
  ariaLabel,
  value,
  options,
  onChange,
  disabled,
  onFocus,
  onBlur,
  focusVisible,
  style,
}: {
  id?: string;
  ariaLabel?: string;
  value: string;
  options: SelectOptionLike[];
  onChange: (nextValue: string) => void;
  disabled?: boolean;
  onFocus?: () => void;
  onBlur?: () => void;
  focusVisible?: boolean;
  style?: React.CSSProperties;
}) {
  return (
    <select
      id={id}
      aria-label={ariaLabel}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      disabled={disabled}
      onFocus={onFocus}
      onBlur={onBlur}
      style={{
        ...inputBaseStyle,
        border: "var(--settera-input-border, 1px solid #d1d5db)",
        outline: "none",
        boxShadow: focusVisible
          ? "0 0 0 2px var(--settera-focus-ring-color, #93c5fd)"
          : "none",
        ...style,
      }}
    >
      <option value="">Select...</option>
      {options.map((option) => (
        <option key={option.value} value={option.value}>
          {option.label}
        </option>
      ))}
    </select>
  );
}

export function PrimitiveCheckboxControl({
  id,
  ariaLabel,
  checked,
  onChange,
  disabled,
  style,
}: {
  id?: string;
  ariaLabel?: string;
  checked: boolean;
  onChange: (nextChecked: boolean) => void;
  disabled?: boolean;
  style?: React.CSSProperties;
}) {
  return (
    <input
      id={id}
      aria-label={ariaLabel}
      type="checkbox"
      checked={checked}
      onChange={(e) => onChange(e.target.checked)}
      disabled={disabled}
      style={{ ...smallCheckboxStyle, ...style }}
    />
  );
}

export function PrimitiveCheckboxList({
  options,
  selected,
  ariaLabel,
  disabled,
  onToggle,
  getAriaLabel,
  style,
}: {
  options: SelectOptionLike[];
  selected: string[];
  ariaLabel?: string;
  disabled?: boolean;
  onToggle: (optionValue: string, checked: boolean) => void;
  getAriaLabel?: (optionLabel: string) => string;
  style?: React.CSSProperties;
}) {
  return (
    <div aria-label={ariaLabel} style={{ ...stackGapStyle, ...style }}>
      {options.map((option) => {
        const checked = selected.includes(option.value);
        return (
          <label
            key={option.value}
            style={{ display: "inline-flex", alignItems: "center", gap: "6px" }}
          >
            <PrimitiveCheckboxControl
              ariaLabel={getAriaLabel?.(option.label)}
              checked={checked}
              disabled={disabled}
              onChange={(nextChecked) => onToggle(option.value, nextChecked)}
            />
            {option.label}
          </label>
        );
      })}
    </div>
  );
}
