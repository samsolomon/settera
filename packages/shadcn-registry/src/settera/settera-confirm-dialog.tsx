"use client";

import React, { useCallback, useEffect, useRef, useState } from "react";
import { useSetteraConfirm } from "@settera/react";
import {
  ResponsiveDialog,
  ResponsiveDialogContent,
  ResponsiveDialogDescription,
  ResponsiveDialogFooter,
  ResponsiveDialogHeader,
  ResponsiveDialogTitle,
} from "./settera-responsive-dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";

export function SetteraConfirmDialog() {
  const { pendingConfirm, resolveConfirm } = useSetteraConfirm();
  const [inputValue, setInputValue] = useState("");
  const cancelRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (pendingConfirm) {
      setInputValue("");
    }
  }, [pendingConfirm]);

  const handleOpenChange = useCallback(
    (open: boolean) => {
      if (!open) resolveConfirm(false);
    },
    [resolveConfirm],
  );

  const handleConfirm = useCallback(() => {
    resolveConfirm(true, inputValue);
  }, [resolveConfirm, inputValue]);

  const handleCancel = useCallback(() => {
    resolveConfirm(false);
  }, [resolveConfirm]);

  if (!pendingConfirm) return null;

  const { config, dangerous } = pendingConfirm;
  const title = config.title ?? "Confirm";
  const confirmLabel = config.confirmLabel ?? "Confirm";
  const cancelLabel = config.cancelLabel ?? "Cancel";
  const requireText = config.requireText;
  const confirmDisabled = requireText ? inputValue !== requireText : false;

  return (
    <ResponsiveDialog open={Boolean(pendingConfirm)} onOpenChange={handleOpenChange}>
      <ResponsiveDialogContent
        aria-label={title}
        className="max-w-[420px]"
        onOpenAutoFocus={(e) => {
          e.preventDefault();
          cancelRef.current?.focus();
        }}
      >
        <ResponsiveDialogHeader>
          <ResponsiveDialogTitle>{title}</ResponsiveDialogTitle>
          <ResponsiveDialogDescription>{config.message}</ResponsiveDialogDescription>
        </ResponsiveDialogHeader>

        {requireText && (
          <div className="mt-2 px-4 md:px-0">
            <Label className="text-sm text-muted-foreground">
              Type <strong>{requireText}</strong> to confirm
            </Label>
            <Input
              type="text"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              aria-label={`Type ${requireText} to confirm`}
              className="mt-1"
            />
          </div>
        )}

        <ResponsiveDialogFooter className="mt-4">
          <Button ref={cancelRef} variant="outline" onClick={handleCancel}>
            {cancelLabel}
          </Button>
          <Button
            onClick={handleConfirm}
            disabled={confirmDisabled}
            variant={dangerous ? "destructive" : "default"}
          >
            {confirmLabel}
          </Button>
        </ResponsiveDialogFooter>
      </ResponsiveDialogContent>
    </ResponsiveDialog>
  );
}
