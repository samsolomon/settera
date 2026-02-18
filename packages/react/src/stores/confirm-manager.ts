import type { PendingConfirm } from "../context.js";

/**
 * Manages confirm dialog state for settings with confirm config.
 */
export class ConfirmManager {
  private _pendingConfirm: PendingConfirm | null = null;
  private _emit: () => void;

  constructor(emit: () => void) {
    this._emit = emit;
  }

  getPendingConfirm(): PendingConfirm | null {
    return this._pendingConfirm;
  }

  requestConfirm(pending: PendingConfirm): void {
    const prev = this._pendingConfirm;
    if (prev) prev.onCancel();
    this._pendingConfirm = pending;
    this._emit();
  }

  resolveConfirm(confirmed: boolean, text?: string): void {
    const prev = this._pendingConfirm;
    if (!prev) return;

    // When requireText is set and the user confirms, the typed text must match
    if (confirmed && prev.config.requireText) {
      if (text !== prev.config.requireText) return; // stay open
    }

    this._pendingConfirm = null;
    this._emit();
    if (confirmed) {
      prev.onConfirm();
    } else {
      prev.onCancel();
    }
  }
}
