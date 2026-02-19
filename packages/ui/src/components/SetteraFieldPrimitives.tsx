import React from "react";
import * as CheckboxPrimitive from "@radix-ui/react-checkbox";
import { inputBaseStyle } from "./SetteraPrimitives.js";

export const fieldShellStyle: React.CSSProperties = {
  display: "flex",
  flexDirection: "column",
  gap: "4px",
  fontSize: "var(--settera-description-font-size, 13px)",
  color: "var(--settera-description-color, #4b5563)",
};

export const sectionPanelStyle: React.CSSProperties = {
  border: "var(--settera-card-border, 1px solid #e5e7eb)",
  borderRadius: "var(--settera-card-border-radius, 8px)",
  backgroundColor: "var(--settera-card-bg, white)",
  padding: "8px",
  display: "flex",
  flexDirection: "column",
  gap: "8px",
};

export const cardShellStyle: React.CSSProperties = {
  border: "var(--settera-card-border, 1px solid #e5e7eb)",
  borderRadius: "var(--settera-card-border-radius, 10px)",
  backgroundColor: "var(--settera-card-bg, white)",
  overflow: "hidden",
};

export const sectionHeadingRowStyle: React.CSSProperties = {
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
  gap: "8px",
  marginBottom: "var(--settera-section-title-margin-bottom, 8px)",
};

export const sectionTitleStyle: React.CSSProperties = {
  fontSize: "var(--settera-section-title-font-size, 16px)",
  fontWeight: "var(--settera-section-title-font-weight, 600)",
  color: "var(--settera-section-title-color, #111827)",
  margin: 0,
};

export const descriptionTextStyle: React.CSSProperties = {
  fontSize: "var(--settera-description-font-size, 13px)",
  color: "var(--settera-description-color, #6b7280)",
};

export const mutedMessageStyle: React.CSSProperties = {
  fontSize: "var(--settera-description-font-size, 13px)",
  color: "var(--settera-description-color, #6b7280)",
  fontStyle: "italic",
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
  width: "var(--settera-checkbox-size, 16px)",
  height: "var(--settera-checkbox-size, 16px)",
};

export const smallActionButtonStyle: React.CSSProperties = {
  fontSize: "var(--settera-button-font-size, 13px)",
  padding: "4px 8px",
  borderRadius: "var(--settera-button-border-radius, 6px)",
  border: "var(--settera-button-border, 1px solid #d1d5db)",
  backgroundColor: "var(--settera-button-bg, white)",
  color: "var(--settera-button-color, #374151)",
};

export interface SelectOptionLike {
  value: string;
  label: string;
}

type PrimitiveSelectControlProps = Omit<
  React.SelectHTMLAttributes<HTMLSelectElement>,
  "value" | "onChange"
> & {
  value: string;
  options: SelectOptionLike[];
  onChange: (nextValue: string) => void;
  focusVisible?: boolean;
};

export function PrimitiveSelectControl({
  value,
  options,
  onChange,
  focusVisible,
  style,
  ...props
}: PrimitiveSelectControlProps) {
  return (
    <select
      {...props}
      data-slot="select"
      value={value}
      onChange={(e) => onChange(e.target.value)}
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
  checked,
  onChange,
  disabled,
  style,
  ...props
}: {
  checked: boolean;
  onChange: (nextChecked: boolean) => void;
  disabled?: boolean;
  id?: string;
  style?: React.CSSProperties;
  "aria-label"?: string;
}) {
  return (
    <CheckboxPrimitive.Root
      {...props}
      data-slot="checkbox"
      checked={checked}
      disabled={disabled}
      onCheckedChange={(c) => onChange(c === true)}
      style={{
        ...smallCheckboxStyle,
        flexShrink: 0,
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        border: checked
          ? "var(--settera-checkbox-checked-border, 1px solid var(--settera-checkbox-checked-bg, #18181b))"
          : "var(--settera-checkbox-border, 1px solid #d1d5db)",
        backgroundColor: checked
          ? "var(--settera-checkbox-checked-bg, #18181b)"
          : "var(--settera-checkbox-bg, #ffffff)",
        borderRadius: "var(--settera-checkbox-border-radius, 4px)",
        boxShadow: "var(--settera-checkbox-shadow, 0 1px 2px rgba(0, 0, 0, 0.05))",
        outline: "none",
        cursor: disabled ? "not-allowed" : "pointer",
        opacity: disabled ? 0.5 : 1,
        transition: "box-shadow 150ms, background-color 150ms, border-color 150ms",
        ...style,
      }}
    >
      <CheckboxPrimitive.Indicator
        data-slot="checkbox-indicator"
        style={{
          display: "grid",
          placeContent: "center",
          color: "var(--settera-checkbox-indicator-color, #ffffff)",
        }}
      >
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
          <polyline points="20 6 9 17 4 12" />
        </svg>
      </CheckboxPrimitive.Indicator>
    </CheckboxPrimitive.Root>
  );
}

export function PrimitiveCheckboxList({
  options,
  selected,
  "aria-label": ariaLabel,
  disabled,
  onToggle,
  getAriaLabel,
  style,
  ...props
}: {
  options: SelectOptionLike[];
  selected: string[];
  disabled?: boolean;
  onToggle: (optionValue: string, checked: boolean) => void;
  getAriaLabel?: (optionLabel: string) => string;
  style?: React.CSSProperties;
} & React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      {...props}
      data-slot="checkbox-list"
      aria-label={ariaLabel}
      style={{ ...stackGapStyle, ...style }}
    >
      {options.map((option) => {
        const checked = selected.includes(option.value);
        return (
          <label
            key={option.value}
            style={{ display: "inline-flex", alignItems: "center", gap: "6px" }}
          >
            <PrimitiveCheckboxControl
              aria-label={getAriaLabel?.(option.label)}
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
