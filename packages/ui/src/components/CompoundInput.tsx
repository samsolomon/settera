import React, {
  useMemo,
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";
import { useSetteraSetting } from "@settera/react";
import type {
  CompoundSetting,
  BooleanSetting,
  SelectSetting,
  MultiSelectSetting,
} from "@settera/schema";

export interface CompoundInputProps {
  settingKey: string;
}

type CompoundField = CompoundSetting["fields"][number];

function isObjectRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

export function CompoundInput({ settingKey }: CompoundInputProps) {
  const { value, setValue, error, definition, validate } =
    useSetteraSetting(settingKey);

  if (definition.type !== "compound") {
    return null;
  }

  const compoundValue = useMemo(
    () => (isObjectRecord(value) ? value : {}),
    [value],
  );

  const effectiveValue = useMemo(() => {
    const merged: Record<string, unknown> = {};
    for (const field of definition.fields) {
      if ("default" in field && field.default !== undefined) {
        merged[field.key] = field.default;
      }
    }
    return { ...merged, ...compoundValue };
  }, [compoundValue, definition.fields]);

  const getFieldValue = useCallback(
    (field: CompoundField): unknown => {
      return effectiveValue[field.key];
    },
    [effectiveValue],
  );

  const updateField = useCallback(
    (fieldKey: string, nextFieldValue: unknown) => {
      const nextValue = { ...effectiveValue, [fieldKey]: nextFieldValue };
      setValue(nextValue);
      validate(nextValue);
    },
    [effectiveValue, setValue, validate],
  );

  return (
    <div
      data-testid={`compound-${settingKey}`}
      aria-invalid={error !== null}
      aria-describedby={
        error !== null ? `settera-error-${settingKey}` : undefined
      }
      style={{
        display: "flex",
        flexDirection: "column",
        gap: "var(--settera-compound-gap, 10px)",
      }}
    >
      {definition.fields.map((field) => {
        const fieldId = `settera-compound-${settingKey}-${field.key}`;
        const fieldValue = getFieldValue(field);

        return (
          <label
            key={field.key}
            htmlFor={fieldId}
            style={{
              display: "flex",
              flexDirection: "column",
              gap: "4px",
              fontSize: "var(--settera-description-font-size, 13px)",
              color: "var(--settera-description-color, #4b5563)",
            }}
          >
            {field.title}
            {renderFieldControl(field, fieldId, fieldValue, updateField)}
          </label>
        );
      })}
    </div>
  );
}

function renderFieldControl(
  field: CompoundField,
  fieldId: string,
  fieldValue: unknown,
  onChange: (fieldKey: string, value: unknown) => void,
) {
  switch (field.type) {
    case "boolean":
      return renderBooleanField(field, fieldId, fieldValue, onChange);
    case "text":
      return (
        <CompoundTextField
          field={field}
          fieldId={fieldId}
          fieldValue={fieldValue}
          onChange={onChange}
        />
      );
    case "number":
      return (
        <CompoundNumberField
          field={field}
          fieldId={fieldId}
          fieldValue={fieldValue}
          onChange={onChange}
        />
      );
    case "date":
      return (
        <CompoundDateField
          field={field}
          fieldId={fieldId}
          fieldValue={fieldValue}
          onChange={onChange}
        />
      );
    case "select":
      return (
        <CompoundSelectField
          field={field}
          fieldId={fieldId}
          fieldValue={fieldValue}
          onChange={onChange}
        />
      );
    case "multiselect":
      return renderMultiSelectField(field, fieldId, fieldValue, onChange);
    default:
      return null;
  }
}

function CompoundTextField({
  field,
  fieldId,
  fieldValue,
  onChange,
}: {
  field: Extract<CompoundField, { type: "text" }>;
  fieldId: string;
  fieldValue: unknown;
  onChange: (fieldKey: string, value: unknown) => void;
}) {
  const committed = typeof fieldValue === "string" ? fieldValue : "";
  const [localValue, setLocalValue] = useState(committed);
  const [isFocused, setIsFocused] = useState(false);
  const localRef = useRef(localValue);
  const focusedRef = useRef(false);

  useEffect(() => {
    if (!focusedRef.current) {
      const next = typeof fieldValue === "string" ? fieldValue : "";
      localRef.current = next;
      setLocalValue(next);
    }
  }, [fieldValue]);

  const commit = useCallback(() => {
    const next = localRef.current;
    if (next !== committed) {
      onChange(field.key, next);
    }
  }, [committed, field.key, onChange]);

  return (
    <input
      id={fieldId}
      type={field.inputType ?? "text"}
      value={localValue}
      onChange={(e) => {
        localRef.current = e.target.value;
        setLocalValue(e.target.value);
      }}
      onFocus={() => {
        setIsFocused(true);
        focusedRef.current = true;
      }}
      onBlur={() => {
        setIsFocused(false);
        focusedRef.current = false;
        commit();
      }}
      onKeyDown={(e) => {
        if (e.key === "Enter") {
          commit();
        } else if (e.key === "Escape") {
          localRef.current = committed;
          setLocalValue(committed);
        }
      }}
      style={{
        ...inputStyles,
        boxShadow: isFocused
          ? "0 0 0 2px var(--settera-focus-ring-color, #93c5fd)"
          : "none",
      }}
    />
  );
}

function CompoundNumberField({
  field,
  fieldId,
  fieldValue,
  onChange,
}: {
  field: Extract<CompoundField, { type: "number" }>;
  fieldId: string;
  fieldValue: unknown;
  onChange: (fieldKey: string, value: unknown) => void;
}) {
  const committed =
    fieldValue !== undefined && fieldValue !== null ? String(fieldValue) : "";
  const [localValue, setLocalValue] = useState(committed);
  const [isFocused, setIsFocused] = useState(false);
  const localRef = useRef(localValue);
  const focusedRef = useRef(false);

  useEffect(() => {
    if (!focusedRef.current) {
      const next =
        fieldValue !== undefined && fieldValue !== null
          ? String(fieldValue)
          : "";
      localRef.current = next;
      setLocalValue(next);
    }
  }, [fieldValue]);

  const commit = useCallback(() => {
    const next = localRef.current;
    if (next === "") {
      if (committed !== "") {
        onChange(field.key, undefined);
      }
      return;
    }

    const num = Number(next);
    if (Number.isNaN(num)) return;
    if (next !== committed) {
      onChange(field.key, num);
    }
  }, [committed, field.key, onChange]);

  return (
    <input
      id={fieldId}
      type="number"
      value={localValue}
      onChange={(e) => {
        localRef.current = e.target.value;
        setLocalValue(e.target.value);
      }}
      onFocus={() => {
        setIsFocused(true);
        focusedRef.current = true;
      }}
      onBlur={() => {
        setIsFocused(false);
        focusedRef.current = false;
        commit();
      }}
      onKeyDown={(e) => {
        if (e.key === "Enter") {
          commit();
        } else if (e.key === "Escape") {
          localRef.current = committed;
          setLocalValue(committed);
        }
      }}
      style={{
        ...inputStyles,
        boxShadow: isFocused
          ? "0 0 0 2px var(--settera-focus-ring-color, #93c5fd)"
          : "none",
      }}
    />
  );
}

function CompoundDateField({
  field,
  fieldId,
  fieldValue,
  onChange,
}: {
  field: Extract<CompoundField, { type: "date" }>;
  fieldId: string;
  fieldValue: unknown;
  onChange: (fieldKey: string, value: unknown) => void;
}) {
  const [isFocused, setIsFocused] = useState(false);

  return (
    <input
      id={fieldId}
      type="date"
      value={typeof fieldValue === "string" ? fieldValue : ""}
      onChange={(e) => onChange(field.key, e.target.value)}
      onFocus={() => setIsFocused(true)}
      onBlur={() => setIsFocused(false)}
      style={{
        ...inputStyles,
        boxShadow: isFocused
          ? "0 0 0 2px var(--settera-focus-ring-color, #93c5fd)"
          : "none",
      }}
    />
  );
}

function CompoundSelectField({
  field,
  fieldId,
  fieldValue,
  onChange,
}: {
  field: SelectSetting;
  fieldId: string;
  fieldValue: unknown;
  onChange: (fieldKey: string, value: unknown) => void;
}) {
  const [isFocused, setIsFocused] = useState(false);

  return (
    <select
      id={fieldId}
      value={typeof fieldValue === "string" ? fieldValue : ""}
      onChange={(e) => onChange(field.key, e.target.value)}
      onFocus={() => setIsFocused(true)}
      onBlur={() => setIsFocused(false)}
      style={{
        ...inputStyles,
        boxShadow: isFocused
          ? "0 0 0 2px var(--settera-focus-ring-color, #93c5fd)"
          : "none",
      }}
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

function renderBooleanField(
  field: BooleanSetting,
  fieldId: string,
  fieldValue: unknown,
  onChange: (fieldKey: string, value: unknown) => void,
) {
  return (
    <input
      id={fieldId}
      type="checkbox"
      checked={Boolean(fieldValue)}
      onChange={(e) => onChange(field.key, e.target.checked)}
      style={{
        width: "var(--settera-checkbox-size, 16px)",
        height: "var(--settera-checkbox-size, 16px)",
      }}
    />
  );
}

function renderMultiSelectField(
  field: MultiSelectSetting,
  fieldId: string,
  fieldValue: unknown,
  onChange: (fieldKey: string, value: unknown) => void,
) {
  const selected = Array.isArray(fieldValue)
    ? fieldValue.filter((item): item is string => typeof item === "string")
    : [];

  return (
    <div
      id={fieldId}
      style={{ display: "flex", flexDirection: "column", gap: "4px" }}
    >
      {field.options.map((opt) => {
        const checked = selected.includes(opt.value);
        return (
          <label
            key={opt.value}
            style={{ display: "inline-flex", alignItems: "center", gap: "6px" }}
          >
            <input
              type="checkbox"
              checked={checked}
              onChange={(e) => {
                const next = e.target.checked
                  ? [...selected, opt.value]
                  : selected.filter((v) => v !== opt.value);
                onChange(field.key, next);
              }}
            />
            {opt.label}
          </label>
        );
      })}
    </div>
  );
}

const inputStyles: React.CSSProperties = {
  fontSize: "var(--settera-input-font-size, 14px)",
  padding: "var(--settera-input-padding, 6px 10px)",
  borderRadius: "var(--settera-input-border-radius, 6px)",
  border: "var(--settera-input-border, 1px solid #d1d5db)",
  width: "var(--settera-input-width, 200px)",
  color: "var(--settera-input-color, #111827)",
  backgroundColor: "var(--settera-input-bg, white)",
};
