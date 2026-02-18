import { describe, it, expect, vi } from "vitest";
import { ErrorMap } from "../../stores/error-map.js";

describe("ErrorMap", () => {
  it("starts with empty errors", () => {
    const errors = new ErrorMap(() => {});
    expect(errors.getErrors()).toEqual({});
  });

  it("sets an error and emits", () => {
    const emit = vi.fn();
    const errors = new ErrorMap(emit);
    errors.setError("name", "Required");
    expect(errors.getErrors()).toEqual({ name: "Required" });
    expect(emit).toHaveBeenCalledTimes(1);
  });

  it("clears an error by setting null", () => {
    const emit = vi.fn();
    const errors = new ErrorMap(emit);
    errors.setError("name", "Required");
    errors.setError("name", null);
    expect(errors.getErrors()).toEqual({});
    expect(emit).toHaveBeenCalledTimes(2);
  });

  it("does not emit when clearing a non-existent error", () => {
    const emit = vi.fn();
    const errors = new ErrorMap(emit);
    errors.setError("name", null);
    expect(emit).not.toHaveBeenCalled();
  });

  it("overwrites existing error", () => {
    const emit = vi.fn();
    const errors = new ErrorMap(emit);
    errors.setError("name", "Required");
    errors.setError("name", "Too short");
    expect(errors.getErrors()).toEqual({ name: "Too short" });
  });

  it("does not emit when setting the same error value", () => {
    const emit = vi.fn();
    const errors = new ErrorMap(emit);
    errors.setError("name", "Required");
    emit.mockClear();
    errors.setError("name", "Required");
    expect(emit).not.toHaveBeenCalled();
  });

  it("tracks multiple keys independently", () => {
    const errors = new ErrorMap(() => {});
    errors.setError("name", "Required");
    errors.setError("email", "Invalid");
    expect(errors.getErrors()).toEqual({
      name: "Required",
      email: "Invalid",
    });
    errors.setError("name", null);
    expect(errors.getErrors()).toEqual({ email: "Invalid" });
  });
});
