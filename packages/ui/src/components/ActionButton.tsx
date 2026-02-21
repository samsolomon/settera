import React, { useCallback, useEffect, useRef, useState } from "react";
import type { ActionModalConfig, ActionPageConfig } from "@settera/schema";
import { useSetteraAction, useFocusVisible } from "@settera/react";
import { PrimitiveButton } from "./SetteraPrimitives.js";
import { useSetteraNavigation } from "../hooks/useSetteraNavigation.js";
import { ActionModal } from "./ActionModal.js";

export interface ActionButtonProps {
  settingKey: string;
}

/**
 * A button for action-type settings.
 * Supports both single-button and multi-button forms.
 */
export function ActionButton({ settingKey }: ActionButtonProps) {
  const { definition, onAction, isLoading, items } = useSetteraAction(settingKey);

  // Multi-button form
  if (definition.actions && items.length > 0) {
    return (
      <div style={{ display: "flex", gap: "8px" }}>
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

  // Single-button form
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
  const { isFocusVisible, focusVisibleProps } = useFocusVisible();
  const { openSubpage } = useSetteraNavigation();
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
      <PrimitiveButton
        ref={triggerRef}
        type="button"
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
        {...focusVisibleProps}
        disabled={isDisabled || isLoading || (isModalAction && !hasModalConfig) || (isPageAction && !hasPageConfig)}
        aria-label={ariaLabel}
        aria-busy={isLoading}
        tone={isDangerous ? "destructive" : "default"}
        focusVisible={isFocusVisible}
        style={{
          cursor:
            isDisabled || isLoading || (isModalAction && !hasModalConfig) || (isPageAction && !hasPageConfig)
              ? "not-allowed"
              : "pointer",
        }}
      >
        {isLoading ? "Loading\u2026" : buttonLabel}
      </PrimitiveButton>

      {isModalAction && hasModalConfig && (
        <ActionModal
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
