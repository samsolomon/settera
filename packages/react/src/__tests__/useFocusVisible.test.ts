import { describe, it, expect } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { useFocusVisible } from "../hooks/useFocusVisible.js";

describe("useFocusVisible", () => {
  it("initializes as not focus-visible", () => {
    const { result } = renderHook(() => useFocusVisible());
    expect(result.current.isFocusVisible).toBe(false);
  });

  it("shows focus ring for keyboard focus (no prior pointerDown)", () => {
    const { result } = renderHook(() => useFocusVisible());

    act(() => {
      result.current.focusVisibleProps.onFocus();
    });

    expect(result.current.isFocusVisible).toBe(true);
  });

  it("hides focus ring for pointer focus (pointerDown before focus)", () => {
    const { result } = renderHook(() => useFocusVisible());

    act(() => {
      result.current.focusVisibleProps.onPointerDown();
      result.current.focusVisibleProps.onFocus();
    });

    expect(result.current.isFocusVisible).toBe(false);
  });

  it("clears focus ring on blur", () => {
    const { result } = renderHook(() => useFocusVisible());

    act(() => {
      result.current.focusVisibleProps.onFocus();
    });
    expect(result.current.isFocusVisible).toBe(true);

    act(() => {
      result.current.focusVisibleProps.onBlur();
    });
    expect(result.current.isFocusVisible).toBe(false);
  });

  it("resets pointerDown flag after focus so next keyboard focus works", () => {
    const { result } = renderHook(() => useFocusVisible());

    // First: pointer focus
    act(() => {
      result.current.focusVisibleProps.onPointerDown();
      result.current.focusVisibleProps.onFocus();
    });
    expect(result.current.isFocusVisible).toBe(false);

    act(() => {
      result.current.focusVisibleProps.onBlur();
    });

    // Second: keyboard focus (no pointerDown)
    act(() => {
      result.current.focusVisibleProps.onFocus();
    });
    expect(result.current.isFocusVisible).toBe(true);
  });
});
