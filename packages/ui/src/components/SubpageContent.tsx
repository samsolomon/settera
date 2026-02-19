import React, { useContext } from "react";
import { SetteraSchemaContext, useSetteraSetting } from "@settera/react";
import type { ActionSetting, CompoundFieldDefinition } from "@settera/schema";
import { ActionPageContent } from "./ActionPageContent.js";
import { CompoundFields } from "./CompoundInput.js";
import { useCompoundDraft } from "../hooks/useCompoundDraft.js";
import { parseDescriptionLinks } from "../utils/parseDescriptionLinks.js";
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
 * - Compound displayStyle "page": instant-apply fields
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
        <div style={mutedMessageStyle}>
          Missing custom action page renderer &quot;{setting.page.renderer}&quot;.
        </div>
      );
    }

    return (
      <ActionPageContent
        settingKey={settingKey}
        definition={setting}
        onBack={onBack}
      />
    );
  }

  return null;
}

// ---- Compound Subpage (instant-apply fields) ----

function CompoundSubpage({
  settingKey,
  definition,
}: {
  settingKey: string;
  definition: { title: string; description?: string; fields: CompoundFieldDefinition[] };
}) {
  const { value, setValue, validate } = useSetteraSetting(settingKey);
  const { getFieldValue, updateField } = useCompoundDraft(
    value,
    definition.fields,
    setValue,
    validate,
  );

  return (
    <div>
      <h2
        style={{
          fontSize: "var(--settera-page-title-font-size, 20px)",
          fontWeight: 600,
          color: "var(--settera-page-title-color, var(--settera-foreground, #111827))",
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
        />
      </div>
    </div>
  );
}
