import React, { useCallback, useEffect, useRef, useState } from "react";
import type { ActionSetting } from "@settera/schema";
import { useSetteraAction } from "@settera/react";
import { ActionModalField } from "./ActionModalField.js";
import { useActionModalDraft } from "../hooks/useActionModalDraft.js";
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
  const [isSubmitting, setIsSubmitting] = useState(false);
  const sawLoadingRef = useRef(false);

  const { draftValues, setField } = useActionModalDraft(
    pageConfig?.fields,
    pageConfig?.initialValues,
    true, // always "open"
  );

  const handleSubmit = useCallback(() => {
    onAction(draftValues);
    setIsSubmitting(true);
  }, [draftValues, onAction]);

  // Track whether loading was ever observed after submit.
  // Sync actions never set isLoading, so sawLoadingRef stays false and
  // the effect closes the page immediately (correct — the action already ran).
  // Async actions set isLoading=true synchronously, so sawLoadingRef is set
  // before the "close" condition can fire.
  useEffect(() => {
    if (isLoading) {
      sawLoadingRef.current = true;
    }
    if (!isSubmitting) return;
    // For async actions: wait until loading completes
    if (sawLoadingRef.current && isLoading) return;
    setIsSubmitting(false);
    sawLoadingRef.current = false;
    onBack();
  }, [isLoading, isSubmitting, onBack]);

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
              color: "var(--settera-description-color, var(--settera-muted-foreground, #4b5563))",
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
          {pageConfig.cancelLabel ?? "Cancel"}
        </PrimitiveButton>

        <PrimitiveButton
          type="button"
          onClick={handleSubmit}
          disabled={isLoading}
          style={{
            backgroundColor: "var(--settera-button-primary-bg, var(--settera-primary, #2563eb))",
            color: "var(--settera-button-primary-color, var(--settera-primary-foreground, white))",
            cursor: isLoading ? "not-allowed" : "pointer",
          }}
        >
          {isLoading ? "Loading\u2026" : (pageConfig.submitLabel ?? "Submit")}
        </PrimitiveButton>
      </div>
    </div>
  );
}
