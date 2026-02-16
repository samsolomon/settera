import { describe, it, expect } from "vitest";
import {
  SCHEMA_VERSION,
  SettaraProvider,
  SettaraRenderer,
  useSettara,
  useSettaraSetting,
  useSettaraAction,
  useSettaraNavigation,
  useSettaraSearch,
  evaluateVisibility,
  validateSettingValue,
  BooleanSwitch,
  SettingRow,
  TextInput,
  NumberInput,
  Select,
  ActionButton,
  SettaraSearch,
  SettaraSetting,
  SettaraSection,
  SettaraPage,
  SettaraSidebar,
  SettaraLayout,
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
    expect(typeof useSettaraAction).toBe("function");
    expect(typeof useSettaraNavigation).toBe("function");
    expect(typeof useSettaraSearch).toBe("function");
    expect(typeof evaluateVisibility).toBe("function");
    expect(typeof validateSettingValue).toBe("function");
  });

  it("exports UI components", () => {
    expect(typeof BooleanSwitch).toBe("function");
    expect(typeof SettingRow).toBe("function");
    expect(typeof TextInput).toBe("function");
    expect(typeof NumberInput).toBe("function");
    expect(typeof Select).toBe("function");
    expect(typeof ActionButton).toBe("function");
  });

  it("exports SettaraSearch", () => {
    expect(typeof SettaraSearch).toBe("function");
  });

  it("exports layout components", () => {
    expect(typeof SettaraSetting).toBe("function");
    expect(typeof SettaraSection).toBe("function");
    expect(typeof SettaraPage).toBe("function");
    expect(typeof SettaraSidebar).toBe("function");
    expect(typeof SettaraLayout).toBe("function");
  });
});
