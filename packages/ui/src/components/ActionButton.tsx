import React, { useCallback, useEffect, useMemo, useState } from "react";
import * as Dialog from "@radix-ui/react-dialog";
import { useSetteraAction } from "@settera/react";
import type {
  ActionSetting,
  CompoundSetting,
  RepeatableSetting,
  TextSetting,
  NumberSetting,
  BooleanSetting,
  SelectSetting,
  MultiSelectSetting,
  DateSetting,
} from "@settera/schema";
import { ControlButton } from "./ControlPrimitives.js";
import { useFocusVisible } from "../hooks/useFocusVisible.js";

export interface ActionButtonProps {
  settingKey: string;
}

type ModalActionFieldSetting =
  | TextSetting
  | NumberSetting
  | BooleanSetting
  | SelectSetting
  | MultiSelectSetting
  | DateSetting
  | CompoundSetting
  | RepeatableSetting;

function getDefaultFieldValue(field: ModalActionFieldSetting): unknown {
  if ("default" in field && field.default !== undefined) {
    return field.default;
  }

  switch (field.type) {
    case "boolean":
      return false;
    case "multiselect":
      return [];
    case "compound": {
      const defaults: Record<string, unknown> = {};
      for (const subField of field.fields) {
        defaults[subField.key] = getDefaultFieldValue(
          subField as ModalActionFieldSetting,
        );
      }
      return defaults;
    }
    case "repeatable":
      return Array.isArray(field.default) ? field.default : [];
    default:
      return "";
  }
}

function buildModalDraft(
  fields: ModalActionFieldSetting[],
  initialValues?: Record<string, unknown>,
) {
  const defaults: Record<string, unknown> = {};
  for (const field of fields) {
    defaults[field.key] = getDefaultFieldValue(field);
  }
  return { ...defaults, ...(initialValues ?? {}) };
}

function isObjectRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function ActionModalField({
  field,
  value,
  onChange,
}: {
  field: ModalActionFieldSetting;
  value: unknown;
  onChange: (nextValue: unknown) => void;
}) {
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

  if (field.type === "text") {
    return (
      <input
        aria-label={field.title}
        type={field.inputType ?? "text"}
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
        inputStyle={inputStyle}
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

function ActionModalNumberField({
  title,
  value,
  onChange,
  inputStyle,
}: {
  title: string;
  value: unknown;
  onChange: (nextValue: unknown) => void;
  inputStyle: React.CSSProperties;
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

/**
 * A button for action-type settings.
 * Callback actions execute directly, modal actions collect local draft values and
 * submit payload on explicit confirmation.
 */
export function ActionButton({ settingKey }: ActionButtonProps) {
  const { definition, onAction, isLoading } = useSetteraAction(settingKey);
  const { isFocusVisible, focusVisibleProps } = useFocusVisible();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [draftValues, setDraftValues] = useState<Record<string, unknown>>({});

  const isDangerous =
    "dangerous" in definition && Boolean(definition.dangerous);
  const buttonLabel =
    definition.type === "action" ? definition.buttonLabel : "Action";

  const actionDefinition = definition as ActionSetting;
  const modalConfig =
    actionDefinition.actionType === "modal"
      ? actionDefinition.modal
      : undefined;

  const modalDraftDefaults = useMemo(() => {
    if (!modalConfig) return {};
    return buildModalDraft(modalConfig.fields, modalConfig.initialValues);
  }, [modalConfig]);

  useEffect(() => {
    if (isModalOpen && modalConfig) {
      setDraftValues(modalDraftDefaults);
    }
  }, [isModalOpen, modalConfig, modalDraftDefaults]);

  const handleSubmitModal = useCallback(() => {
    if (!onAction) return;
    onAction(draftValues);
    setIsModalOpen(false);
  }, [draftValues, onAction]);

  if (actionDefinition.actionType !== "modal") {
    return (
      <ControlButton
        type="button"
        onClick={() => onAction?.()}
        {...focusVisibleProps}
        disabled={!onAction || isLoading}
        aria-label={definition.title}
        aria-busy={isLoading}
        isDangerous={isDangerous}
        isFocusVisible={isFocusVisible}
        style={{
          cursor: !onAction || isLoading ? "not-allowed" : "pointer",
          opacity: isLoading ? 0.7 : 1,
        }}
      >
        {isLoading ? "Loading…" : buttonLabel}
      </ControlButton>
    );
  }

  return (
    <Dialog.Root open={isModalOpen} onOpenChange={setIsModalOpen}>
      <Dialog.Trigger asChild>
        <ControlButton
          type="button"
          {...focusVisibleProps}
          disabled={!onAction || isLoading || !modalConfig}
          aria-label={definition.title}
          aria-busy={isLoading}
          isDangerous={isDangerous}
          isFocusVisible={isFocusVisible}
          style={{
            cursor:
              !onAction || isLoading || !modalConfig
                ? "not-allowed"
                : "pointer",
            opacity: isLoading ? 0.7 : 1,
          }}
        >
          {isLoading ? "Loading…" : buttonLabel}
        </ControlButton>
      </Dialog.Trigger>

      {modalConfig && (
        <Dialog.Portal>
          <Dialog.Overlay
            style={{
              position: "fixed",
              inset: 0,
              backgroundColor: "var(--settera-overlay-bg, rgba(0, 0, 0, 0.5))",
              zIndex: 1000,
            }}
          />
          <Dialog.Content
            aria-label={modalConfig.title ?? definition.title}
            onEscapeKeyDown={(e) => e.stopPropagation()}
            style={{
              position: "fixed",
              top: "50%",
              left: "50%",
              transform: "translate(-50%, -50%)",
              backgroundColor: "var(--settera-dialog-bg, white)",
              borderRadius: "var(--settera-dialog-border-radius, 8px)",
              padding: "var(--settera-dialog-padding, 20px)",
              maxWidth: "640px",
              width: "calc(100% - 24px)",
              maxHeight: "calc(100vh - 40px)",
              overflow: "auto",
              boxShadow:
                "var(--settera-dialog-shadow, 0 20px 60px rgba(0, 0, 0, 0.15))",
              zIndex: 1001,
            }}
          >
            <Dialog.Title
              style={{
                margin: "0 0 12px 0",
                fontSize: "16px",
                fontWeight: 600,
                color: "var(--settera-title-color, #111827)",
              }}
            >
              {modalConfig.title ?? definition.title}
            </Dialog.Title>
            <Dialog.Description
              style={{
                margin: "0 0 12px 0",
                fontSize: "13px",
                color: "var(--settera-description-color, #6b7280)",
              }}
            >
              {modalConfig.description ?? "Review the fields and submit."}
            </Dialog.Description>

            <div
              style={{ display: "flex", flexDirection: "column", gap: "10px" }}
            >
              {modalConfig.fields.map((field) => (
                <label
                  key={field.key}
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    gap: "4px",
                    fontSize: "13px",
                    color: "var(--settera-description-color, #4b5563)",
                  }}
                >
                  {field.title}
                  <ActionModalField
                    field={field}
                    value={draftValues[field.key]}
                    onChange={(nextFieldValue) => {
                      setDraftValues((prev) => ({
                        ...prev,
                        [field.key]: nextFieldValue,
                      }));
                    }}
                  />
                </label>
              ))}
            </div>

            <div
              style={{
                marginTop: "14px",
                display: "flex",
                justifyContent: "flex-end",
                gap: "8px",
              }}
            >
              <Dialog.Close asChild>
                <button
                  type="button"
                  style={{
                    fontSize: "13px",
                    padding: "6px 10px",
                    borderRadius: "6px",
                    border: "1px solid #d1d5db",
                    backgroundColor: "#fff",
                    cursor: "pointer",
                  }}
                >
                  {modalConfig.cancelLabel ?? "Cancel"}
                </button>
              </Dialog.Close>

              <button
                type="button"
                onClick={handleSubmitModal}
                disabled={!onAction || isLoading}
                style={{
                  fontSize: "13px",
                  padding: "6px 10px",
                  borderRadius: "6px",
                  border: "1px solid #d1d5db",
                  backgroundColor: "#fff",
                  cursor: !onAction || isLoading ? "not-allowed" : "pointer",
                }}
              >
                {modalConfig.submitLabel ?? "Submit"}
              </button>
            </div>
          </Dialog.Content>
        </Dialog.Portal>
      )}
    </Dialog.Root>
  );
}
