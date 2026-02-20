"use client";

import React, { useCallback, useContext } from "react";
import { SetteraSchemaContext, useSetteraSetting, useCompoundDraft, useSaveAndClose, parseDescriptionLinks } from "@settera/react";
import type { ActionSetting, CompoundFieldDefinition } from "@settera/schema";
import { SetteraActionPageContent } from "./settera-action-page-content";
import { CompoundFields } from "./settera-compound-input";
import { Button } from "@/components/ui/button";

export interface SetteraActionPageProps {
  settingKey: string;
  definition: ActionSetting;
  onBack: () => void;
}

export interface SetteraSubpageContentProps {
  settingKey: string;
  onBack: () => void;
  customActionPages?: Record<string, React.ComponentType<SetteraActionPageProps>>;
}

export function SetteraSubpageContent({
  settingKey,
  onBack,
  customActionPages,
}: SetteraSubpageContentProps) {
  const schemaCtx = useContext(SetteraSchemaContext);
  const setting = schemaCtx?.getSettingByKey(settingKey);

  if (!setting) {
    return null;
  }

  if (setting.type === "compound" && setting.displayStyle === "page") {
    return (
      <CompoundSubpage
        settingKey={settingKey}
        definition={setting}
        onBack={onBack}
      />
    );
  }

  if (setting.type === "action" && setting.actionType === "page") {
    if (setting.page?.renderer) {
      const CustomActionPage = customActionPages?.[setting.page.renderer];
      if (CustomActionPage) {
        return (
          <CustomActionPage
            settingKey={settingKey}
            definition={setting}
            onBack={onBack}
          />
        );
      }
      return (
        <div className="text-sm italic text-muted-foreground">
          Missing custom action page renderer &ldquo;{setting.page.renderer}&rdquo;.
        </div>
      );
    }

    return (
      <SetteraActionPageContent
        settingKey={settingKey}
        definition={setting}
        onBack={onBack}
      />
    );
  }

  return null;
}

function CompoundSubpage({
  settingKey,
  definition,
  onBack,
}: {
  settingKey: string;
  definition: {
    title: string;
    description?: string;
    disabled?: boolean;
    fields: CompoundFieldDefinition[];
  };
  onBack: () => void;
}) {
  const { value, setValue, validate, saveStatus } =
    useSetteraSetting(settingKey);

  const { getFieldValue, updateField, commitDraft } = useCompoundDraft(
    value,
    definition.fields,
    setValue,
    validate,
    { draft: true },
  );

  const { trigger: triggerSave, isBusy } = useSaveAndClose(
    saveStatus,
    onBack,
  );

  const handleSave = useCallback(() => {
    commitDraft();
    triggerSave();
  }, [commitDraft, triggerSave]);

  const isDisabled = Boolean(definition.disabled);

  return (
    <div>
      <h2 className="font-semibold" style={{ fontSize: "var(--settera-subpage-title-font-size, 1rem)" }}>{definition.title}</h2>
      {definition.description && (
        <p className="mt-1 text-sm text-muted-foreground">
          {parseDescriptionLinks(definition.description)}
        </p>
      )}
      <div className="mt-4">
        <CompoundFields
          settingKey={settingKey}
          fields={definition.fields}
          getFieldValue={getFieldValue}
          updateField={updateField}
          parentDisabled={isDisabled}
        />
      </div>

      <div className="mt-4 flex justify-end gap-2">
        <Button
          variant="outline"
          onClick={onBack}
          disabled={isBusy}
        >
          Cancel
        </Button>
        <Button
          onClick={handleSave}
          disabled={isBusy}
        >
          {isBusy ? "Saving\u2026" : "Save"}
        </Button>
      </div>
    </div>
  );
}
