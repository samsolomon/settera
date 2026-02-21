"use client";

import React, { useCallback } from "react";
import type { ActionSetting } from "@settera/schema";
import { useSetteraAction, useActionModalDraft, useSaveAndClose, parseDescriptionLinks } from "@settera/react";
import { SetteraActionModalField } from "./settera-action-modal-field";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";

export interface SetteraActionPageContentProps {
  settingKey: string;
  definition: ActionSetting;
  onBack: () => void;
}

export function SetteraActionPageContent({
  settingKey,
  definition,
  onBack,
}: SetteraActionPageContentProps) {
  const { onAction, isLoading } = useSetteraAction(settingKey);
  const pageConfig = definition.page;

  const { draftValues, setField } = useActionModalDraft(
    pageConfig?.fields,
    pageConfig?.initialValues,
    true,
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
      <h2 className="font-semibold" style={{ fontSize: "var(--settera-subpage-title-font-size, 1rem)" }}>{title}</h2>
      {description && (
        <p className="mt-1 text-sm text-muted-foreground">
          {parseDescriptionLinks(description)}
        </p>
      )}

      <div className="mt-4 flex flex-col gap-3">
        {pageConfig.fields.map((field) => (
          <div key={field.key} className="flex flex-col gap-1.5">
            <Label>{field.title}</Label>
            <SetteraActionModalField
              field={field}
              value={draftValues[field.key]}
              onChange={(nextFieldValue) => setField(field.key, nextFieldValue)}
            />
          </div>
        ))}
      </div>

      <div className="mt-4 flex flex-col gap-2 md:flex-row md:justify-end">
        <Button
          variant="outline"
          onClick={onBack}
          disabled={isBusy}
        >
          {pageConfig.cancelLabel ?? "Cancel"}
        </Button>
        <Button
          onClick={handleSubmit}
          disabled={isBusy}
        >
          {isBusy ? "Loading\u2026" : (pageConfig.submitLabel ?? "Submit")}
        </Button>
      </div>
    </div>
  );
}
