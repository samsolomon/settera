import { describe, it, expect } from "vitest";
import { renderHook } from "@testing-library/react";
import {
  EMPTY_OPTION_VALUE_BASE,
  useEmptyOptionValue,
} from "../settera/settera-select-utils";

describe("EMPTY_OPTION_VALUE_BASE", () => {
  it("is a string constant", () => {
    expect(typeof EMPTY_OPTION_VALUE_BASE).toBe("string");
    expect(EMPTY_OPTION_VALUE_BASE).toBe("__settera_empty_option__");
  });
});

describe("useEmptyOptionValue", () => {
  it("returns base value when no collision", () => {
    const options = [
      { value: "a" },
      { value: "b" },
    ];
    const { result } = renderHook(() => useEmptyOptionValue(options));
    expect(result.current).toBe(EMPTY_OPTION_VALUE_BASE);
  });

  it("returns suffixed value when base collides", () => {
    const options = [
      { value: EMPTY_OPTION_VALUE_BASE },
      { value: "other" },
    ];
    const { result } = renderHook(() => useEmptyOptionValue(options));
    expect(result.current).toBe(`${EMPTY_OPTION_VALUE_BASE}_1`);
  });

  it("increments suffix on multiple collisions", () => {
    const options = [
      { value: EMPTY_OPTION_VALUE_BASE },
      { value: `${EMPTY_OPTION_VALUE_BASE}_1` },
    ];
    const { result } = renderHook(() => useEmptyOptionValue(options));
    expect(result.current).toBe(`${EMPTY_OPTION_VALUE_BASE}_2`);
  });
});
