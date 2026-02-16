import { describe, it, expect } from "vitest";
import { validateSettingValue } from "../validation.js";
import type { SettingDefinition } from "@settara/schema";

// ---- Helpers ----

function textDef(validation?: Record<string, unknown>): SettingDefinition {
  return {
    key: "t",
    title: "Text",
    type: "text",
    validation,
  } as SettingDefinition;
}

function numberDef(validation?: Record<string, unknown>): SettingDefinition {
  return {
    key: "n",
    title: "Number",
    type: "number",
    validation,
  } as SettingDefinition;
}

function selectDef(validation?: Record<string, unknown>): SettingDefinition {
  return {
    key: "s",
    title: "Select",
    type: "select",
    options: [
      { value: "a", label: "A" },
      { value: "b", label: "B" },
    ],
    validation,
  } as SettingDefinition;
}

// ---- Text Validation ----

describe("validateSettingValue — text", () => {
  it("returns null when no validation rules", () => {
    expect(validateSettingValue(textDef(), "hello")).toBeNull();
  });

  it("returns null when validation is undefined", () => {
    expect(validateSettingValue(textDef(undefined), "")).toBeNull();
  });

  it("returns error for required empty string", () => {
    expect(validateSettingValue(textDef({ required: true }), "")).toBe(
      "This field is required",
    );
  });

  it("returns error for required undefined value", () => {
    expect(validateSettingValue(textDef({ required: true }), undefined)).toBe(
      "This field is required",
    );
  });

  it("returns null for required non-empty string", () => {
    expect(
      validateSettingValue(textDef({ required: true }), "hello"),
    ).toBeNull();
  });

  it("returns error when below minLength", () => {
    expect(validateSettingValue(textDef({ minLength: 3 }), "ab")).toBe(
      "Must be at least 3 characters",
    );
  });

  it("returns null when at minLength", () => {
    expect(validateSettingValue(textDef({ minLength: 3 }), "abc")).toBeNull();
  });

  it("returns error when above maxLength", () => {
    expect(validateSettingValue(textDef({ maxLength: 5 }), "abcdef")).toBe(
      "Must be at most 5 characters",
    );
  });

  it("returns null when at maxLength", () => {
    expect(validateSettingValue(textDef({ maxLength: 5 }), "abcde")).toBeNull();
  });

  it("returns error when pattern does not match", () => {
    expect(validateSettingValue(textDef({ pattern: "^[a-z]+$" }), "ABC")).toBe(
      "Invalid format",
    );
  });

  it("returns null when pattern matches", () => {
    expect(
      validateSettingValue(textDef({ pattern: "^[a-z]+$" }), "abc"),
    ).toBeNull();
  });

  it("returns error for invalid regex pattern", () => {
    expect(validateSettingValue(textDef({ pattern: "[invalid" }), "abc")).toBe(
      "Invalid validation pattern",
    );
  });

  it("uses custom message for invalid regex pattern", () => {
    expect(
      validateSettingValue(
        textDef({ pattern: "[invalid", message: "Bad format" }),
        "abc",
      ),
    ).toBe("Bad format");
  });

  it("uses custom message when provided", () => {
    expect(
      validateSettingValue(
        textDef({ required: true, message: "Please enter a value" }),
        "",
      ),
    ).toBe("Please enter a value");
  });

  it("skips minLength/maxLength/pattern when empty and not required", () => {
    expect(
      validateSettingValue(
        textDef({ minLength: 3, maxLength: 10, pattern: "^[a-z]+$" }),
        "",
      ),
    ).toBeNull();
  });

  it("checks rules in order: required → minLength → maxLength → pattern", () => {
    // required triggers first
    expect(
      validateSettingValue(textDef({ required: true, minLength: 3 }), ""),
    ).toBe("This field is required");

    // minLength triggers before maxLength
    expect(
      validateSettingValue(textDef({ minLength: 5, maxLength: 3 }), "ab"),
    ).toBe("Must be at least 5 characters");
  });
});

// ---- Number Validation ----

describe("validateSettingValue — number", () => {
  it("returns null when no validation rules", () => {
    expect(validateSettingValue(numberDef(), 42)).toBeNull();
  });

  it("returns error for required undefined value", () => {
    expect(validateSettingValue(numberDef({ required: true }), undefined)).toBe(
      "This field is required",
    );
  });

  it("returns error for required empty string", () => {
    expect(validateSettingValue(numberDef({ required: true }), "")).toBe(
      "This field is required",
    );
  });

  it("returns null for required number", () => {
    expect(validateSettingValue(numberDef({ required: true }), 0)).toBeNull();
  });

  it("returns error when below min", () => {
    expect(validateSettingValue(numberDef({ min: 10 }), 5)).toBe(
      "Must be at least 10",
    );
  });

  it("returns null when at min", () => {
    expect(validateSettingValue(numberDef({ min: 10 }), 10)).toBeNull();
  });

  it("returns error when above max", () => {
    expect(validateSettingValue(numberDef({ max: 100 }), 101)).toBe(
      "Must be at most 100",
    );
  });

  it("returns null when at max", () => {
    expect(validateSettingValue(numberDef({ max: 100 }), 100)).toBeNull();
  });

  it("uses custom message", () => {
    expect(
      validateSettingValue(numberDef({ min: 1, message: "Too small" }), 0),
    ).toBe("Too small");
  });

  it("skips min/max when empty and not required", () => {
    expect(
      validateSettingValue(numberDef({ min: 10, max: 100 }), undefined),
    ).toBeNull();
  });

  it("returns error for NaN value", () => {
    expect(validateSettingValue(numberDef({ min: 0 }), "abc")).toBe(
      "Must be a number",
    );
  });

  it("uses custom message for NaN value", () => {
    expect(
      validateSettingValue(
        numberDef({ min: 0, message: "Numbers only" }),
        "abc",
      ),
    ).toBe("Numbers only");
  });
});

// ---- Select Validation ----

describe("validateSettingValue — select", () => {
  it("returns null when no validation rules", () => {
    expect(validateSettingValue(selectDef(), "a")).toBeNull();
  });

  it("returns error for required empty value", () => {
    expect(validateSettingValue(selectDef({ required: true }), "")).toBe(
      "This field is required",
    );
  });

  it("returns error for required undefined value", () => {
    expect(validateSettingValue(selectDef({ required: true }), undefined)).toBe(
      "This field is required",
    );
  });

  it("returns null for required with value", () => {
    expect(validateSettingValue(selectDef({ required: true }), "a")).toBeNull();
  });

  it("uses custom message", () => {
    expect(
      validateSettingValue(
        selectDef({ required: true, message: "Pick one" }),
        "",
      ),
    ).toBe("Pick one");
  });
});

// ---- No-validation fallback ----

describe("validateSettingValue — no-validation types", () => {
  it("returns null for boolean type", () => {
    const def: SettingDefinition = {
      key: "b",
      title: "Bool",
      type: "boolean",
    };
    expect(validateSettingValue(def, true)).toBeNull();
  });

  it("returns null for action type", () => {
    const def: SettingDefinition = {
      key: "a",
      title: "Action",
      type: "action",
      buttonLabel: "Do it",
      actionType: "callback",
    };
    expect(validateSettingValue(def, undefined)).toBeNull();
  });
});
