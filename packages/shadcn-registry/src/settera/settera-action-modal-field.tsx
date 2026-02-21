"use client";

import React from "react";
import type { CompoundFieldDefinition, RepeatableSetting } from "@settera/schema";
import {
  getDefaultFieldValue,
  isObjectRecord,
  type ModalActionFieldSetting,
} from "@settera/react";
import { SetteraFieldControl } from "./settera-field-control";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export interface SetteraActionModalFieldProps {
  field: ModalActionFieldSetting;
  value: unknown;
  onChange: (nextValue: unknown) => void;
}

export function SetteraActionModalField({
  field,
  value,
  onChange,
}: SetteraActionModalFieldProps) {
  // Leaf types
  if (
    field.type === "text" ||
    field.type === "number" ||
    field.type === "date" ||
    field.type === "select" ||
    field.type === "boolean" ||
    field.type === "multiselect"
  ) {
    return (
      <SetteraFieldControl
        field={field as CompoundFieldDefinition}
        value={value}
        onChange={onChange}
        ariaLabel={field.title}
        className="w-full"
      />
    );
  }

  if (field.type === "compound") {
    const obj = isObjectRecord(value)
      ? value
      : (getDefaultFieldValue(field) as Record<string, unknown>);

    return (
      <div className="rounded-md border p-3 flex flex-col gap-3">
        {field.fields.map((subField) => (
          <div key={subField.key} className="flex flex-col gap-1.5">
            <Label>{subField.title}</Label>
            <SetteraActionModalField
              field={subField as ModalActionFieldSetting}
              value={obj[subField.key]}
              onChange={(nextSubValue) => {
                onChange({ ...obj, [subField.key]: nextSubValue });
              }}
            />
          </div>
        ))}
      </div>
    );
  }

  // Repeatable
  const repeatableField = field as RepeatableSetting;
  const items = Array.isArray(value) ? value : [];

  if (repeatableField.itemType === "text") {
    return (
      <div className="flex flex-col gap-2">
        {items.map((item, index) => (
          <div
            key={`${repeatableField.key}-${index}`}
            className="flex items-center gap-2"
          >
            <Input
              aria-label={`${field.title} item ${index + 1}`}
              value={typeof item === "string" ? item : ""}
              onChange={(e) => {
                const next = [...items];
                next[index] = e.target.value;
                onChange(next);
              }}
              className="w-full"
            />
            <Button
              type="button"
              variant="outline"
              size="sm"
              aria-label={`Remove ${field.title} item ${index + 1}`}
              onClick={() => {
                onChange(items.filter((_, i) => i !== index));
              }}
            >
              Remove
            </Button>
          </div>
        ))}
        <Button
          type="button"
          variant="outline"
          size="sm"
          aria-label={`Add ${field.title} item`}
          onClick={() => onChange([...items, ""])}
          className="self-start"
        >
          Add item
        </Button>
      </div>
    );
  }

  // Compound items
  const compoundItemFields = repeatableField.itemFields ?? [];

  return (
    <div className="flex flex-col gap-2">
      {items.map((item, index) => {
        const itemObj = isObjectRecord(item) ? item : {};
        return (
          <div
            key={`${repeatableField.key}-${index}`}
            className="rounded-md border p-3 flex flex-col gap-3"
          >
            {compoundItemFields.map((itemField) => (
              <div key={`${index}-${itemField.key}`} className="flex flex-col gap-1.5">
                <Label>{itemField.title}</Label>
                <SetteraActionModalField
                  field={itemField as ModalActionFieldSetting}
                  value={itemObj[itemField.key]}
                  onChange={(nextSubValue) => {
                    const next = [...items];
                    next[index] = { ...itemObj, [itemField.key]: nextSubValue };
                    onChange(next);
                  }}
                />
              </div>
            ))}
            <Button
              type="button"
              variant="outline"
              size="sm"
              aria-label={`Remove ${field.title} item ${index + 1}`}
              onClick={() => onChange(items.filter((_, i) => i !== index))}
              className="self-start"
            >
              Remove
            </Button>
          </div>
        );
      })}
      <Button
        type="button"
        variant="outline"
        size="sm"
        aria-label={`Add ${field.title} item`}
        onClick={() => {
          const defaults: Record<string, unknown> = {};
          for (const itemField of compoundItemFields) {
            defaults[itemField.key] = getDefaultFieldValue(
              itemField as ModalActionFieldSetting,
            );
          }
          onChange([...items, defaults]);
        }}
        className="self-start"
      >
        Add item
      </Button>
    </div>
  );
}
