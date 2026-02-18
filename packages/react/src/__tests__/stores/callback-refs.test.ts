import { describe, it, expect, vi } from "vitest";
import { CallbackRefs } from "../../stores/callback-refs.js";

describe("CallbackRefs", () => {
  it("returns a noop onChange by default", () => {
    const refs = new CallbackRefs();
    expect(refs.getOnChange()("key", "val")).toBeUndefined();
  });

  it("stores and returns onChange", () => {
    const refs = new CallbackRefs();
    const fn = vi.fn();
    refs.setOnChange(fn);
    refs.getOnChange()("key", "val");
    expect(fn).toHaveBeenCalledWith("key", "val");
  });

  it("returns undefined for onValidate by default", () => {
    const refs = new CallbackRefs();
    expect(refs.getOnValidate()).toBeUndefined();
  });

  it("stores and returns onValidate", () => {
    const refs = new CallbackRefs();
    const map = { name: () => null };
    refs.setOnValidate(map);
    expect(refs.getOnValidate()).toBe(map);
  });

  it("returns undefined for onAction by default", () => {
    const refs = new CallbackRefs();
    expect(refs.getOnAction()).toBeUndefined();
  });

  it("stores and returns onAction", () => {
    const refs = new CallbackRefs();
    const map = { reset: vi.fn() };
    refs.setOnAction(map);
    expect(refs.getOnAction()).toBe(map);
  });

  it("returns undefined for schemaLookup by default", () => {
    const refs = new CallbackRefs();
    expect(refs.getSchemaLookup()).toBeUndefined();
  });

  it("stores and returns schemaLookup", () => {
    const refs = new CallbackRefs();
    const fn = (key: string) => (key === "name" ? { key: "name", title: "Name", type: "text" as const } : undefined);
    refs.setSchemaLookup(fn);
    expect(refs.getSchemaLookup()).toBe(fn);
    expect(refs.getSchemaLookup()!("name")).toEqual({ key: "name", title: "Name", type: "text" });
    expect(refs.getSchemaLookup()!("missing")).toBeUndefined();
  });
});
