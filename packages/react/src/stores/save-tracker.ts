import type { SaveStatus } from "../context.js";

/**
 * Tracks async save state per setting key.
 * Uses a generation counter to safely ignore stale promise resolutions.
 * Transitions: idle → saving → saved (auto-reverts to idle after 2s) or error.
 */
export class SaveTracker {
  private _saveStatus: Record<string, SaveStatus> = {};
  private _generation: Record<string, number> = {};
  private _timers: Record<string, ReturnType<typeof setTimeout>> = {};
  private _mounted = true;
  private _emit: () => void;

  constructor(emit: () => void) {
    this._emit = emit;
  }

  getSaveStatus(): Record<string, SaveStatus> {
    return this._saveStatus;
  }

  /**
   * Track an async save result. Called when onChange returns a Promise.
   * Sets status to "saving" immediately and resolves to "saved"/"error".
   */
  trackSave(key: string, promise: Promise<void>): void {
    const gen = (this._generation[key] ?? 0) + 1;
    this._generation[key] = gen;

    this._saveStatus = { ...this._saveStatus, [key]: "saving" as const };
    this._emit();

    promise.then(
      () => {
        if (!this._mounted) return;
        if (this._generation[key] !== gen) return;
        this._saveStatus = { ...this._saveStatus, [key]: "saved" as const };
        this._emit();
        clearTimeout(this._timers[key]);
        this._timers[key] = setTimeout(() => {
          if (!this._mounted) return;
          if (this._generation[key] !== gen) return;
          this._saveStatus = { ...this._saveStatus, [key]: "idle" as const };
          this._emit();
        }, 2000);
      },
      (err) => {
        if (!this._mounted) return;
        if (this._generation[key] !== gen) return;
        console.error(`[settera] Save failed for "${key}":`, err);
        this._saveStatus = { ...this._saveStatus, [key]: "error" as const };
        this._emit();
      },
    );
  }

  destroy(): void {
    this._mounted = false;
    for (const timer of Object.values(this._timers)) {
      clearTimeout(timer);
    }
  }
}
