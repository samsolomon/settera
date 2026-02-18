import type { PendingConfirm, SaveStatus } from "../context.js";
import { CallbackRefs } from "./callback-refs.js";
import { SaveTracker } from "./save-tracker.js";
import { ErrorMap } from "./error-map.js";
import { ConfirmManager } from "./confirm-manager.js";

export interface SetteraValuesState {
  values: Record<string, unknown>;
  errors: Record<string, string>;
  saveStatus: Record<string, SaveStatus>;
  pendingConfirm: PendingConfirm | null;
}

type Listener = () => void;

/**
 * Composite store for SetteraValuesContext.
 *
 * Delegates to focused sub-stores (CallbackRefs, SaveTracker, ErrorMap,
 * ConfirmManager) while maintaining a single subscriber list and aggregated
 * state snapshot for useSyncExternalStore.
 */
export class SetteraValuesStore {
  private _values: Record<string, unknown> = {};
  private _listeners = new Set<Listener>();

  // Sub-stores
  private _callbacks = new CallbackRefs();
  private _saves: SaveTracker;
  private _errors: ErrorMap;
  private _confirms: ConfirmManager;

  // Cached state snapshot — rebuilt on emit
  private _snapshot: SetteraValuesState;

  constructor() {
    const emit = () => this._rebuildAndEmit();
    this._saves = new SaveTracker(emit);
    this._errors = new ErrorMap(emit);
    this._confirms = new ConfirmManager(emit);
    this._snapshot = this._buildSnapshot();
  }

  private _buildSnapshot(): SetteraValuesState {
    return {
      values: this._values,
      errors: this._errors.getErrors(),
      saveStatus: this._saves.getSaveStatus(),
      pendingConfirm: this._confirms.getPendingConfirm(),
    };
  }

  private _rebuildAndEmit(): void {
    this._snapshot = this._buildSnapshot();
    for (const listener of this._listeners) {
      listener();
    }
  }

  // ---- Subscription API for useSyncExternalStore ----

  subscribe = (listener: Listener): (() => void) => {
    this._listeners.add(listener);
    return () => {
      this._listeners.delete(listener);
    };
  };

  getState = (): SetteraValuesState => {
    return this._snapshot;
  };

  // ---- Values ----

  /**
   * Update values state. Called during render — updates internal state silently
   * so children see new values via getSnapshot(). Does NOT emit to avoid
   * triggering useSyncExternalStore re-renders during the parent render.
   * Call emitChange() in a useLayoutEffect for memoized children.
   */
  setValues(values: Record<string, unknown>): void {
    if (values === this._values) return;
    this._values = values;
    this._snapshot = this._buildSnapshot();
  }

  /** Notify subscribers that state has changed. Safe to call from effects. */
  emitChange(): void {
    this._rebuildAndEmit();
  }

  setValue = (key: string, value: unknown): void => {
    const result = this._callbacks.getOnChange()(key, value);
    if (result instanceof Promise) {
      this._saves.trackSave(key, result);
    }
  };

  // ---- Errors ----

  setError = (key: string, error: string | null): void => {
    this._errors.setError(key, error);
  };

  // ---- Confirm ----

  requestConfirm = (pending: PendingConfirm): void => {
    this._confirms.requestConfirm(pending);
  };

  resolveConfirm = (confirmed: boolean, text?: string): void => {
    this._confirms.resolveConfirm(confirmed, text);
  };

  // ---- Pass-through setters (no emit) ----

  setOnChange(fn: (key: string, value: unknown) => void | Promise<void>): void {
    this._callbacks.setOnChange(fn);
  }

  setOnValidate(
    map:
      | Record<
          string,
          (value: unknown) => string | null | Promise<string | null>
        >
      | undefined,
  ): void {
    this._callbacks.setOnValidate(map);
  }

  setOnAction(
    map:
      | Record<string, (payload?: unknown) => void | Promise<void>>
      | undefined,
  ): void {
    this._callbacks.setOnAction(map);
  }

  // ---- Pass-through getters ----

  getOnValidate():
    | Record<string, (value: unknown) => string | null | Promise<string | null>>
    | undefined {
    return this._callbacks.getOnValidate();
  }

  getOnAction():
    | Record<string, (payload?: unknown) => void | Promise<void>>
    | undefined {
    return this._callbacks.getOnAction();
  }

  // ---- Lifecycle ----

  destroy(): void {
    this._saves.destroy();
  }
}
