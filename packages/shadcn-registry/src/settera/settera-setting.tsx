"use client";

import React, { useContext } from "react";
import { SetteraSchemaContext, SetteraSettingErrorBoundary, useSetteraAction, parseDescriptionLinks } from "@settera/react";
import type { CustomSetting } from "@settera/schema";
import { SetteraSettingRow } from "./settera-setting-row";
import { cn } from "@/lib/utils";
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
      return <SetteraActionRow settingKey={settingKey} isLast={isLast} />;
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
      void _exhaustive;
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
    <SetteraSettingErrorBoundary
      settingKey={settingKey}
      fallback={
        process.env.NODE_ENV !== "production" ? (
          <SetteraSettingRow settingKey={settingKey} isLast={isLast}>
            <span className="text-sm italic text-destructive">
              Failed to render setting &ldquo;{settingKey}&rdquo;.
            </span>
          </SetteraSettingRow>
        ) : undefined
      }
    >
      <SetteraSettingRow settingKey={settingKey} isLast={isLast}>
        {control}
      </SetteraSettingRow>
    </SetteraSettingErrorBoundary>
  );
}

function SetteraActionRow({ settingKey, isLast }: { settingKey: string; isLast?: boolean }) {
  const { definition, isVisible } = useSetteraAction(settingKey);
  const isDangerous = Boolean(definition.dangerous);

  if (!isVisible) return null;

  return (
    <div
      className={cn("outline-none rounded-lg px-4", definition.disabled && "opacity-50")}
    >
      <div
        className={cn(
          "flex flex-col gap-2 py-3 md:flex-row md:justify-between md:items-center md:gap-0",
          !isLast && "border-b",
        )}
      >
        <div className="flex-1 md:mr-4">
          <span
            className={cn(
              "text-sm font-medium leading-6",
              isDangerous && "text-destructive",
            )}
          >
            {definition.title}
          </span>
          {definition.description && (
            <div className="mt-0.5 text-sm text-muted-foreground">
              {parseDescriptionLinks(definition.description)}
            </div>
          )}
        </div>
        <div>
          <SetteraActionButton settingKey={settingKey} />
        </div>
      </div>
    </div>
  );
}
