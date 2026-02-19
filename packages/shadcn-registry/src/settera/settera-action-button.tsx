"use client";

import React, { useCallback, useEffect, useRef, useState } from "react";
import type { ActionSetting } from "@settera/schema";
import { useSetteraAction } from "@settera/react";
import { useSetteraNavigation } from "./use-settera-navigation";
import { SetteraActionModal } from "./settera-action-modal";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export interface SetteraActionButtonProps {
  settingKey: string;
}

export function SetteraActionButton({ settingKey }: SetteraActionButtonProps) {
  const { definition, onAction, isLoading } = useSetteraAction(settingKey);
  const { openSubpage } = useSetteraNavigation();
  const triggerRef = useRef<HTMLButtonElement>(null);
  const wasModalOpenRef = useRef(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSubmittingModal, setIsSubmittingModal] = useState(false);

  const isDangerous =
    "dangerous" in definition && Boolean(definition.dangerous);
  const isDisabled = "disabled" in definition && Boolean(definition.disabled);
  const buttonLabel =
    definition.type === "action" ? definition.buttonLabel : "Action";

  const actionDefinition = definition as ActionSetting;
  const isModalAction = actionDefinition.actionType === "modal";
  const isPageAction = actionDefinition.actionType === "page";
  const hasModalConfig = Boolean(actionDefinition.modal);
  const hasPageConfig = Boolean(actionDefinition.page);

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
            openSubpage(settingKey);
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
        aria-label={definition.title}
        aria-busy={isLoading}
      >
        {isLoading ? "Loading\u2026" : buttonLabel}
      </Button>

      {isModalAction && hasModalConfig && (
        <SetteraActionModal
          definition={actionDefinition}
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
