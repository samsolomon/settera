import { describe, it, expect, vi } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { useActionModalDraft } from "../hooks/useActionModalDraft.js";
import type { ModalActionFieldSetting } from "../utils/actionModalUtils.js";

const fields: ModalActionFieldSetting[] = [
  { key: "name", type: "text", title: "Name", default: "untitled" },
  { key: "enabled", type: "boolean", title: "Enabled" },
] as ModalActionFieldSetting[];

describe("useActionModalDraft", () => {
  it("initializes with empty draft when closed", () => {
    const { result } = renderHook(() =>
      useActionModalDraft(fields, undefined, false),
    );

    expect(result.current.draftValues).toEqual({});
  });

  it("resets to defaults when isOpen transitions to true", () => {
    const { result, rerender } = renderHook(
      ({ isOpen }) => useActionModalDraft(fields, undefined, isOpen),
      { initialProps: { isOpen: false } },
    );

    rerender({ isOpen: true });

    expect(result.current.draftValues).toEqual({
      name: "untitled",
      enabled: false,
    });
  });

  it("merges initialValues over field defaults", () => {
    const { result, rerender } = renderHook(
      ({ isOpen }) =>
        useActionModalDraft(fields, { name: "custom" }, isOpen),
      { initialProps: { isOpen: false } },
    );

    rerender({ isOpen: true });

    expect(result.current.draftValues).toEqual({
      name: "custom",
      enabled: false,
    });
  });

  it("setField updates individual draft field", () => {
    const { result, rerender } = renderHook(
      ({ isOpen }) => useActionModalDraft(fields, undefined, isOpen),
      { initialProps: { isOpen: false } },
    );

    rerender({ isOpen: true });

    act(() => {
      result.current.setField("name", "new name");
    });

    expect(result.current.draftValues.name).toBe("new name");
    expect(result.current.draftValues.enabled).toBe(false);
  });

  it("does not re-reset while isOpen stays true", () => {
    const { result, rerender } = renderHook(
      ({ isOpen }) => useActionModalDraft(fields, undefined, isOpen),
      { initialProps: { isOpen: false } },
    );

    rerender({ isOpen: true });

    act(() => {
      result.current.setField("name", "edited");
    });

    // Re-render with isOpen still true — should NOT reset
    rerender({ isOpen: true });

    expect(result.current.draftValues.name).toBe("edited");
  });

  it("resets again on close→open cycle", () => {
    const { result, rerender } = renderHook(
      ({ isOpen }) => useActionModalDraft(fields, undefined, isOpen),
      { initialProps: { isOpen: false } },
    );

    // Open
    rerender({ isOpen: true });
    act(() => {
      result.current.setField("name", "edited");
    });
    expect(result.current.draftValues.name).toBe("edited");

    // Close
    rerender({ isOpen: false });

    // Re-open
    rerender({ isOpen: true });
    expect(result.current.draftValues.name).toBe("untitled");
  });

  it("handles undefined fields gracefully", () => {
    const { result, rerender } = renderHook(
      ({ isOpen }) => useActionModalDraft(undefined, undefined, isOpen),
      { initialProps: { isOpen: false } },
    );

    rerender({ isOpen: true });

    expect(result.current.draftValues).toEqual({});
  });
});
