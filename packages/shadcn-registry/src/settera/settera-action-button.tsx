"use client";

import React, { useCallback, useEffect, useRef, useState } from "react";
import type { ActionItem, ActionModalConfig, ActionPageConfig } from "@settera/schema";
import { useSetteraAction } from "@settera/react";
import type { UseSetteraActionItemResult } from "@settera/react";
import { useSetteraNavigation } from "./use-settera-navigation";
import { SetteraActionModal } from "./settera-action-modal";
import { Button } from "@/components/ui/button";
import { useSetteraLabels } from "./settera-labels";

export interface SetteraActionButtonProps {
  settingKey: string;
}

export function SetteraActionButton({ settingKey }: SetteraActionButtonProps) {
  const { definition, onAction, isLoading, items } = useSetteraAction(settingKey);

  // Multi-button form
  if (definition.actions && items.length > 0) {
    return (
      <div className="flex gap-2">
        {items.map((itemResult) => (
          <ActionButtonSingle
            key={itemResult.item.key}
            itemKey={itemResult.item.key}
            buttonLabel={itemResult.item.buttonLabel}
            ariaLabel={itemResult.item.buttonLabel}
            actionType={itemResult.item.actionType}
            dangerous={itemResult.item.dangerous}
            disabled={itemResult.item.disabled}
            modal={itemResult.item.modal}
            page={itemResult.item.page}
            title={definition.title}
            onAction={itemResult.onAction}
            isLoading={itemResult.isLoading}
          />
        ))}
      </div>
    );
  }

  // Single-button form (existing behavior)
  return (
    <ActionButtonSingle
      itemKey={settingKey}
      buttonLabel={definition.buttonLabel ?? "Action"}
      ariaLabel={definition.title}
      actionType={definition.actionType ?? "callback"}
      dangerous={definition.dangerous}
      disabled={definition.disabled}
      modal={definition.modal}
      page={definition.page}
      title={definition.title}
      onAction={onAction}
      isLoading={isLoading}
    />
  );
}

interface ActionButtonSingleProps {
  itemKey: string;
  buttonLabel: string;
  ariaLabel: string;
  actionType: "modal" | "callback" | "page";
  dangerous?: boolean;
  disabled?: boolean;
  modal?: ActionModalConfig;
  page?: ActionPageConfig;
  title: string;
  onAction: (payload?: unknown) => void;
  isLoading: boolean;
}

function ActionButtonSingle({
  itemKey,
  buttonLabel,
  ariaLabel,
  actionType,
  dangerous,
  disabled,
  modal,
  page,
  title,
  onAction,
  isLoading,
}: ActionButtonSingleProps) {
  const { openSubpage } = useSetteraNavigation();
  const labels = useSetteraLabels();
  const triggerRef = useRef<HTMLButtonElement>(null);
  const wasModalOpenRef = useRef(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSubmittingModal, setIsSubmittingModal] = useState(false);

  const isDangerous = Boolean(dangerous);
  const isDisabled = Boolean(disabled);

  const isModalAction = actionType === "modal";
  const isPageAction = actionType === "page";
  const hasModalConfig = Boolean(modal);
  const hasPageConfig = Boolean(page);

  const handleSubmitModal = useCallback(
    (payload: Record<string, unknown>) => {
      onAction(payload);
      setIsSubmittingModal(true);
    },
    [onAction],
  );

  useEffect(() => {
    if (isSubmittingModal && !isLoading) {
      setIsModalOpen(false);
      setIsSubmittingModal(false);
    }
  }, [isLoading, isSubmittingModal]);

  useEffect(() => {
    if (wasModalOpenRef.current && !isModalOpen) {
      triggerRef.current?.focus();
    }
    wasModalOpenRef.current = isModalOpen;
  }, [isModalOpen]);

  return (
    <>
      <Button
        ref={triggerRef}
        type="button"
        variant={isDangerous ? "destructive" : "outline"}
        onClick={() => {
          if (isPageAction) {
            if (isLoading) return;
            openSubpage(itemKey);
            return;
          }
          if (isModalAction) {
            if (isLoading) return;
            setIsModalOpen(true);
            return;
          }
          onAction();
        }}
        disabled={isDisabled || isLoading || (isModalAction && !hasModalConfig) || (isPageAction && !hasPageConfig)}
        aria-label={ariaLabel}
        aria-busy={isLoading}
      >
        {isLoading ? labels.loading : buttonLabel}
      </Button>

      {isModalAction && hasModalConfig && (
        <SetteraActionModal
          modalConfig={modal!}
          title={title}
          isOpen={isModalOpen}
          isLoading={isLoading}
          onOpenChange={(open) => {
            setIsModalOpen(open);
            if (!open) {
              setIsSubmittingModal(false);
            }
          }}
          onSubmit={handleSubmitModal}
        />
      )}
    </>
  );
}
