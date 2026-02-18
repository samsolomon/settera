import { describe, it, expect } from "vitest";
import {
  SCHEMA_VERSION,
  Settera,
  useSettera,
  useSetteraSetting,
  useSetteraAction,
  useSetteraConfirm,
  useSetteraSection,
  useSetteraNavigation,
  useSetteraSearch,
  useRovingTabIndex,
  useSetteraGlobalKeys,
  useContentCardNavigation,
  isTextInput,
  evaluateVisibility,
  validateSettingValue,
  validateConfirmText,
  SetteraNavigationProvider,
  SetteraNavigationContext,
  BooleanSwitch,
  SettingRow,
  TextInput,
  NumberInput,
  Select,
  MultiSelect,
  DateInput,
  CompoundInput,
  RepeatableInput,
  ActionButton,
  ConfirmDialog,
  SetteraSearch,
  SetteraSetting,
  SetteraSection,
  SetteraPage,
  SetteraSidebar,
  SetteraLayout,
  SetteraDeepLinkContext,
  parseDescriptionLinks,
} from "../index.js";

describe("@settera/ui", () => {
  it("re-exports SCHEMA_VERSION as 1.0", () => {
    expect(SCHEMA_VERSION).toBe("1.0");
  });

  it("re-exports react layer components", () => {
    expect(typeof Settera).toBe("function");
  });

  it("re-exports hooks from react", () => {
    expect(typeof useSettera).toBe("function");
    expect(typeof useSetteraSetting).toBe("function");
    expect(typeof useSetteraAction).toBe("function");
    expect(typeof useSetteraConfirm).toBe("function");
    expect(typeof useSetteraSection).toBe("function");
    expect(typeof evaluateVisibility).toBe("function");
    expect(typeof validateSettingValue).toBe("function");
    expect(typeof validateConfirmText).toBe("function");
  });

  it("exports navigation provider and hooks", () => {
    expect(typeof SetteraNavigationProvider).toBe("function");
    expect(SetteraNavigationContext).toBeDefined();
    expect(typeof useSetteraNavigation).toBe("function");
    expect(typeof useSetteraSearch).toBe("function");
  });

  it("exports keyboard navigation hooks", () => {
    expect(typeof useRovingTabIndex).toBe("function");
    expect(typeof useSetteraGlobalKeys).toBe("function");
    expect(typeof useContentCardNavigation).toBe("function");
    expect(typeof isTextInput).toBe("function");
  });

  it("exports UI input components", () => {
    expect(typeof BooleanSwitch).toBe("function");
    expect(typeof TextInput).toBe("function");
    expect(typeof NumberInput).toBe("function");
    expect(typeof Select).toBe("function");
    expect(typeof MultiSelect).toBe("function");
    expect(typeof DateInput).toBe("function");
    expect(typeof CompoundInput).toBe("function");
    expect(typeof RepeatableInput).toBe("function");
    expect(typeof ActionButton).toBe("function");
    expect(typeof ConfirmDialog).toBe("function");
  });

  it("exports layout components", () => {
    expect(typeof SettingRow).toBe("function");
    expect(typeof SetteraSetting).toBe("function");
    expect(typeof SetteraSection).toBe("function");
    expect(typeof SetteraPage).toBe("function");
    expect(typeof SetteraSidebar).toBe("function");
    expect(typeof SetteraLayout).toBe("function");
    expect(typeof SetteraSearch).toBe("function");
  });

  it("exports contexts and utilities", () => {
    expect(SetteraDeepLinkContext).toBeDefined();
    expect(typeof parseDescriptionLinks).toBe("function");
  });
});
