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
  CompoundFieldDefinition,
  RepeatableSetting,
  RepeatableFieldDefinition,
  ActionSetting,
  ModalActionFieldSetting,
  CustomSetting,
  ValueSetting,
  VisibilityValue,
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

describe("CompoundFieldDefinition", () => {
  it("includes all six field types", () => {
    expectTypeOf<TextSetting>().toMatchTypeOf<CompoundFieldDefinition>();
    expectTypeOf<NumberSetting>().toMatchTypeOf<CompoundFieldDefinition>();
    expectTypeOf<SelectSetting>().toMatchTypeOf<CompoundFieldDefinition>();
    expectTypeOf<MultiSelectSetting>().toMatchTypeOf<CompoundFieldDefinition>();
    expectTypeOf<DateSetting>().toMatchTypeOf<CompoundFieldDefinition>();
    expectTypeOf<BooleanSetting>().toMatchTypeOf<CompoundFieldDefinition>();
  });

  it("excludes ActionSetting and RepeatableSetting", () => {
    expectTypeOf<ActionSetting>().not.toMatchTypeOf<CompoundFieldDefinition>();
    expectTypeOf<RepeatableSetting>().not.toMatchTypeOf<CompoundFieldDefinition>();
  });

  it("is the element type of CompoundSetting.fields", () => {
    expectTypeOf<CompoundSetting["fields"][number]>().toEqualTypeOf<CompoundFieldDefinition>();
  });
});

describe("RepeatableFieldDefinition", () => {
  it("includes text, number, select, and boolean", () => {
    expectTypeOf<TextSetting>().toMatchTypeOf<RepeatableFieldDefinition>();
    expectTypeOf<NumberSetting>().toMatchTypeOf<RepeatableFieldDefinition>();
    expectTypeOf<SelectSetting>().toMatchTypeOf<RepeatableFieldDefinition>();
    expectTypeOf<BooleanSetting>().toMatchTypeOf<RepeatableFieldDefinition>();
  });

  it("excludes DateSetting and MultiSelectSetting", () => {
    expectTypeOf<DateSetting>().not.toMatchTypeOf<RepeatableFieldDefinition>();
    expectTypeOf<MultiSelectSetting>().not.toMatchTypeOf<RepeatableFieldDefinition>();
  });
});

describe("ModalActionFieldSetting", () => {
  it("includes value-bearing setting types", () => {
    expectTypeOf<TextSetting>().toMatchTypeOf<ModalActionFieldSetting>();
    expectTypeOf<NumberSetting>().toMatchTypeOf<ModalActionFieldSetting>();
    expectTypeOf<BooleanSetting>().toMatchTypeOf<ModalActionFieldSetting>();
    expectTypeOf<SelectSetting>().toMatchTypeOf<ModalActionFieldSetting>();
    expectTypeOf<CompoundSetting>().toMatchTypeOf<ModalActionFieldSetting>();
    expectTypeOf<RepeatableSetting>().toMatchTypeOf<ModalActionFieldSetting>();
  });

  it("excludes ActionSetting", () => {
    expectTypeOf<ActionSetting>().not.toMatchTypeOf<ModalActionFieldSetting>();
  });
});

describe("VisibilityValue", () => {
  it("accepts string, number, boolean, and null", () => {
    expectTypeOf<string>().toMatchTypeOf<VisibilityValue>();
    expectTypeOf<number>().toMatchTypeOf<VisibilityValue>();
    expectTypeOf<boolean>().toMatchTypeOf<VisibilityValue>();
    expectTypeOf<null>().toMatchTypeOf<VisibilityValue>();
  });

  it("does not accept object or undefined", () => {
    expectTypeOf<object>().not.toMatchTypeOf<VisibilityValue>();
    expectTypeOf<undefined>().not.toMatchTypeOf<VisibilityValue>();
  });
});
