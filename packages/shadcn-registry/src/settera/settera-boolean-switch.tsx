"use client";

import React, { useCallback } from "react";
import { useSetteraSetting } from "@settera/react";
import { Switch } from "@/components/ui/switch";
import { cn } from "@/lib/utils";
import { SetteraSaveIndicator } from "./settera-save-indicator";

export interface SetteraBooleanSwitchProps {
  settingKey: string;
}

export function SetteraBooleanSwitch({ settingKey }: SetteraBooleanSwitchProps) {
  const { value, setValue, error, definition, saveStatus } = useSetteraSetting(settingKey);

  const checked = Boolean(value);
  const isDangerous = "dangerous" in definition && definition.dangerous;
  const isDisabled = "disabled" in definition && Boolean(definition.disabled);
  const hasError = error !== null;
  const showIndicator = saveStatus === "saving" || saveStatus === "saved";

  const handleCheckedChange = useCallback(
    (nextChecked: boolean) => {
      setValue(nextChecked);
    },
    [setValue],
  );

  return (
    <div className="inline-flex items-center gap-2">
      {showIndicator && <SetteraSaveIndicator saveStatus={saveStatus} />}
      <Switch
        checked={checked}
        onCheckedChange={handleCheckedChange}
        disabled={isDisabled}
        aria-label={definition.title}
        aria-invalid={hasError || undefined}
        aria-describedby={hasError ? `settera-error-${settingKey}` : undefined}
        className={cn(
          isDangerous && "data-[state=checked]:bg-destructive",
        )}
      />
    </div>
  );
}
