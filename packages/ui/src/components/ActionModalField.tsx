import React, { useCallback, useEffect, useState } from "react";
import type { RepeatableSetting, TextSetting } from "@settera/schema";
import {
  getDefaultFieldValue,
  isObjectRecord,
  type ModalActionFieldSetting,
} from "./actionModalUtils.js";
import {
  PrimitiveButton,
  PrimitiveInput,
  inputBaseStyle,
} from "./SetteraPrimitives.js";
import {
  fieldShellStyle,
  PrimitiveCheckboxControl,
  PrimitiveCheckboxList,
  PrimitiveSelectControl,
  sectionPanelStyle,
  smallActionButtonStyle,
  smallCheckboxStyle,
  stackGapStyle,
} from "./SetteraFieldPrimitives.js";

export interface ActionModalFieldProps {
  field: ModalActionFieldSetting;
  value: unknown;
  onChange: (nextValue: unknown) => void;
}

const inputStyle: React.CSSProperties = {
  ...inputBaseStyle,
  border: "var(--settera-input-border, 1px solid #d1d5db)",
  width: "100%",
  boxSizing: "border-box",
};

function ActionModalNumberField({
  title,
  value,
  onChange,
}: {
  title: string;
  value: unknown;
  onChange: (nextValue: unknown) => void;
}) {
  const committed =
    value !== undefined && value !== null && !Number.isNaN(Number(value))
      ? String(value)
      : "";
  const [draft, setDraft] = useState(committed);

  useEffect(() => {
    setDraft(committed);
  }, [committed]);

  const commit = useCallback(() => {
    if (draft.trim() === "") {
      onChange(undefined);
      return;
    }
    const parsed = Number(draft);
    if (!Number.isNaN(parsed)) {
      onChange(parsed);
    }
  }, [draft, onChange]);

  return (
    <PrimitiveInput
      aria-label={title}
      type="number"
      value={draft}
      onChange={(e) => setDraft(e.target.value)}
      onBlur={commit}
      onKeyDown={(e) => {
        if (e.key === "Enter") {
          commit();
        }
      }}
      style={inputStyle}
    />
  );
}

export function ActionModalField({
  field,
  value,
  onChange,
}: ActionModalFieldProps) {
  if (field.type === "text") {
    const textField = field as TextSetting;
    return (
      <PrimitiveInput
        aria-label={field.title}
        type={textField.inputType ?? "text"}
        value={typeof value === "string" ? value : ""}
        onChange={(e) => onChange(e.target.value)}
        style={inputStyle}
      />
    );
  }

  if (field.type === "number") {
    return (
      <ActionModalNumberField
        title={field.title}
        value={value}
        onChange={onChange}
      />
    );
  }

  if (field.type === "date") {
    return (
      <PrimitiveInput
        aria-label={field.title}
        type="date"
        value={typeof value === "string" ? value : ""}
        onChange={(e) => onChange(e.target.value)}
        style={inputStyle}
      />
    );
  }

  if (field.type === "select") {
    return (
      <PrimitiveSelectControl
        ariaLabel={field.title}
        value={typeof value === "string" ? value : ""}
        options={field.options}
        onChange={(nextValue) => onChange(nextValue)}
        style={inputStyle}
      />
    );
  }

  if (field.type === "boolean") {
    return (
      <PrimitiveCheckboxControl
        ariaLabel={field.title}
        checked={Boolean(value)}
        onChange={(nextChecked) => onChange(nextChecked)}
        style={smallCheckboxStyle}
      />
    );
  }

  if (field.type === "multiselect") {
    const selected = Array.isArray(value)
      ? value.filter((item): item is string => typeof item === "string")
      : [];

    return (
      <PrimitiveCheckboxList
        options={field.options}
        selected={selected}
        style={stackGapStyle}
        getAriaLabel={(optionLabel) => `${field.title} ${optionLabel}`}
        onToggle={(optionValue, checked) => {
          const next = checked
            ? [...selected, optionValue]
            : selected.filter((v) => v !== optionValue);
          onChange(next);
        }}
      />
    );
  }

  if (field.type === "compound") {
    const obj = isObjectRecord(value)
      ? value
      : (getDefaultFieldValue(field) as Record<string, unknown>);

    return (
      <div style={sectionPanelStyle}>
        {field.fields.map((subField) => (
          <label key={subField.key} style={fieldShellStyle}>
            {subField.title}
            <ActionModalField
              field={subField as ModalActionFieldSetting}
              value={obj[subField.key]}
              onChange={(nextSubValue) => {
                onChange({ ...obj, [subField.key]: nextSubValue });
              }}
            />
          </label>
        ))}
      </div>
    );
  }

  const repeatableField = field as RepeatableSetting;
  const items = Array.isArray(value) ? value : [];

  if (repeatableField.itemType === "text") {
    return (
      <div style={stackGapStyle}>
        {items.map((item, index) => (
          <div
            key={`${repeatableField.key}-${index}`}
            style={{ display: "flex", alignItems: "center", gap: "8px" }}
          >
            <PrimitiveInput
              aria-label={`${field.title} item ${index + 1}`}
              value={typeof item === "string" ? item : ""}
              onChange={(e) => {
                const next = [...items];
                next[index] = e.target.value;
                onChange(next);
              }}
              style={inputStyle}
            />
            <PrimitiveButton
              type="button"
              onClick={() => {
                onChange(items.filter((_, i) => i !== index));
              }}
              style={smallActionButtonStyle}
            >
              Remove
            </PrimitiveButton>
          </div>
        ))}
        <PrimitiveButton
          type="button"
          onClick={() => onChange([...items, ""])}
          style={smallActionButtonStyle}
        >
          Add item
        </PrimitiveButton>
      </div>
    );
  }

  const compoundItemFields = repeatableField.itemFields ?? [];

  return (
    <div style={stackGapStyle}>
      {items.map((item, index) => {
        const itemObj = isObjectRecord(item) ? item : {};
        return (
          <div
            key={`${repeatableField.key}-${index}`}
            style={sectionPanelStyle}
          >
            {compoundItemFields.map((itemField) => (
              <label key={`${index}-${itemField.key}`} style={fieldShellStyle}>
                {itemField.title}
                <ActionModalField
                  field={itemField as ModalActionFieldSetting}
                  value={itemObj[itemField.key]}
                  onChange={(nextSubValue) => {
                    const next = [...items];
                    next[index] = { ...itemObj, [itemField.key]: nextSubValue };
                    onChange(next);
                  }}
                />
              </label>
            ))}
            <PrimitiveButton
              type="button"
              onClick={() => onChange(items.filter((_, i) => i !== index))}
              style={smallActionButtonStyle}
            >
              Remove
            </PrimitiveButton>
          </div>
        );
      })}
      <PrimitiveButton
        type="button"
        onClick={() => {
          const defaults: Record<string, unknown> = {};
          for (const itemField of compoundItemFields) {
            defaults[itemField.key] = getDefaultFieldValue(
              itemField as ModalActionFieldSetting,
            );
          }
          onChange([...items, defaults]);
        }}
        style={smallActionButtonStyle}
      >
        Add item
      </PrimitiveButton>
    </div>
  );
}
