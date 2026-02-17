import { describe, it, expectTypeOf } from "vitest";
import type {
  SettingDefinition,
  BooleanSetting,
  TextSetting,
  NumberSetting,
  SelectSetting,
  MultiSelectSetting,
  DateSetting,
  CompoundSetting,
  RepeatableSetting,
  ActionSetting,
  CustomSetting,
  ValueSetting,
} from "../types.js";

describe("SettingDefinition discriminated union", () => {
  it("narrows to BooleanSetting on type === 'boolean'", () => {
    const setting = { type: "boolean" as const } as SettingDefinition;
    if (setting.type === "boolean") {
      expectTypeOf(setting).toMatchTypeOf<BooleanSetting>();
    }
  });

  it("narrows to TextSetting on type === 'text'", () => {
    const setting = { type: "text" as const } as SettingDefinition;
    if (setting.type === "text") {
      expectTypeOf(setting).toMatchTypeOf<TextSetting>();
    }
  });

  it("narrows to NumberSetting on type === 'number'", () => {
    const setting = { type: "number" as const } as SettingDefinition;
    if (setting.type === "number") {
      expectTypeOf(setting).toMatchTypeOf<NumberSetting>();
    }
  });

  it("narrows to SelectSetting on type === 'select'", () => {
    const setting = { type: "select" as const } as SettingDefinition;
    if (setting.type === "select") {
      expectTypeOf(setting).toMatchTypeOf<SelectSetting>();
    }
  });

  it("narrows to MultiSelectSetting on type === 'multiselect'", () => {
    const setting = { type: "multiselect" as const } as SettingDefinition;
    if (setting.type === "multiselect") {
      expectTypeOf(setting).toMatchTypeOf<MultiSelectSetting>();
    }
  });

  it("narrows to DateSetting on type === 'date'", () => {
    const setting = { type: "date" as const } as SettingDefinition;
    if (setting.type === "date") {
      expectTypeOf(setting).toMatchTypeOf<DateSetting>();
    }
  });

  it("narrows to CompoundSetting on type === 'compound'", () => {
    const setting = { type: "compound" as const } as SettingDefinition;
    if (setting.type === "compound") {
      expectTypeOf(setting).toMatchTypeOf<CompoundSetting>();
    }
  });

  it("narrows to RepeatableSetting on type === 'repeatable'", () => {
    const setting = { type: "repeatable" as const } as SettingDefinition;
    if (setting.type === "repeatable") {
      expectTypeOf(setting).toMatchTypeOf<RepeatableSetting>();
    }
  });

  it("narrows to ActionSetting on type === 'action'", () => {
    const setting = { type: "action" as const } as SettingDefinition;
    if (setting.type === "action") {
      expectTypeOf(setting).toMatchTypeOf<ActionSetting>();
    }
  });

  it("narrows to CustomSetting on type === 'custom'", () => {
    const setting = { type: "custom" as const } as SettingDefinition;
    if (setting.type === "custom") {
      expectTypeOf(setting).toMatchTypeOf<CustomSetting>();
    }
  });

  it("ValueSetting excludes ActionSetting", () => {
    expectTypeOf<ActionSetting>().not.toMatchTypeOf<ValueSetting>();
  });

  it("BooleanSetting validation is never", () => {
    expectTypeOf<BooleanSetting["validation"]>().toEqualTypeOf<
      never | undefined
    >();
  });
});
