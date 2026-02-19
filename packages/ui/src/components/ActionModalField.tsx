import React from "react";
import type { RepeatableSetting } from "@settera/schema";
import {
  getDefaultFieldValue,
  isObjectRecord,
  type ModalActionFieldSetting,
} from "@settera/react";
import {
  PrimitiveButton,
  PrimitiveInput,
} from "./SetteraPrimitives.js";
import {
  fieldShellStyle,
  sectionPanelStyle,
  smallActionButtonStyle,
  stackGapStyle,
} from "./SetteraFieldPrimitives.js";
import { FieldControl, fieldControlInputStyle } from "./FieldControl.js";

export interface ActionModalFieldProps {
  field: ModalActionFieldSetting;
  value: unknown;
  onChange: (nextValue: unknown) => void;
}

const actionModalInputStyle: React.CSSProperties = {
  width: "100%",
  boxSizing: "border-box",
};

export function ActionModalField({
  field,
  value,
  onChange,
}: ActionModalFieldProps) {
  // Leaf types — delegate to FieldControl
  if (
    field.type === "text" ||
    field.type === "number" ||
    field.type === "date" ||
    field.type === "select" ||
    field.type === "boolean" ||
    field.type === "multiselect"
  ) {
    return (
      <FieldControl
        field={field}
        value={value}
        onChange={onChange}
        ariaLabel={field.title}
        fullWidth
        inputStyle={actionModalInputStyle}
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
              style={{
                ...fieldControlInputStyle,
                ...actionModalInputStyle,
              }}
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
