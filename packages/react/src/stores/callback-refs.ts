import type { SettingDefinition } from "@settera/schema";

/**
 * Holds pass-through callback refs (onChange, onValidate, onAction, schemaLookup).
 * These are updated every render but never trigger re-renders.
 */
export class CallbackRefs {
  private _onChange: (key: string, value: unknown) => void | Promise<void> =
    () => {};
  private _onValidate:
    | Record<string, (value: unknown) => string | null | Promise<string | null>>
    | undefined;
  private _onAction:
    | Record<string, (payload?: unknown) => void | Promise<void>>
    | undefined;
  private _schemaLookup:
    | ((key: string) => SettingDefinition | undefined)
    | undefined;

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

  getOnChange(): (key: string, value: unknown) => void | Promise<void> {
    return this._onChange;
  }

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

  setSchemaLookup(
    fn: (key: string) => SettingDefinition | undefined,
  ): void {
    this._schemaLookup = fn;
  }

  getSchemaLookup():
    | ((key: string) => SettingDefinition | undefined)
    | undefined {
    return this._schemaLookup;
  }
}
