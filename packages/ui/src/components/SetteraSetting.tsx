import React, { useContext } from "react";
import { SetteraSchemaContext, SetteraSettingErrorBoundary } from "@settera/react";
import { token, type CustomSetting } from "@settera/schema";
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
    throw new Error("SetteraSetting must be used within a Settera component.");
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
      if (definition.actions) {
        control = <ActionButton settingKey={settingKey} />;
        break;
      }
      return <ActionButton settingKey={settingKey} />;
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
            fontSize: token("description-font-size"),
            color: token("description-color"),
            fontStyle: "italic",
          }}
        >
          Missing custom setting renderer "{definition.renderer}".
        </span>
      );
      break;
    }
    default: {
      // Exhaustive fallback for forward compatibility.
      const _exhaustive: never = definition;
      void _exhaustive;
      control = (
        <span
          data-testid={`unsupported-${settingKey}`}
          style={{
            fontSize: token("description-font-size"),
            color: token("description-color"),
            fontStyle: "italic",
          }}
        >
          unsupported
        </span>
      );
      break;
    }
  }

  return (
    <SetteraSettingErrorBoundary
      settingKey={settingKey}
      fallback={
        process.env.NODE_ENV !== "production" ? (
          <SettingRow settingKey={settingKey} isLast={isLast}>
            <span
              style={{
                fontSize: token("description-font-size"),
                color: token("error-color"),
                fontStyle: "italic",
              }}
            >
              Failed to render setting &ldquo;{settingKey}&rdquo;.
            </span>
          </SettingRow>
        ) : undefined
      }
    >
      <SettingRow settingKey={settingKey} isLast={isLast}>
        {control}
      </SettingRow>
    </SetteraSettingErrorBoundary>
  );
}
