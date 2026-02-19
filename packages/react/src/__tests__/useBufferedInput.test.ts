import { describe, it, expect, vi } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { useBufferedInput } from "../hooks/useBufferedInput.js";

function changeEvent(value: string) {
  return { target: { value } } as React.ChangeEvent<HTMLInputElement>;
}

function keyDownEvent(key: string) {
  return { key } as React.KeyboardEvent<HTMLInputElement>;
}

describe("useBufferedInput", () => {
  it("initializes localValue from committedValue", () => {
    const { result } = renderHook(() => useBufferedInput("hello", vi.fn()));
    expect(result.current.localValue).toBe("hello");
    expect(result.current.inputProps.value).toBe("hello");
  });

  it("tracks local changes without calling onCommit", () => {
    const onCommit = vi.fn();
    const { result } = renderHook(() => useBufferedInput("hello", onCommit));

    act(() => {
      result.current.inputProps.onChange(changeEvent("hello world"));
    });

    expect(result.current.localValue).toBe("hello world");
    expect(onCommit).not.toHaveBeenCalled();
  });

  it("commits on blur", () => {
    const onCommit = vi.fn();
    const { result } = renderHook(() => useBufferedInput("hello", onCommit));

    act(() => {
      result.current.inputProps.onFocus();
      result.current.inputProps.onChange(changeEvent("updated"));
    });

    act(() => {
      result.current.inputProps.onBlur();
    });

    expect(onCommit).toHaveBeenCalledWith("updated");
    expect(result.current.isFocused).toBe(false);
  });

  it("commits on Enter", () => {
    const onCommit = vi.fn();
    const { result } = renderHook(() => useBufferedInput("hello", onCommit));

    act(() => {
      result.current.inputProps.onChange(changeEvent("new value"));
      result.current.inputProps.onKeyDown(keyDownEvent("Enter"));
    });

    expect(onCommit).toHaveBeenCalledWith("new value");
  });

  it("reverts on Escape", () => {
    const onCommit = vi.fn();
    const { result } = renderHook(() => useBufferedInput("original", onCommit));

    act(() => {
      result.current.inputProps.onFocus();
      result.current.inputProps.onChange(changeEvent("changed"));
    });
    expect(result.current.localValue).toBe("changed");

    act(() => {
      result.current.inputProps.onKeyDown(keyDownEvent("Escape"));
    });

    expect(result.current.localValue).toBe("original");
    expect(onCommit).not.toHaveBeenCalled();
  });

  it("syncs external value when not focused", () => {
    const onCommit = vi.fn();
    const { result, rerender } = renderHook(
      ({ value }) => useBufferedInput(value, onCommit),
      { initialProps: { value: "initial" } },
    );

    rerender({ value: "external update" });

    expect(result.current.localValue).toBe("external update");
  });

  it("does not sync external value while focused", () => {
    const onCommit = vi.fn();
    const { result, rerender } = renderHook(
      ({ value }) => useBufferedInput(value, onCommit),
      { initialProps: { value: "initial" } },
    );

    act(() => {
      result.current.inputProps.onFocus();
      result.current.inputProps.onChange(changeEvent("typing..."));
    });

    rerender({ value: "external update" });

    expect(result.current.localValue).toBe("typing...");
  });

  it("tracks isFocused state", () => {
    const { result } = renderHook(() => useBufferedInput("", vi.fn()));

    expect(result.current.isFocused).toBe(false);

    act(() => {
      result.current.inputProps.onFocus();
    });
    expect(result.current.isFocused).toBe(true);

    act(() => {
      result.current.inputProps.onBlur();
    });
    expect(result.current.isFocused).toBe(false);
  });

  it("ignores unrelated key presses", () => {
    const onCommit = vi.fn();
    const { result } = renderHook(() => useBufferedInput("hello", onCommit));

    act(() => {
      result.current.inputProps.onChange(changeEvent("hello!"));
      result.current.inputProps.onKeyDown(keyDownEvent("a"));
    });

    expect(onCommit).not.toHaveBeenCalled();
    expect(result.current.localValue).toBe("hello!");
  });
});
