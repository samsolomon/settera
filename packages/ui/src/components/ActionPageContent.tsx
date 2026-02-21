import React, { useCallback } from "react";
import { token, type ActionPageConfig } from "@settera/schema";
import { useSetteraAction, useActionModalDraft, useSaveAndClose, parseDescriptionLinks } from "@settera/react";
import { ActionModalField } from "./ActionModalField.js";
import { PrimitiveButton } from "./SetteraPrimitives.js";
import { descriptionTextStyle } from "./SetteraFieldPrimitives.js";

export interface ActionPageContentProps {
  /** The parent action setting key (used for useSetteraAction) */
  settingKey: string;
  /** The key to use when invoking the action (item key for multi-button, same as settingKey for single) */
  actionKey: string;
  /** The page config to render */
  pageConfig?: ActionPageConfig;
  /** Fallback title from the parent setting */
  title: string;
  onBack: () => void;
}

/**
 * Full-page form for action pages with schema-defined fields.
 * Mirrors ActionModal but rendered inline instead of in a dialog.
 */
export function ActionPageContent({
  settingKey,
  actionKey,
  pageConfig,
  title: parentTitle,
  onBack,
}: ActionPageContentProps) {
  const { onAction, isLoading, items } = useSetteraAction(settingKey);

  // For multi-button items, find the matching item's onAction/isLoading
  const itemResult = items.find((i) => i.item.key === actionKey);
  const effectiveOnAction = itemResult ? itemResult.onAction : onAction;
  const effectiveIsLoading = itemResult ? itemResult.isLoading : isLoading;

  const { draftValues, setField } = useActionModalDraft(
    pageConfig?.fields,
    pageConfig?.initialValues,
    true, // always "open"
  );

  const { trigger: triggerSubmit, isBusy } = useSaveAndClose(
    effectiveIsLoading,
    onBack,
  );

  const handleSubmit = useCallback(() => {
    effectiveOnAction(draftValues);
    triggerSubmit();
  }, [draftValues, effectiveOnAction, triggerSubmit]);

  if (!pageConfig || !pageConfig.fields || pageConfig.fields.length === 0) {
    return null;
  }

  const title = pageConfig.title ?? parentTitle;
  const description = pageConfig.description;

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
              color: token("description-color"),
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
            backgroundColor: token("button-primary-bg"),
            color: token("button-primary-color"),
            cursor: isBusy ? "not-allowed" : "pointer",
          }}
        >
          {isBusy ? "Loading\u2026" : (pageConfig.submitLabel ?? "Submit")}
        </PrimitiveButton>
      </div>
    </div>
  );
}
