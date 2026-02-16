import { describe, it, expect } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { useRovingTabIndex } from "../hooks/useRovingTabIndex.js";
import type { KeyboardEvent } from "react";

function makeKeyEvent(key: string): KeyboardEvent {
  let prevented = false;
  return {
    key,
    preventDefault: () => {
      prevented = true;
    },
    get defaultPrevented() {
      return prevented;
    },
  } as unknown as KeyboardEvent;
}

describe("useRovingTabIndex", () => {
  it("starts at index 0", () => {
    const { result } = renderHook(() => useRovingTabIndex({ itemCount: 5 }));
    expect(result.current.focusedIndex).toBe(0);
  });

  it("getTabIndex returns 0 for focused index and -1 for others", () => {
    const { result } = renderHook(() => useRovingTabIndex({ itemCount: 5 }));
    expect(result.current.getTabIndex(0)).toBe(0);
    expect(result.current.getTabIndex(1)).toBe(-1);
    expect(result.current.getTabIndex(4)).toBe(-1);
  });

  it("ArrowDown moves focus forward", () => {
    const { result } = renderHook(() => useRovingTabIndex({ itemCount: 5 }));
    act(() => {
      result.current.onKeyDown(makeKeyEvent("ArrowDown"));
    });
    expect(result.current.focusedIndex).toBe(1);
  });

  it("ArrowUp moves focus backward", () => {
    const { result } = renderHook(() => useRovingTabIndex({ itemCount: 5 }));
    // Move to index 2 first
    act(() => result.current.setFocusedIndex(2));
    act(() => {
      result.current.onKeyDown(makeKeyEvent("ArrowUp"));
    });
    expect(result.current.focusedIndex).toBe(1);
  });

  it("wraps from last to first on ArrowDown", () => {
    const { result } = renderHook(() =>
      useRovingTabIndex({ itemCount: 3, wrap: true }),
    );
    act(() => result.current.setFocusedIndex(2));
    act(() => {
      result.current.onKeyDown(makeKeyEvent("ArrowDown"));
    });
    expect(result.current.focusedIndex).toBe(0);
  });

  it("wraps from first to last on ArrowUp", () => {
    const { result } = renderHook(() =>
      useRovingTabIndex({ itemCount: 3, wrap: true }),
    );
    act(() => {
      result.current.onKeyDown(makeKeyEvent("ArrowUp"));
    });
    expect(result.current.focusedIndex).toBe(2);
  });

  it("does not wrap when wrap is false", () => {
    const { result } = renderHook(() =>
      useRovingTabIndex({ itemCount: 3, wrap: false }),
    );
    act(() => result.current.setFocusedIndex(2));
    act(() => {
      result.current.onKeyDown(makeKeyEvent("ArrowDown"));
    });
    expect(result.current.focusedIndex).toBe(2);

    act(() => result.current.setFocusedIndex(0));
    act(() => {
      result.current.onKeyDown(makeKeyEvent("ArrowUp"));
    });
    expect(result.current.focusedIndex).toBe(0);
  });

  it("Home moves to first item", () => {
    const { result } = renderHook(() => useRovingTabIndex({ itemCount: 5 }));
    act(() => result.current.setFocusedIndex(3));
    act(() => {
      result.current.onKeyDown(makeKeyEvent("Home"));
    });
    expect(result.current.focusedIndex).toBe(0);
  });

  it("End moves to last item", () => {
    const { result } = renderHook(() => useRovingTabIndex({ itemCount: 5 }));
    act(() => {
      result.current.onKeyDown(makeKeyEvent("End"));
    });
    expect(result.current.focusedIndex).toBe(4);
  });

  it("preventDefault is called on handled keys", () => {
    const { result } = renderHook(() => useRovingTabIndex({ itemCount: 5 }));
    const event = makeKeyEvent("ArrowDown");
    act(() => {
      result.current.onKeyDown(event);
    });
    expect(event.defaultPrevented).toBe(true);
  });

  it("does not preventDefault on unrelated keys", () => {
    const { result } = renderHook(() => useRovingTabIndex({ itemCount: 5 }));
    const event = makeKeyEvent("Tab");
    act(() => {
      result.current.onKeyDown(event);
    });
    expect(event.defaultPrevented).toBe(false);
  });

  it("clamps focusedIndex when itemCount shrinks", () => {
    const { result, rerender } = renderHook(
      ({ itemCount }) => useRovingTabIndex({ itemCount }),
      { initialProps: { itemCount: 5 } },
    );
    act(() => result.current.setFocusedIndex(4));
    expect(result.current.focusedIndex).toBe(4);

    rerender({ itemCount: 3 });
    expect(result.current.focusedIndex).toBe(2);
  });

  it("uses ArrowLeft/Right for horizontal orientation", () => {
    const { result } = renderHook(() =>
      useRovingTabIndex({ itemCount: 5, orientation: "horizontal" }),
    );
    act(() => {
      result.current.onKeyDown(makeKeyEvent("ArrowRight"));
    });
    expect(result.current.focusedIndex).toBe(1);

    act(() => {
      result.current.onKeyDown(makeKeyEvent("ArrowLeft"));
    });
    expect(result.current.focusedIndex).toBe(0);

    // ArrowDown should not move in horizontal mode
    act(() => {
      result.current.onKeyDown(makeKeyEvent("ArrowDown"));
    });
    expect(result.current.focusedIndex).toBe(0);
  });
});
