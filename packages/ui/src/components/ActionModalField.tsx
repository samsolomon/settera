import React, { useCallback, useEffect, useState } from "react";
import type { RepeatableSetting, TextSetting } from "@settera/schema";
import {
  getDefaultFieldValue,
  isObjectRecord,
  type ModalActionFieldSetting,
} from "./actionModalUtils.js";

export interface ActionModalFieldProps {
  field: ModalActionFieldSetting;
  value: unknown;
  onChange: (nextValue: unknown) => void;
}

const inputStyle: React.CSSProperties = {
  fontSize: "var(--settera-input-font-size, 14px)",
  padding: "var(--settera-input-padding, 6px 10px)",
  borderRadius: "var(--settera-input-border-radius, 6px)",
  border: "var(--settera-input-border, 1px solid #d1d5db)",
  width: "100%",
  color: "var(--settera-input-color, #111827)",
  backgroundColor: "var(--settera-input-bg, white)",
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
    <input
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
      <input
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
      <input
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
      <select
        aria-label={field.title}
        value={typeof value === "string" ? value : ""}
        onChange={(e) => onChange(e.target.value)}
        style={inputStyle}
      >
        <option value="">Select...</option>
        {field.options.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>
    );
  }

  if (field.type === "boolean") {
    return (
      <input
        aria-label={field.title}
        type="checkbox"
        checked={Boolean(value)}
        onChange={(e) => onChange(e.target.checked)}
        style={{ width: "16px", height: "16px" }}
      />
    );
  }

  if (field.type === "multiselect") {
    const selected = Array.isArray(value)
      ? value.filter((item): item is string => typeof item === "string")
      : [];

    return (
      <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
        {field.options.map((opt) => {
          const checked = selected.includes(opt.value);
          return (
            <label
              key={opt.value}
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "6px",
              }}
            >
              <input
                aria-label={`${field.title} ${opt.label}`}
                type="checkbox"
                checked={checked}
                onChange={(e) => {
                  const next = e.target.checked
                    ? [...selected, opt.value]
                    : selected.filter((v) => v !== opt.value);
                  onChange(next);
                }}
              />
              {opt.label}
            </label>
          );
        })}
      </div>
    );
  }

  if (field.type === "compound") {
    const obj = isObjectRecord(value)
      ? value
      : (getDefaultFieldValue(field) as Record<string, unknown>);

    return (
      <div
        style={{
          border: "1px solid #e5e7eb",
          borderRadius: "8px",
          padding: "8px",
          display: "flex",
          flexDirection: "column",
          gap: "8px",
        }}
      >
        {field.fields.map((subField) => (
          <label
            key={subField.key}
            style={{
              display: "flex",
              flexDirection: "column",
              gap: "4px",
              fontSize: "13px",
            }}
          >
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
      <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
        {items.map((item, index) => (
          <div
            key={`${repeatableField.key}-${index}`}
            style={{ display: "flex", alignItems: "center", gap: "8px" }}
          >
            <input
              aria-label={`${field.title} item ${index + 1}`}
              value={typeof item === "string" ? item : ""}
              onChange={(e) => {
                const next = [...items];
                next[index] = e.target.value;
                onChange(next);
              }}
              style={inputStyle}
            />
            <button
              type="button"
              onClick={() => {
                onChange(items.filter((_, i) => i !== index));
              }}
            >
              Remove
            </button>
          </div>
        ))}
        <button type="button" onClick={() => onChange([...items, ""])}>
          Add item
        </button>
      </div>
    );
  }

  const compoundItemFields = repeatableField.itemFields ?? [];

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
      {items.map((item, index) => {
        const itemObj = isObjectRecord(item) ? item : {};
        return (
          <div
            key={`${repeatableField.key}-${index}`}
            style={{
              border: "1px solid #e5e7eb",
              borderRadius: "8px",
              padding: "8px",
              display: "flex",
              flexDirection: "column",
              gap: "8px",
            }}
          >
            {compoundItemFields.map((itemField) => (
              <label
                key={`${index}-${itemField.key}`}
                style={{
                  display: "flex",
                  flexDirection: "column",
                  gap: "4px",
                  fontSize: "13px",
                }}
              >
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
            <button
              type="button"
              onClick={() => onChange(items.filter((_, i) => i !== index))}
            >
              Remove
            </button>
          </div>
        );
      })}
      <button
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
      >
        Add item
      </button>
    </div>
  );
}
