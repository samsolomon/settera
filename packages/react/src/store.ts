import type { PendingConfirm, SaveStatus } from "./context.js";

export interface SetteraValuesState {
  values: Record<string, unknown>;
  errors: Record<string, string>;
  saveStatus: Record<string, SaveStatus>;
  pendingConfirm: PendingConfirm | null;
}

type Listener = () => void;

/**
 * External store for SetteraValuesContext.
 *
 * Holds subscribed state (values, errors, saveStatus, pendingConfirm) that
 * notifies listeners on mutation, and pass-through refs (onChange, onValidate,
 * onAction) that are updated every render but never trigger re-renders.
 */
export class SetteraValuesStore {
  // ---- Subscribed state ----
  private _state: SetteraValuesState = {
    values: {},
    errors: {},
    saveStatus: {},
    pendingConfirm: null,
  };
  private _listeners = new Set<Listener>();

  // ---- Pass-through refs (no notification) ----
  private _onChange: (key: string, value: unknown) => void | Promise<void> =
    () => {};
  private _onValidate:
    | Record<string, (value: unknown) => string | null | Promise<string | null>>
    | undefined;
  private _onAction:
    | Record<string, (payload?: unknown) => void | Promise<void>>
    | undefined;

  // ---- Save machinery ----
  private _saveGeneration: Record<string, number> = {};
  private _saveTimers: Record<string, ReturnType<typeof setTimeout>> = {};
  private _mounted = true;

  // ---- Confirm ref (for resolveConfirm to read latest) ----
  private _pendingConfirmRef: PendingConfirm | null = null;

  // ---- Subscription API for useSyncExternalStore ----

  subscribe = (listener: Listener): (() => void) => {
    this._listeners.add(listener);
    return () => {
      this._listeners.delete(listener);
    };
  };

  getState = (): SetteraValuesState => {
    return this._state;
  };

  private _emit(): void {
    for (const listener of this._listeners) {
      listener();
    }
  }

  // ---- State setters ----

  /**
   * Update values state. Called during render — updates internal state silently
   * so children see new values via getSnapshot(). Does NOT emit to avoid
   * triggering useSyncExternalStore re-renders during the parent render.
   * Call emitChange() in a useLayoutEffect for memoized children.
   */
  setValues(values: Record<string, unknown>): void {
    if (values === this._state.values) return;
    this._state = { ...this._state, values };
  }

  /** Notify subscribers that state has changed. Safe to call from effects. */
  emitChange(): void {
    this._emit();
  }

  setValue = (key: string, value: unknown): void => {
    const result = this._onChange(key, value);

    if (result instanceof Promise) {
      const gen = (this._saveGeneration[key] ?? 0) + 1;
      this._saveGeneration[key] = gen;

      this._state = {
        ...this._state,
        saveStatus: { ...this._state.saveStatus, [key]: "saving" as const },
      };
      this._emit();

      result.then(
        () => {
          if (!this._mounted) return;
          if (this._saveGeneration[key] !== gen) return;
          this._state = {
            ...this._state,
            saveStatus: { ...this._state.saveStatus, [key]: "saved" as const },
          };
          this._emit();
          clearTimeout(this._saveTimers[key]);
          this._saveTimers[key] = setTimeout(() => {
            if (!this._mounted) return;
            if (this._saveGeneration[key] !== gen) return;
            this._state = {
              ...this._state,
              saveStatus: {
                ...this._state.saveStatus,
                [key]: "idle" as const,
              },
            };
            this._emit();
          }, 2000);
        },
        () => {
          if (!this._mounted) return;
          if (this._saveGeneration[key] !== gen) return;
          this._state = {
            ...this._state,
            saveStatus: { ...this._state.saveStatus, [key]: "error" as const },
          };
          this._emit();
        },
      );
    }
  };

  setError = (key: string, error: string | null): void => {
    if (error === null) {
      if (!(key in this._state.errors)) return;
      const next = { ...this._state.errors };
      delete next[key];
      this._state = { ...this._state, errors: next };
    } else {
      this._state = {
        ...this._state,
        errors: { ...this._state.errors, [key]: error },
      };
    }
    this._emit();
  };

  requestConfirm = (pending: PendingConfirm): void => {
    const prev = this._pendingConfirmRef;
    if (prev) prev.onCancel();
    this._pendingConfirmRef = pending;
    this._state = { ...this._state, pendingConfirm: pending };
    this._emit();
  };

  resolveConfirm = (confirmed: boolean): void => {
    const prev = this._pendingConfirmRef;
    if (!prev) return;
    this._pendingConfirmRef = null;
    this._state = { ...this._state, pendingConfirm: null };
    this._emit();
    if (confirmed) {
      prev.onConfirm();
    } else {
      prev.onCancel();
    }
  };

  // ---- Pass-through setters (no emit) ----

  setOnChange(fn: (key: string, value: unknown) => void | Promise<void>): void {
    this._onChange = fn;
  }

  setOnValidate(
    map:
      | Record<
          string,
          (value: unknown) => string | null | Promise<string | null>
        >
      | undefined,
  ): void {
    this._onValidate = map;
  }

  setOnAction(
    map:
      | Record<string, (payload?: unknown) => void | Promise<void>>
      | undefined,
  ): void {
    this._onAction = map;
  }

  // ---- Pass-through getters ----

  getOnValidate():
    | Record<string, (value: unknown) => string | null | Promise<string | null>>
    | undefined {
    return this._onValidate;
  }

  getOnAction():
    | Record<string, (payload?: unknown) => void | Promise<void>>
    | undefined {
    return this._onAction;
  }

  // ---- Lifecycle ----

  destroy(): void {
    this._mounted = false;
    for (const timer of Object.values(this._saveTimers)) {
      clearTimeout(timer);
    }
  }
}
