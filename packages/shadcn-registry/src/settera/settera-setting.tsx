"use client";

import React, { useContext } from "react";
import { SetteraSchemaContext } from "@settera/react";
import type { CustomSetting } from "@settera/schema";
import { SetteraSettingRow } from "./settera-setting-row";
import { SetteraBooleanSwitch } from "./settera-boolean-switch";
import { SetteraTextInput } from "./settera-text-input";
import { SetteraNumberInput } from "./settera-number-input";
import { SetteraSelect } from "./settera-select";
import { SetteraActionButton } from "./settera-action-button";
import { SetteraMultiselect } from "./settera-multiselect";
import { SetteraDateInput } from "./settera-date-input";
import { SetteraCompoundInput } from "./settera-compound-input";
import { SetteraRepeatableInput } from "./settera-repeatable-input";

export interface SetteraSettingProps {
  settingKey: string;
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
      control = <SetteraBooleanSwitch settingKey={settingKey} />;
      break;
    case "text":
      control = <SetteraTextInput settingKey={settingKey} />;
      break;
    case "number":
      control = <SetteraNumberInput settingKey={settingKey} />;
      break;
    case "select":
      control = <SetteraSelect settingKey={settingKey} />;
      break;
    case "multiselect":
      control = <SetteraMultiselect settingKey={settingKey} />;
      break;
    case "date":
      control = <SetteraDateInput settingKey={settingKey} />;
      break;
    case "compound":
      control = <SetteraCompoundInput settingKey={settingKey} />;
      break;
    case "repeatable":
      control = <SetteraRepeatableInput settingKey={settingKey} />;
      break;
    case "action":
      return <SetteraActionButton settingKey={settingKey} />;
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
          className="text-sm italic text-muted-foreground"
        >
          Missing custom setting renderer &ldquo;{definition.renderer}&rdquo;.
        </span>
      );
      break;
    }
    default: {
      const _exhaustive: never = definition;
      control = (
        <span
          data-testid={`unsupported-${settingKey}`}
          className="text-sm italic text-muted-foreground"
        >
          unsupported
        </span>
      );
      break;
    }
  }

  return (
    <SetteraSettingRow settingKey={settingKey} isLast={isLast}>
      {control}
    </SetteraSettingRow>
  );
}
