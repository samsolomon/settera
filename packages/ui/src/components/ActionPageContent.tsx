import React, { useCallback } from "react";
import type { ActionSetting } from "@settera/schema";
import { useSetteraAction } from "@settera/react";
import { ActionModalField } from "./ActionModalField.js";
import { useActionModalDraft } from "../hooks/useActionModalDraft.js";
import { useSaveAndClose } from "../hooks/useSaveAndClose.js";
import { PrimitiveButton } from "./SetteraPrimitives.js";
import { descriptionTextStyle } from "./SetteraFieldPrimitives.js";
import { parseDescriptionLinks } from "../utils/parseDescriptionLinks.js";

export interface ActionPageContentProps {
  settingKey: string;
  definition: ActionSetting;
  onBack: () => void;
}

/**
 * Full-page form for action pages with schema-defined fields.
 * Mirrors ActionModal but rendered inline instead of in a dialog.
 */
export function ActionPageContent({
  settingKey,
  definition,
  onBack,
}: ActionPageContentProps) {
  const { onAction, isLoading } = useSetteraAction(settingKey);
  const pageConfig = definition.page;

  const { draftValues, setField } = useActionModalDraft(
    pageConfig?.fields,
    pageConfig?.initialValues,
    true, // always "open"
  );

  const { trigger: triggerSubmit, isBusy } = useSaveAndClose(
    isLoading,
    onBack,
  );

  const handleSubmit = useCallback(() => {
    onAction(draftValues);
    triggerSubmit();
  }, [draftValues, onAction, triggerSubmit]);

  if (!pageConfig || !pageConfig.fields || pageConfig.fields.length === 0) {
    return null;
  }

  const title = pageConfig.title ?? definition.title;
  const description = pageConfig.description;

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
        {title}
      </h2>
      {description && (
        <p
          style={{
            ...descriptionTextStyle,
            marginTop: "4px",
            marginBottom: 0,
          }}
        >
          {parseDescriptionLinks(description)}
        </p>
      )}

      <div
        style={{
          marginTop: "16px",
          display: "flex",
          flexDirection: "column",
          gap: "10px",
        }}
      >
        {pageConfig.fields.map((field) => (
          <label
            key={field.key}
            style={{
              display: "flex",
              flexDirection: "column",
              gap: "4px",
              fontSize: "13px",
              color: "var(--settera-description-color, var(--settera-muted-foreground, #6b7280))",
            }}
          >
            {field.title}
            <ActionModalField
              field={field}
              value={draftValues[field.key]}
              onChange={(nextFieldValue) => setField(field.key, nextFieldValue)}
            />
          </label>
        ))}
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
          {pageConfig.cancelLabel ?? "Cancel"}
        </PrimitiveButton>

        <PrimitiveButton
          type="button"
          onClick={handleSubmit}
          disabled={isBusy}
          style={{
            backgroundColor: "var(--settera-button-primary-bg, var(--settera-primary, #2563eb))",
            color: "var(--settera-button-primary-color, var(--settera-primary-foreground, white))",
            cursor: isBusy ? "not-allowed" : "pointer",
          }}
        >
          {isBusy ? "Loading\u2026" : (pageConfig.submitLabel ?? "Submit")}
        </PrimitiveButton>
      </div>
    </div>
  );
}
