"use client";

import React, { useCallback } from "react";
import type { ActionPageConfig } from "@settera/schema";
import { useSetteraAction, useActionModalDraft, useSaveAndClose, parseDescriptionLinks } from "@settera/react";
import { SetteraActionModalField } from "./settera-action-modal-field";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { useSetteraLabels } from "./settera-labels";

export interface SetteraActionPageContentProps {
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

export function SetteraActionPageContent({
  settingKey,
  actionKey,
  pageConfig,
  title: parentTitle,
  onBack,
}: SetteraActionPageContentProps) {
  const labels = useSetteraLabels();
  const { onAction, isLoading, items } = useSetteraAction(settingKey);

  // For multi-button items, find the matching item's onAction/isLoading
  const itemResult = items.find((i) => i.item.key === actionKey);
  const effectiveOnAction = itemResult ? itemResult.onAction : onAction;
  const effectiveIsLoading = itemResult ? itemResult.isLoading : isLoading;

  const { draftValues, setField } = useActionModalDraft(
    pageConfig?.fields,
    pageConfig?.initialValues,
    true,
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
          {pageConfig.cancelLabel ?? labels.cancel}
        </Button>
        <Button
          onClick={handleSubmit}
          disabled={isBusy}
        >
          {isBusy ? labels.loading : (pageConfig.submitLabel ?? labels.submit)}
        </Button>
      </div>
    </div>
  );
}
