import React, { useContext } from "react";
import { SetteraSchemaContext } from "@settera/react";
import type { CustomSetting } from "@settera/schema";
import { SettingRow } from "./SettingRow.js";
import { BooleanSwitch } from "./BooleanSwitch.js";
import { TextInput } from "./TextInput.js";
import { NumberInput } from "./NumberInput.js";
import { Select } from "./Select.js";
import { ActionButton } from "./ActionButton.js";
import { MultiSelect } from "./MultiSelect.js";
import { DateInput } from "./DateInput.js";
import { CompoundInput } from "./CompoundInput.js";
import { RepeatableInput } from "./ListInput.js";
import { ColorInput } from "./ColorInput.js";

export interface SetteraSettingProps {
  settingKey: string;
  /** When true, suppresses the bottom border (last item in a card). */
  isLast?: boolean;
  customSettings?: Record<
    string,
    React.ComponentType<SetteraCustomSettingProps>
  >;
}

export interface SetteraCustomSettingProps {
  settingKey: string;
  definition: CustomSetting;
}

/**
 * Type-to-component dispatcher.
 * Maps a setting definition's type to the correct UI control, wrapped in SettingRow.
 */
export function SetteraSetting({
  settingKey,
  isLast,
  customSettings,
}: SetteraSettingProps) {
  const schemaCtx = useContext(SetteraSchemaContext);

  if (!schemaCtx) {
    throw new Error("SetteraSetting must be used within a SetteraProvider.");
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
    case "compound":
      control = <CompoundInput settingKey={settingKey} />;
      break;
    case "repeatable":
      control = <RepeatableInput settingKey={settingKey} />;
      break;
    case "action":
      control = <ActionButton settingKey={settingKey} />;
      break;
    case "color":
      control = <ColorInput settingKey={settingKey} />;
      break;
    case "custom": {
      const CustomSettingComponent = customSettings?.[definition.renderer];
      control = CustomSettingComponent ? (
        <CustomSettingComponent
          settingKey={settingKey}
          definition={definition}
        />
      ) : (
        <span
          data-testid={`missing-custom-setting-${settingKey}`}
          style={{
            fontSize: "var(--settera-description-font-size, 13px)",
            color: "var(--settera-description-color, #6b7280)",
            fontStyle: "italic",
          }}
        >
          Missing custom setting renderer "{definition.renderer}".
        </span>
      );
      break;
    }
    default:
      // Exhaustive fallback for forward compatibility.
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const _exhaustive: never = definition;
      control = (
        <span
          data-testid={`unsupported-${settingKey}`}
          style={{
            fontSize: "var(--settera-description-font-size, 13px)",
            color: "var(--settera-description-color, #6b7280)",
            fontStyle: "italic",
          }}
        >
          unsupported
        </span>
      );
      break;
  }

  return (
    <SettingRow settingKey={settingKey} isLast={isLast}>
      {control}
    </SettingRow>
  );
}
