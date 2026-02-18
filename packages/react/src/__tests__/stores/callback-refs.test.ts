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
});
