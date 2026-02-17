import { describe, it, expect } from "vitest";
import {
  SCHEMA_VERSION,
  SetteraProvider,
  SetteraRenderer,
  useSettera,
  useSetteraSetting,
  useSetteraAction,
  useSetteraNavigation,
  useSetteraSearch,
  useRovingTabIndex,
  useSetteraGlobalKeys,
  evaluateVisibility,
  validateSettingValue,
  BooleanSwitch,
  SettingRow,
  TextInput,
  NumberInput,
  RepeatableInput,
  Select,
  ActionButton,
  SetteraSearch,
  SetteraSetting,
  SetteraSection,
  SetteraPage,
  SetteraSidebar,
  SetteraLayout,
} from "../index.js";

describe("@settera/ui", () => {
  it("re-exports SCHEMA_VERSION as 1.0", () => {
    expect(SCHEMA_VERSION).toBe("1.0");
  });

  it("re-exports react layer components", () => {
    expect(typeof SetteraProvider).toBe("function");
    expect(typeof SetteraRenderer).toBe("function");
  });

  it("re-exports hooks", () => {
    expect(typeof useSettera).toBe("function");
    expect(typeof useSetteraSetting).toBe("function");
    expect(typeof useSetteraAction).toBe("function");
    expect(typeof useSetteraNavigation).toBe("function");
    expect(typeof useSetteraSearch).toBe("function");
    expect(typeof evaluateVisibility).toBe("function");
    expect(typeof validateSettingValue).toBe("function");
  });

  it("re-exports keyboard navigation hooks", () => {
    expect(typeof useRovingTabIndex).toBe("function");
    expect(typeof useSetteraGlobalKeys).toBe("function");
  });

  it("exports UI components", () => {
    expect(typeof BooleanSwitch).toBe("function");
    expect(typeof SettingRow).toBe("function");
    expect(typeof TextInput).toBe("function");
    expect(typeof NumberInput).toBe("function");
    expect(typeof RepeatableInput).toBe("function");
    expect(typeof Select).toBe("function");
    expect(typeof ActionButton).toBe("function");
  });

  it("exports SetteraSearch", () => {
    expect(typeof SetteraSearch).toBe("function");
  });

  it("exports layout components", () => {
    expect(typeof SetteraSetting).toBe("function");
    expect(typeof SetteraSection).toBe("function");
    expect(typeof SetteraPage).toBe("function");
    expect(typeof SetteraSidebar).toBe("function");
    expect(typeof SetteraLayout).toBe("function");
  });
});
