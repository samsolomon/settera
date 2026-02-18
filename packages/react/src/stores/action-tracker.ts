/**
 * Tracks async action loading state per action key.
 * Uses an inflight set to prevent duplicate invocations.
 */
export class ActionTracker {
  private _loading: Record<string, true> = {};
  private _inflight = new Set<string>();
  private _mounted = true;
  private _emit: () => void;

  constructor(emit: () => void) {
    this._emit = emit;
  }

  getActionLoading(): Record<string, true> {
    return this._loading;
  }

  invokeAction(
    key: string,
    handler: (payload?: unknown) => void | Promise<void>,
    payload?: unknown,
  ): void {
    if (this._inflight.has(key)) return;
    const result = handler(payload);
    if (!(result instanceof Promise)) return;
    this._inflight.add(key);
    this._loading = { ...this._loading, [key]: true as const };
    this._emit();
    result
      .catch((err: unknown) => {
        console.error(`[settera] Action "${key}" failed:`, err);
      })
      .finally(() => {
        this._inflight.delete(key);
        if (!this._mounted) return;
        const next = { ...this._loading };
        delete next[key];
        this._loading = next;
        this._emit();
      });
  }

  destroy(): void {
    this._mounted = false;
  }
}
