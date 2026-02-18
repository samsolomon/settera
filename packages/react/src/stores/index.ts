import {
  validateSettingValue,
  type SettingDefinition,
  type ValueSetting,
} from "@settera/schema";
import type { SaveStatus } from "./save-tracker.js";
import type { PendingConfirm } from "./confirm-manager.js";
import { CallbackRefs } from "./callback-refs.js";
import { SaveTracker } from "./save-tracker.js";
import { ErrorMap } from "./error-map.js";
import { ConfirmManager } from "./confirm-manager.js";
import { ActionTracker } from "./action-tracker.js";

const IS_DEV = process.env.NODE_ENV !== "production";

export type ValidationMode = "valid-only" | "eager-save";

export interface SetteraValuesState {
  values: Record<string, unknown>;
  errors: Record<string, string>;
  saveStatus: Record<string, SaveStatus>;
  pendingConfirm: PendingConfirm | null;
  actionLoading: Record<string, true>;
}

type Listener = () => void;

/**
 * Composite store for SetteraValuesContext.
 *
 * Delegates to focused sub-stores (CallbackRefs, SaveTracker, ErrorMap,
 * ConfirmManager, ActionTracker) while maintaining a single subscriber list
 * and aggregated state snapshot for useSyncExternalStore.
 */
export class SetteraValuesStore {
  private _values: Record<string, unknown> = {};
  private _listeners = new Set<Listener>();

  // Sub-stores
  private _callbacks = new CallbackRefs();
  private _saves: SaveTracker;
  private _errors: ErrorMap;
  private _confirms: ConfirmManager;
  private _actions: ActionTracker;
  private _validationMode: ValidationMode = "valid-only";

  // Cached state snapshot — rebuilt on emit
  private _snapshot: SetteraValuesState;

  constructor() {
    const emit = () => this._rebuildAndEmit();
    this._saves = new SaveTracker(emit);
    this._errors = new ErrorMap(emit);
    this._confirms = new ConfirmManager(emit);
    this._actions = new ActionTracker(emit);
    this._snapshot = this._buildSnapshot();
  }

  private _buildSnapshot(): SetteraValuesState {
    return {
      values: this._values,
      errors: this._errors.getErrors(),
      saveStatus: this._saves.getSaveStatus(),
      pendingConfirm: this._confirms.getPendingConfirm(),
      actionLoading: this._actions.getActionLoading(),
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
    const definition = this._callbacks.getSchemaLookup()?.(key);

    if (!definition) {
      this._applyRawValue(key, value);
      return;
    }

    if (definition.type === "action") {
      const message = `[settera] setValue("${key}") cannot target an action setting. Use useSetteraAction/invokeAction.`;
      if (IS_DEV) throw new Error(message);
      console.warn(message);
      return;
    }

    if (definition.disabled) return;
    if ("readonly" in definition && (definition as { readonly?: boolean }).readonly) return;

    const valueDefinition = definition as ValueSetting;
    const confirmConfig = valueDefinition.confirm;

    const syncError = validateSettingValue(definition, value);
    this._errors.setError(key, syncError);
    if (syncError && this._validationMode === "valid-only") {
      return;
    }

    const applyValue = () => {
      this._applyRawValue(key, value);
    };

    if (confirmConfig) {
      this._confirms.requestConfirm({
        key,
        config: confirmConfig,
        dangerous: !!definition.dangerous,
        onConfirm: applyValue,
        onCancel: () => {},
      });
    } else {
      applyValue();
    }
  };

  validate = async (key: string, valueOverride?: unknown): Promise<string | null> => {
    if (this._confirms.getPendingConfirm()?.key === key) return null;

    const definition = this._callbacks.getSchemaLookup()?.(key);
    if (!definition) return null;

    const currentValue =
      valueOverride !== undefined ? valueOverride : this._values[key];
    const syncError = validateSettingValue(definition, currentValue);
    if (syncError) {
      this._errors.setError(key, syncError);
      return syncError;
    }

    this._errors.setError(key, null);

    const asyncValidator = this._callbacks.getOnValidate()?.[key];
    if (asyncValidator) {
      try {
        const asyncError = await asyncValidator(currentValue);
        if (asyncError) {
          this._errors.setError(key, asyncError);
          return asyncError;
        }
      } catch (error) {
        const message = "Validation failed";
        this._errors.setError(key, message);
        if (IS_DEV) {
          console.error(`[settera] Async validation failed for "${key}":`, error);
        }
        return message;
      }
    }

    return null;
  };

  private _applyRawValue(key: string, value: unknown): void {
    const result = this._callbacks.getOnChange()(key, value);
    if (result instanceof Promise) {
      this._saves.trackSave(key, result);
    }
  }

  // ---- Actions ----

  invokeAction = (key: string, payload?: unknown): void => {
    const handler = this._callbacks.getOnAction()?.[key];
    if (!handler) return;
    this._actions.invokeAction(key, handler, payload);
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

  setSchemaLookup(fn: (key: string) => SettingDefinition | undefined): void {
    this._callbacks.setSchemaLookup(fn);
  }

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

  setValidationMode(mode: ValidationMode): void {
    this._validationMode = mode;
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
    this._actions.destroy();
  }
}
