import React, { useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
import { SetteraSchemaContext, useSetteraSetting } from "@settera/react";
import type { ActionSetting, CompoundFieldDefinition } from "@settera/schema";
import { ActionPageContent } from "./ActionPageContent.js";
import { CompoundFields } from "./CompoundInput.js";
import { PrimitiveButton } from "./SetteraPrimitives.js";
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

// ---- Compound Subpage (draft-based with Save / Cancel) ----

function isObjectRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function CompoundSubpage({
  settingKey,
  definition,
  onBack,
}: {
  settingKey: string;
  definition: { title: string; description?: string; fields: CompoundFieldDefinition[] };
  onBack: () => void;
}) {
  const { value, setValue, saveStatus } = useSetteraSetting(settingKey);
  const [isSaving, setIsSaving] = useState(false);
  const sawSavingRef = useRef(false);

  // Build effective value (defaults merged with stored value) — used only for initializing draft
  const effectiveValue = useMemo(() => {
    const compoundValue = isObjectRecord(value) ? value : {};
    const merged: Record<string, unknown> = {};
    for (const field of definition.fields) {
      if ("default" in field && field.default !== undefined) {
        merged[field.key] = field.default;
      }
    }
    return { ...merged, ...compoundValue };
  }, [value, definition.fields]);

  // Local draft — initialized from effective value, updated only locally
  const [draft, setDraft] = useState<Record<string, unknown>>(effectiveValue);

  const getFieldValue = useCallback(
    (field: CompoundFieldDefinition): unknown => draft[field.key],
    [draft],
  );

  const updateField = useCallback(
    (fieldKey: string, nextFieldValue: unknown) => {
      setDraft((prev) => ({ ...prev, [fieldKey]: nextFieldValue }));
    },
    [],
  );

  const handleSave = useCallback(() => {
    setValue(draft);
    setIsSaving(true);
  }, [draft, setValue]);

  // Track save completion and navigate back
  useEffect(() => {
    if (saveStatus === "saving") {
      sawSavingRef.current = true;
    }
    if (!isSaving) return;
    // For async saves: wait until saving completes
    if (sawSavingRef.current && saveStatus === "saving") return;
    setIsSaving(false);
    sawSavingRef.current = false;
    onBack();
  }, [saveStatus, isSaving, onBack]);

  const isLoading = isSaving && saveStatus === "saving";

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
          disabled={isLoading}
          style={{
            cursor: isLoading ? "not-allowed" : "pointer",
          }}
        >
          Cancel
        </PrimitiveButton>

        <PrimitiveButton
          type="button"
          onClick={handleSave}
          disabled={isLoading}
          style={{
            backgroundColor: "var(--settera-button-primary-bg, var(--settera-primary, #2563eb))",
            color: "var(--settera-button-primary-color, var(--settera-primary-foreground, white))",
            cursor: isLoading ? "not-allowed" : "pointer",
          }}
        >
          {isLoading ? "Saving\u2026" : "Save"}
        </PrimitiveButton>
      </div>
    </div>
  );
}
