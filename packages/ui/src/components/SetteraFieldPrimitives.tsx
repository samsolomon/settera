import React from "react";
import * as CheckboxPrimitive from "@radix-ui/react-checkbox";
import { token } from "@settera/schema";
import { inputBaseStyle } from "./SetteraPrimitives.js";

export const fieldShellStyle: React.CSSProperties = {
  display: "flex",
  flexDirection: "column",
  gap: token("space-50"),
  fontSize: token("description-font-size"),
  color: token("description-color"),
};

export const sectionPanelStyle: React.CSSProperties = {
  border: token("card-border"),
  borderRadius: token("card-border-radius"),
  backgroundColor: token("card-bg"),
  padding: token("space-100"),
  display: "flex",
  flexDirection: "column",
  gap: token("space-100"),
};

export const cardShellStyle: React.CSSProperties = {
  border: token("card-border"),
  borderRadius: token("card-border-radius"),
  backgroundColor: token("card-bg"),
  overflow: "hidden",
};

export const sectionHeadingRowStyle: React.CSSProperties = {
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
  gap: "8px",
  marginBottom: token("section-title-margin-bottom"),
};

export const sectionTitleStyle: React.CSSProperties = {
  fontSize: token("section-title-font-size"),
  fontWeight: token("section-title-font-weight"),
  color: token("section-title-color"),
  margin: 0,
};

export const descriptionTextStyle: React.CSSProperties = {
  fontSize: token("description-font-size"),
  color: token("description-color"),
};

export const mutedMessageStyle: React.CSSProperties = {
  fontSize: token("description-font-size"),
  color: token("description-color"),
  fontStyle: "italic",
};

export const stackGapStyle: React.CSSProperties = {
  display: "flex",
  flexDirection: "column",
  gap: token("space-100"),
};

export const inlineRowStyle: React.CSSProperties = {
  display: "flex",
  alignItems: "center",
  gap: token("space-100"),
};

export const smallCheckboxStyle: React.CSSProperties = {
  width: token("checkbox-size"),
  height: token("checkbox-size"),
};

export const smallActionButtonStyle: React.CSSProperties = {
  fontSize: token("button-font-size"),
  padding: `${token("space-50")} ${token("space-100")}`,
  borderRadius: token("button-border-radius"),
  border: token("button-border"),
  backgroundColor: token("button-bg"),
  color: token("button-color"),
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
        border: token("input-border"),
        outline: "none",
        boxShadow: focusVisible
          ? `0 0 0 2px ${token("focus-ring-color")}`
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
          ? token("checkbox-checked-border")
          : token("checkbox-border"),
        backgroundColor: checked
          ? token("checkbox-checked-bg")
          : token("checkbox-bg"),
        borderRadius: token("checkbox-border-radius"),
        boxShadow: token("checkbox-shadow"),
        outline: "none",
        cursor: disabled ? "not-allowed" : "pointer",
        opacity: disabled ? token("disabled-opacity") : 1,
        transition: "box-shadow 120ms, background-color 120ms, border-color 120ms",
        ...style,
      }}
    >
      <CheckboxPrimitive.Indicator
        data-slot="checkbox-indicator"
        style={{
          display: "grid",
          placeContent: "center",
          color: token("checkbox-indicator-color"),
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
            style={{ display: "inline-flex", alignItems: "center", gap: token("space-100") }}
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
