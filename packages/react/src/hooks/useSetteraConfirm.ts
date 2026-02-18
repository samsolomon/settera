import { useContext } from "react";
import { SetteraValuesContext } from "../context.js";
import type { PendingConfirm } from "../context.js";
import { useStoreSelector } from "./useStoreSelector.js";

export interface UseSetteraConfirmResult {
  /** The currently pending confirm dialog, or null if none */
  pendingConfirm: PendingConfirm | null;
  /** Resolve the pending confirm: true = confirm, false = cancel.
   *  When config.requireText is set, pass the user's typed text as the second argument. */
  resolveConfirm: (confirmed: boolean, text?: string) => void;
}

/**
 * Access the pending confirm dialog state.
 * Used by ConfirmDialog to render and resolve the dialog.
 */
export function useSetteraConfirm(): UseSetteraConfirmResult {
  const store = useContext(SetteraValuesContext);
  if (!store) {
    throw new Error("useSetteraConfirm must be used within a Settera component.");
  }

  const pendingConfirm = useStoreSelector(
    store,
    (state) => state.pendingConfirm,
  );

  return {
    pendingConfirm,
    resolveConfirm: store.resolveConfirm,
  };
}
