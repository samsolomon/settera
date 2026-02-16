import React, { useContext } from "react";
import { SettaraSchemaContext } from "@settara/react";
import { SettingRow } from "./SettingRow.js";
import { BooleanSwitch } from "./BooleanSwitch.js";
import { TextInput } from "./TextInput.js";
import { NumberInput } from "./NumberInput.js";
import { Select } from "./Select.js";
import { ActionButton } from "./ActionButton.js";
import { MultiSelect } from "./MultiSelect.js";
import { DateInput } from "./DateInput.js";

export interface SettaraSettingProps {
  settingKey: string;
}

/**
 * Type-to-component dispatcher.
 * Maps a setting definition's type to the correct UI control, wrapped in SettingRow.
 */
export function SettaraSetting({ settingKey }: SettaraSettingProps) {
  const schemaCtx = useContext(SettaraSchemaContext);

  if (!schemaCtx) {
    throw new Error("SettaraSetting must be used within a SettaraProvider.");
  }

  const definition = schemaCtx.getSettingByKey(settingKey);
  if (!definition) {
    return null;
  }

  let control: React.ReactNode;

  switch (definition.type) {
    case "boolean":
      control = <BooleanSwitch settingKey={settingKey} />;
      break;
    case "text":
      control = <TextInput settingKey={settingKey} />;
      break;
    case "number":
      control = <NumberInput settingKey={settingKey} />;
      break;
    case "select":
      control = <Select settingKey={settingKey} />;
      break;
    case "multiselect":
      control = <MultiSelect settingKey={settingKey} />;
      break;
    case "date":
      control = <DateInput settingKey={settingKey} />;
      break;
    case "action":
      control = <ActionButton settingKey={settingKey} />;
      break;
    default:
      control = (
        <span
          data-testid={`unsupported-${settingKey}`}
          style={{
            fontSize: "var(--settara-description-font-size, 13px)",
            color: "var(--settara-description-color, #6b7280)",
            fontStyle: "italic",
          }}
        >
          {definition.type}
        </span>
      );
      break;
  }

  return <SettingRow settingKey={settingKey}>{control}</SettingRow>;
}
