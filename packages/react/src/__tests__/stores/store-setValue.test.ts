import { describe, it, expect, vi } from "vitest";
import { SetteraValuesStore } from "../../stores/index.js";
import type { SettingDefinition } from "@settera/schema";

function makeStore(definitions: SettingDefinition[], onChange = vi.fn()) {
  const store = new SetteraValuesStore();
  const lookup = (key: string) => definitions.find((d) => d.key === key);
  store.setSchemaLookup(lookup);
  store.setOnChange(onChange);
  return { store, onChange };
}

describe("store.setValue pipeline", () => {
  it("calls onChange for a normal setting", () => {
    const { store, onChange } = makeStore([
      { key: "theme", title: "Theme", type: "select", options: [{ label: "Dark", value: "dark" }] },
    ]);
    store.setValue("theme", "dark");
    expect(onChange).toHaveBeenCalledWith("theme", "dark");
  });

  it("blocks disabled settings", () => {
    const { store, onChange } = makeStore([
      { key: "name", title: "Name", type: "text", disabled: true },
    ]);
    store.setValue("name", "test");
    expect(onChange).not.toHaveBeenCalled();
  });

  it("blocks readonly settings", () => {
    const { store, onChange } = makeStore([
      { key: "name", title: "Name", type: "text", readonly: true },
    ]);
    store.setValue("name", "test");
    expect(onChange).not.toHaveBeenCalled();
  });

  it("sets sync validation error", () => {
    const { store, onChange } = makeStore([
      { key: "age", title: "Age", type: "number", validation: { min: 0, max: 120 } },
    ]);
    store.setValue("age", 200);
    // default mode is valid-only: invalid values should not be persisted
    expect(onChange).not.toHaveBeenCalled();
    expect(store.getState().errors["age"]).toBeTruthy();
  });

  it("supports eager-save mode for invalid values", () => {
    const { store, onChange } = makeStore([
      { key: "age", title: "Age", type: "number", validation: { min: 0, max: 120 } },
    ]);
    store.setValidationMode("eager-save");
    store.setValue("age", 200);
    expect(onChange).toHaveBeenCalledWith("age", 200);
    expect(store.getState().errors["age"]).toBeTruthy();
  });

  it("intercepts with confirm dialog", () => {
    const { store, onChange } = makeStore([
      {
        key: "delete",
        title: "Delete Account",
        type: "boolean",
        confirm: { title: "Are you sure?" },
      },
    ]);
    store.setValue("delete", true);
    // onChange should NOT have been called yet
    expect(onChange).not.toHaveBeenCalled();
    // Confirm dialog should be pending
    expect(store.getState().pendingConfirm).not.toBeNull();
    expect(store.getState().pendingConfirm?.key).toBe("delete");
  });

  it("calls onChange after confirm resolution", () => {
    const { store, onChange } = makeStore([
      {
        key: "delete",
        title: "Delete Account",
        type: "boolean",
        confirm: { title: "Are you sure?" },
      },
    ]);
    store.setValue("delete", true);
    expect(onChange).not.toHaveBeenCalled();

    // Resolve confirm
    store.resolveConfirm(true);
    expect(onChange).toHaveBeenCalledWith("delete", true);
  });

  it("does not call onChange after confirm cancellation", () => {
    const { store, onChange } = makeStore([
      {
        key: "delete",
        title: "Delete Account",
        type: "boolean",
        confirm: { title: "Are you sure?" },
      },
    ]);
    store.setValue("delete", true);
    store.resolveConfirm(false);
    expect(onChange).not.toHaveBeenCalled();
  });

  it("falls through to raw onChange when no schema lookup", () => {
    const onChange = vi.fn();
    const store = new SetteraValuesStore();
    store.setOnChange(onChange);
    // No setSchemaLookup — definition lookup returns undefined
    store.setValue("unknown", "value");
    expect(onChange).toHaveBeenCalledWith("unknown", "value");
  });

  it("tracks async save from onChange", async () => {
    let resolve!: () => void;
    const asyncOnChange = vi.fn(
      () => new Promise<void>((r) => { resolve = r; }),
    );
    const { store } = makeStore(
      [{ key: "name", title: "Name", type: "text" }],
      asyncOnChange,
    );
    store.setValue("name", "hello");
    expect(store.getState().saveStatus["name"]).toBe("saving");

    resolve();
    await new Promise((r) => setTimeout(r, 0));
    expect(store.getState().saveStatus["name"]).toBe("saved");
  });

  it("throws when setValue targets an action setting", () => {
    const { store } = makeStore([
      {
        key: "reset",
        title: "Reset",
        type: "action",
        buttonLabel: "Reset",
        actionType: "callback",
      },
    ]);
    expect(() => store.setValue("reset", true)).toThrow(
      'setValue("reset") cannot target an action setting',
    );
  });
});

describe("store.validate", () => {
  it("returns sync validation error", async () => {
    const { store } = makeStore([
      { key: "age", title: "Age", type: "number", validation: { min: 0, max: 120 } },
    ]);
    store.setValues({ age: 200 });
    const error = await store.validate("age");
    expect(error).toBeTruthy();
    expect(store.getState().errors["age"]).toBeTruthy();
  });

  it("returns null for valid value", async () => {
    const { store } = makeStore([
      { key: "age", title: "Age", type: "number", validation: { min: 0, max: 120 } },
    ]);
    store.setValues({ age: 25 });
    const error = await store.validate("age");
    expect(error).toBeNull();
  });

  it("runs async validation", async () => {
    const { store } = makeStore([
      { key: "name", title: "Name", type: "text" },
    ]);
    store.setValues({ name: "taken" });
    store.setOnValidate({
      name: async (value) => (value === "taken" ? "Name already taken" : null),
    });
    const error = await store.validate("name");
    expect(error).toBe("Name already taken");
    expect(store.getState().errors["name"]).toBe("Name already taken");
  });

  it("maps async validator exceptions to a validation error", async () => {
    const consoleSpy = vi.spyOn(console, "error").mockImplementation(() => {});
    const { store } = makeStore([
      { key: "name", title: "Name", type: "text" },
    ]);
    store.setValues({ name: "boom" });
    store.setOnValidate({
      name: async () => {
        throw new Error("network down");
      },
    });
    const error = await store.validate("name");
    expect(error).toBe("Validation failed");
    expect(store.getState().errors["name"]).toBe("Validation failed");
    expect(consoleSpy).toHaveBeenCalledWith(
      '[settera] Async validation failed for "name":',
      expect.any(Error),
    );
    consoleSpy.mockRestore();
  });

  it("suppresses validation when confirm is pending for the key", async () => {
    const { store } = makeStore([
      {
        key: "delete",
        title: "Delete",
        type: "boolean",
        confirm: { title: "Sure?" },
      },
    ]);
    // Trigger confirm
    store.setValue("delete", true);
    expect(store.getState().pendingConfirm?.key).toBe("delete");

    const error = await store.validate("delete");
    expect(error).toBeNull();
  });

  it("uses valueOverride when provided", async () => {
    const { store } = makeStore([
      { key: "age", title: "Age", type: "number", validation: { min: 0, max: 120 } },
    ]);
    store.setValues({ age: 25 });
    // Override with invalid value
    const error = await store.validate("age", 200);
    expect(error).toBeTruthy();
  });

  it("returns null for unknown key", async () => {
    const { store } = makeStore([]);
    const error = await store.validate("nonexistent");
    expect(error).toBeNull();
  });
});
