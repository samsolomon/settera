import { describe, it, expect } from "vitest";
import {
  SCHEMA_VERSION,
  SettaraProvider,
  SettaraRenderer,
  useSettara,
  useSettaraSetting,
  useSettaraNavigation,
  evaluateVisibility,
  BooleanSwitch,
  SettingRow,
} from "../index.js";

describe("@settara/ui", () => {
  it("re-exports SCHEMA_VERSION as 1.0", () => {
    expect(SCHEMA_VERSION).toBe("1.0");
  });

  it("re-exports react layer components", () => {
    expect(typeof SettaraProvider).toBe("function");
    expect(typeof SettaraRenderer).toBe("function");
  });

  it("re-exports hooks", () => {
    expect(typeof useSettara).toBe("function");
    expect(typeof useSettaraSetting).toBe("function");
    expect(typeof useSettaraNavigation).toBe("function");
    expect(typeof evaluateVisibility).toBe("function");
  });

  it("exports UI components", () => {
    expect(typeof BooleanSwitch).toBe("function");
    expect(typeof SettingRow).toBe("function");
  });
});
