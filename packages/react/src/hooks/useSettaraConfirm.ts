import { useContext } from "react";
import { SettaraValuesContext } from "../context.js";
import type { PendingConfirm } from "../context.js";

export interface UseSettaraConfirmResult {
  /** The currently pending confirm dialog, or null if none */
  pendingConfirm: PendingConfirm | null;
  /** Resolve the pending confirm: true = confirm, false = cancel */
  resolveConfirm: (confirmed: boolean) => void;
}

/**
 * Access the pending confirm dialog state.
 * Used by ConfirmDialog to render and resolve the dialog.
 */
export function useSettaraConfirm(): UseSettaraConfirmResult {
  const ctx = useContext(SettaraValuesContext);
  if (!ctx) {
    throw new Error("useSettaraConfirm must be used within a SettaraRenderer.");
  }
  return {
    pendingConfirm: ctx.pendingConfirm,
    resolveConfirm: ctx.resolveConfirm,
  };
}
