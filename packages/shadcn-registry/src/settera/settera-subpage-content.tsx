"use client";

import React, { useCallback, useContext } from "react";
import { SetteraSchemaContext, useSetteraSetting, useCompoundDraft, useSaveAndClose, parseDescriptionLinks } from "@settera/react";
import type { ActionSetting, ActionPageConfig, CompoundFieldDefinition } from "@settera/schema";
import { SetteraActionPageContent } from "./settera-action-page-content";
import { CompoundFields } from "./settera-compound-input";
import { Button } from "@/components/ui/button";
import { useSetteraLabels } from "./settera-labels";

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

  if (setting.type === "action") {
    // Determine if this is a multi-button item subpage or a single-button subpage
    let actionKey = settingKey;
    let pageConfig: ActionPageConfig | undefined;
    let actionType: string | undefined;
    let title = setting.title;

    if (setting.actions && setting.key !== settingKey) {
      // Multi-button: find the matching item
      const item = setting.actions.find((a) => a.key === settingKey);
      if (item) {
        actionKey = item.key;
        pageConfig = item.page;
        actionType = item.actionType;
      }
    } else {
      pageConfig = setting.page;
      actionType = setting.actionType;
    }

    if (actionType !== "page") return null;

    if (pageConfig?.renderer) {
      const CustomActionPage = customActionPages?.[pageConfig.renderer];
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
          Missing custom action page renderer &ldquo;{pageConfig.renderer}&rdquo;.
        </div>
      );
    }

    return (
      <SetteraActionPageContent
        settingKey={setting.key}
        actionKey={actionKey}
        pageConfig={pageConfig}
        title={title}
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
  const labels = useSetteraLabels();
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

      <div className="mt-4 flex flex-col gap-2 md:flex-row md:justify-end">
        <Button
          variant="outline"
          onClick={onBack}
          disabled={isBusy}
        >
          {labels.cancel}
        </Button>
        <Button
          onClick={handleSave}
          disabled={isBusy}
        >
          {isBusy ? labels.saving : labels.save}
        </Button>
      </div>
    </div>
  );
}
