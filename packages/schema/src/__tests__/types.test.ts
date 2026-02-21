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
  SelectOption,
  VisibilityCondition,
  VisibilityConditionGroup,
  VisibilityRule,
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
  it("includes all six primitive field types", () => {
    expectTypeOf<TextSetting>().toMatchTypeOf<RepeatableFieldDefinition>();
    expectTypeOf<NumberSetting>().toMatchTypeOf<RepeatableFieldDefinition>();
    expectTypeOf<SelectSetting>().toMatchTypeOf<RepeatableFieldDefinition>();
    expectTypeOf<MultiSelectSetting>().toMatchTypeOf<RepeatableFieldDefinition>();
    expectTypeOf<DateSetting>().toMatchTypeOf<RepeatableFieldDefinition>();
    expectTypeOf<BooleanSetting>().toMatchTypeOf<RepeatableFieldDefinition>();
  });

  it("matches CompoundFieldDefinition", () => {
    expectTypeOf<RepeatableFieldDefinition>().toEqualTypeOf<CompoundFieldDefinition>();
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

describe("disabled field", () => {
  it("exists on all 10 setting types", () => {
    expectTypeOf<BooleanSetting["disabled"]>().toEqualTypeOf<boolean | undefined>();
    expectTypeOf<TextSetting["disabled"]>().toEqualTypeOf<boolean | undefined>();
    expectTypeOf<NumberSetting["disabled"]>().toEqualTypeOf<boolean | undefined>();
    expectTypeOf<SelectSetting["disabled"]>().toEqualTypeOf<boolean | undefined>();
    expectTypeOf<MultiSelectSetting["disabled"]>().toEqualTypeOf<boolean | undefined>();
    expectTypeOf<DateSetting["disabled"]>().toEqualTypeOf<boolean | undefined>();
    expectTypeOf<CompoundSetting["disabled"]>().toEqualTypeOf<boolean | undefined>();
    expectTypeOf<RepeatableSetting["disabled"]>().toEqualTypeOf<boolean | undefined>();
    expectTypeOf<ActionSetting["disabled"]>().toEqualTypeOf<boolean | undefined>();
    expectTypeOf<CustomSetting["disabled"]>().toEqualTypeOf<boolean | undefined>();
  });
});

describe("readonly field", () => {
  it("exists on TextSetting, NumberSetting, DateSetting", () => {
    expectTypeOf<TextSetting["readonly"]>().toEqualTypeOf<boolean | undefined>();
    expectTypeOf<NumberSetting["readonly"]>().toEqualTypeOf<boolean | undefined>();
    expectTypeOf<DateSetting["readonly"]>().toEqualTypeOf<boolean | undefined>();
  });

  it("does not exist on BooleanSetting, SelectSetting, ActionSetting", () => {
    type BooleanHasReadonly = "readonly" extends keyof BooleanSetting ? true : false;
    type SelectHasReadonly = "readonly" extends keyof SelectSetting ? true : false;
    type ActionHasReadonly = "readonly" extends keyof ActionSetting ? true : false;
    expectTypeOf<BooleanHasReadonly>().toEqualTypeOf<false>();
    expectTypeOf<SelectHasReadonly>().toEqualTypeOf<false>();
    expectTypeOf<ActionHasReadonly>().toEqualTypeOf<false>();
  });
});

describe("badge field", () => {
  it("exists on all 10 setting types", () => {
    expectTypeOf<BooleanSetting["badge"]>().toEqualTypeOf<string | undefined>();
    expectTypeOf<TextSetting["badge"]>().toEqualTypeOf<string | undefined>();
    expectTypeOf<NumberSetting["badge"]>().toEqualTypeOf<string | undefined>();
    expectTypeOf<SelectSetting["badge"]>().toEqualTypeOf<string | undefined>();
    expectTypeOf<MultiSelectSetting["badge"]>().toEqualTypeOf<string | undefined>();
    expectTypeOf<DateSetting["badge"]>().toEqualTypeOf<string | undefined>();
    expectTypeOf<CompoundSetting["badge"]>().toEqualTypeOf<string | undefined>();
    expectTypeOf<RepeatableSetting["badge"]>().toEqualTypeOf<string | undefined>();
    expectTypeOf<ActionSetting["badge"]>().toEqualTypeOf<string | undefined>();
    expectTypeOf<CustomSetting["badge"]>().toEqualTypeOf<string | undefined>();
  });
});

describe("deprecated field", () => {
  it("exists on all 10 setting types", () => {
    expectTypeOf<BooleanSetting["deprecated"]>().toEqualTypeOf<string | boolean | undefined>();
    expectTypeOf<TextSetting["deprecated"]>().toEqualTypeOf<string | boolean | undefined>();
    expectTypeOf<NumberSetting["deprecated"]>().toEqualTypeOf<string | boolean | undefined>();
    expectTypeOf<SelectSetting["deprecated"]>().toEqualTypeOf<string | boolean | undefined>();
    expectTypeOf<MultiSelectSetting["deprecated"]>().toEqualTypeOf<string | boolean | undefined>();
    expectTypeOf<DateSetting["deprecated"]>().toEqualTypeOf<string | boolean | undefined>();
    expectTypeOf<CompoundSetting["deprecated"]>().toEqualTypeOf<string | boolean | undefined>();
    expectTypeOf<RepeatableSetting["deprecated"]>().toEqualTypeOf<string | boolean | undefined>();
    expectTypeOf<ActionSetting["deprecated"]>().toEqualTypeOf<string | boolean | undefined>();
    expectTypeOf<CustomSetting["deprecated"]>().toEqualTypeOf<string | boolean | undefined>();
  });
});

describe("SelectOption", () => {
  it("has value and label", () => {
    expectTypeOf<SelectOption["value"]>().toEqualTypeOf<string>();
    expectTypeOf<SelectOption["label"]>().toEqualTypeOf<string>();
  });

  it("has optional description and group", () => {
    expectTypeOf<SelectOption["description"]>().toEqualTypeOf<string | undefined>();
    expectTypeOf<SelectOption["group"]>().toEqualTypeOf<string | undefined>();
  });

  it("is the element type of SelectSetting.options", () => {
    expectTypeOf<SelectSetting["options"][number]>().toEqualTypeOf<SelectOption>();
  });

  it("is the element type of MultiSelectSetting.options", () => {
    expectTypeOf<MultiSelectSetting["options"][number]>().toEqualTypeOf<SelectOption>();
  });
});

describe("TextSetting textarea", () => {
  it("inputType includes textarea", () => {
    expectTypeOf<"textarea">().toMatchTypeOf<NonNullable<TextSetting["inputType"]>>();
  });

  it("has rows field", () => {
    expectTypeOf<TextSetting["rows"]>().toEqualTypeOf<number | undefined>();
  });
});

describe("NumberSetting extensions", () => {
  it("has displayHint field", () => {
    expectTypeOf<NumberSetting["displayHint"]>().toEqualTypeOf<"input" | "slider" | undefined>();
  });

  it("validation has step field", () => {
    type NumValidation = NonNullable<NumberSetting["validation"]>;
    expectTypeOf<NumValidation["step"]>().toEqualTypeOf<number | undefined>();
  });
});

describe("SelectSetting placeholder", () => {
  it("has placeholder field", () => {
    expectTypeOf<SelectSetting["placeholder"]>().toEqualTypeOf<string | undefined>();
  });
});

describe("SelectSetting searchable", () => {
  it("has optional searchable field", () => {
    expectTypeOf<SelectSetting["searchable"]>().toEqualTypeOf<boolean | undefined>();
  });
});

describe("VisibilityCondition extensions", () => {
  it("has greaterThan and lessThan", () => {
    expectTypeOf<VisibilityCondition["greaterThan"]>().toEqualTypeOf<number | undefined>();
    expectTypeOf<VisibilityCondition["lessThan"]>().toEqualTypeOf<number | undefined>();
  });

  it("has contains", () => {
    expectTypeOf<VisibilityCondition["contains"]>().toEqualTypeOf<VisibilityValue | undefined>();
  });

  it("has isEmpty", () => {
    expectTypeOf<VisibilityCondition["isEmpty"]>().toEqualTypeOf<boolean | undefined>();
  });
});

describe("VisibilityConditionGroup", () => {
  it("has or array", () => {
    expectTypeOf<VisibilityConditionGroup["or"]>().toEqualTypeOf<VisibilityCondition[]>();
  });
});

describe("VisibilityRule", () => {
  it("accepts VisibilityCondition", () => {
    expectTypeOf<VisibilityCondition>().toMatchTypeOf<VisibilityRule>();
  });

  it("accepts VisibilityConditionGroup", () => {
    expectTypeOf<VisibilityConditionGroup>().toMatchTypeOf<VisibilityRule>();
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
