import React, { useCallback, useEffect, useRef, useState } from "react";
import type { ActionSetting } from "@settera/schema";
import { useSetteraAction } from "@settera/react";
import { PrimitiveButton } from "./SetteraPrimitives.js";
import { useFocusVisible } from "../hooks/useFocusVisible.js";
import { ActionModal } from "./ActionModal.js";

export interface ActionButtonProps {
  settingKey: string;
}

/**
 * A button for action-type settings.
 * Callback actions execute directly, modal actions collect local draft values and
 * submit payload on explicit confirmation.
 */
export function ActionButton({ settingKey }: ActionButtonProps) {
  const { definition, onAction, isLoading } = useSetteraAction(settingKey);
  const { isFocusVisible, focusVisibleProps } = useFocusVisible();
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
  const hasModalConfig = Boolean(actionDefinition.modal);

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
          if (isModalAction) {
            if (isLoading) return;
            setIsModalOpen(true);
            return;
          }
          onAction();
        }}
        {...focusVisibleProps}
        disabled={isDisabled || isLoading || (isModalAction && !hasModalConfig)}
        aria-label={definition.title}
        aria-busy={isLoading}
        tone={isDangerous ? "destructive" : "default"}
        focusVisible={isFocusVisible}
        style={{
          cursor:
            isDisabled || isLoading || (isModalAction && !hasModalConfig)
              ? "not-allowed"
              : "pointer",
          opacity: isDisabled || isLoading ? 0.7 : 1,
        }}
      >
        {isLoading ? "Loading…" : buttonLabel}
      </PrimitiveButton>

      {isModalAction && hasModalConfig && (
        <ActionModal
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
