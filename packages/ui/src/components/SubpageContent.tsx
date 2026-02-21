import React, { useCallback, useContext } from "react";
import { SetteraSchemaContext, useSetteraSetting, useCompoundDraft, useSaveAndClose, parseDescriptionLinks } from "@settera/react";
import { token, type ActionSetting, type ActionPageConfig, type CompoundFieldDefinition } from "@settera/schema";
import { ActionPageContent } from "./ActionPageContent.js";
import { CompoundFields } from "./CompoundInput.js";
import { useSetteraLabels } from "../contexts/SetteraLabelsContext.js";
import { PrimitiveButton } from "./SetteraPrimitives.js";
import {
  mutedMessageStyle,
  descriptionTextStyle,
} from "./SetteraFieldPrimitives.js";

export interface SetteraActionPageProps {
  settingKey: string;
  definition: ActionSetting;
  onBack: () => void;
}

export interface SubpageContentProps {
  settingKey: string;
  onBack: () => void;
  customActionPages?: Record<string, React.ComponentType<SetteraActionPageProps>>;
}

/**
 * Renders the content for a subpage based on the setting type.
 * - Compound displayStyle "page": draft-based fields with Save / Cancel
 * - Action actionType "page" with renderer: custom component
 * - Action actionType "page" with fields: form with Cancel/Submit
 */
export function SubpageContent({
  settingKey,
  onBack,
  customActionPages,
}: SubpageContentProps) {
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
    const title = setting.title;

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
        <div style={mutedMessageStyle}>
          Missing custom action page renderer &quot;{pageConfig.renderer}&quot;.
        </div>
      );
    }

    return (
      <ActionPageContent
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

// ---- Compound Subpage (draft-based with Save / Cancel) ----

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
      <h2
        style={{
          fontSize: token("page-title-font-size"),
          fontWeight: 600,
          color: token("page-title-color"),
          margin: 0,
        }}
      >
        {definition.title}
      </h2>
      {definition.description && (
        <p
          style={{
            ...descriptionTextStyle,
            marginTop: "4px",
            marginBottom: 0,
          }}
        >
          {parseDescriptionLinks(definition.description)}
        </p>
      )}
      <div style={{ marginTop: "16px" }}>
        <CompoundFields
          settingKey={settingKey}
          fields={definition.fields}
          getFieldValue={getFieldValue}
          updateField={updateField}
          parentDisabled={isDisabled}
          fullWidth
        />
      </div>

      <div
        style={{
          marginTop: "16px",
          display: "flex",
          justifyContent: "flex-end",
          gap: "8px",
        }}
      >
        <PrimitiveButton
          type="button"
          onClick={onBack}
          disabled={isBusy}
          style={{
            cursor: isBusy ? "not-allowed" : "pointer",
          }}
        >
          {labels.cancel}
        </PrimitiveButton>

        <PrimitiveButton
          type="button"
          onClick={handleSave}
          disabled={isBusy}
          style={{
            backgroundColor: token("button-primary-bg"),
            color: token("button-primary-color"),
            cursor: isBusy ? "not-allowed" : "pointer",
          }}
        >
          {isBusy ? labels.saving : labels.save}
        </PrimitiveButton>
      </div>
    </div>
  );
}
