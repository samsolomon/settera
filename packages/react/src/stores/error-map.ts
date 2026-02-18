/**
 * Manages per-setting validation error state.
 */
export class ErrorMap {
  private _errors: Record<string, string> = {};
  private _emit: () => void;

  constructor(emit: () => void) {
    this._emit = emit;
  }

  getErrors(): Record<string, string> {
    return this._errors;
  }

  setError(key: string, error: string | null): void {
    if (error === null) {
      if (!(key in this._errors)) return;
      const next = { ...this._errors };
      delete next[key];
      this._errors = next;
    } else {
      if (this._errors[key] === error) return;
      this._errors = { ...this._errors, [key]: error };
    }
    this._emit();
  }
}
