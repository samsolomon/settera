import { describe, it, expect } from "vitest";
import { evaluateVisibility } from "../visibility.js";
import type { VisibilityCondition, VisibilityRule } from "../types.js";

describe("evaluateVisibility", () => {
  it("returns true when conditions is undefined", () => {
    expect(evaluateVisibility(undefined, {})).toBe(true);
  });

  it("evaluates equals condition — match", () => {
    const condition: VisibilityCondition = {
      setting: "toggle",
      equals: true,
    };
    expect(evaluateVisibility(condition, { toggle: true })).toBe(true);
  });

  it("evaluates equals condition — no match", () => {
    const condition: VisibilityCondition = {
      setting: "toggle",
      equals: true,
    };
    expect(evaluateVisibility(condition, { toggle: false })).toBe(false);
  });

  it("evaluates notEquals condition — match", () => {
    const condition: VisibilityCondition = {
      setting: "mode",
      notEquals: "disabled",
    };
    expect(evaluateVisibility(condition, { mode: "enabled" })).toBe(true);
  });

  it("evaluates notEquals condition — no match", () => {
    const condition: VisibilityCondition = {
      setting: "mode",
      notEquals: "disabled",
    };
    expect(evaluateVisibility(condition, { mode: "disabled" })).toBe(false);
  });

  it("evaluates oneOf condition — match", () => {
    const condition: VisibilityCondition = {
      setting: "provider",
      oneOf: ["okta", "auth0"],
    };
    expect(evaluateVisibility(condition, { provider: "okta" })).toBe(true);
  });

  it("evaluates oneOf condition — no match", () => {
    const condition: VisibilityCondition = {
      setting: "provider",
      oneOf: ["okta", "auth0"],
    };
    expect(evaluateVisibility(condition, { provider: "azure" })).toBe(false);
  });

  it("falls back to truthiness when no operator specified", () => {
    const condition: VisibilityCondition = { setting: "toggle" };
    expect(evaluateVisibility(condition, { toggle: true })).toBe(true);
    expect(evaluateVisibility(condition, { toggle: false })).toBe(false);
    expect(evaluateVisibility(condition, { toggle: "something" })).toBe(true);
    expect(evaluateVisibility(condition, { toggle: "" })).toBe(false);
    expect(evaluateVisibility(condition, {})).toBe(false);
  });

  it("evaluates array of conditions with AND logic", () => {
    const conditions: VisibilityCondition[] = [
      { setting: "ssoEnabled", equals: true },
      { setting: "ssoProvider", equals: "okta" },
    ];
    // Both true
    expect(
      evaluateVisibility(conditions, {
        ssoEnabled: true,
        ssoProvider: "okta",
      }),
    ).toBe(true);
    // First false
    expect(
      evaluateVisibility(conditions, {
        ssoEnabled: false,
        ssoProvider: "okta",
      }),
    ).toBe(false);
    // Second false
    expect(
      evaluateVisibility(conditions, {
        ssoEnabled: true,
        ssoProvider: "auth0",
      }),
    ).toBe(false);
  });

  // greaterThan
  it("evaluates greaterThan condition — match", () => {
    const condition: VisibilityCondition = {
      setting: "count",
      greaterThan: 5,
    };
    expect(evaluateVisibility(condition, { count: 10 })).toBe(true);
  });

  it("evaluates greaterThan condition — no match (equal)", () => {
    const condition: VisibilityCondition = {
      setting: "count",
      greaterThan: 5,
    };
    expect(evaluateVisibility(condition, { count: 5 })).toBe(false);
  });

  it("evaluates greaterThan condition — no match (less)", () => {
    const condition: VisibilityCondition = {
      setting: "count",
      greaterThan: 5,
    };
    expect(evaluateVisibility(condition, { count: 3 })).toBe(false);
  });

  it("evaluates greaterThan — false for non-numeric value", () => {
    const condition: VisibilityCondition = {
      setting: "count",
      greaterThan: 5,
    };
    expect(evaluateVisibility(condition, { count: "ten" })).toBe(false);
  });

  // lessThan
  it("evaluates lessThan condition — match", () => {
    const condition: VisibilityCondition = {
      setting: "count",
      lessThan: 10,
    };
    expect(evaluateVisibility(condition, { count: 5 })).toBe(true);
  });

  it("evaluates lessThan condition — no match (equal)", () => {
    const condition: VisibilityCondition = {
      setting: "count",
      lessThan: 10,
    };
    expect(evaluateVisibility(condition, { count: 10 })).toBe(false);
  });

  // contains
  it("evaluates contains condition — match", () => {
    const condition: VisibilityCondition = {
      setting: "tags",
      contains: "advanced",
    };
    expect(evaluateVisibility(condition, { tags: ["basic", "advanced"] })).toBe(true);
  });

  it("evaluates contains condition — no match", () => {
    const condition: VisibilityCondition = {
      setting: "tags",
      contains: "advanced",
    };
    expect(evaluateVisibility(condition, { tags: ["basic"] })).toBe(false);
  });

  it("evaluates contains — false for non-array value", () => {
    const condition: VisibilityCondition = {
      setting: "tags",
      contains: "advanced",
    };
    expect(evaluateVisibility(condition, { tags: "advanced" })).toBe(false);
  });

  // isEmpty
  it("evaluates isEmpty: true — match when undefined", () => {
    const condition: VisibilityCondition = {
      setting: "name",
      isEmpty: true,
    };
    expect(evaluateVisibility(condition, {})).toBe(true);
  });

  it("evaluates isEmpty: true — match when empty string", () => {
    const condition: VisibilityCondition = {
      setting: "name",
      isEmpty: true,
    };
    expect(evaluateVisibility(condition, { name: "" })).toBe(true);
  });

  it("evaluates isEmpty: true — match when empty array", () => {
    const condition: VisibilityCondition = {
      setting: "tags",
      isEmpty: true,
    };
    expect(evaluateVisibility(condition, { tags: [] })).toBe(true);
  });

  it("evaluates isEmpty: true — no match when non-empty", () => {
    const condition: VisibilityCondition = {
      setting: "name",
      isEmpty: true,
    };
    expect(evaluateVisibility(condition, { name: "hello" })).toBe(false);
  });

  it("evaluates isEmpty: false — match when non-empty", () => {
    const condition: VisibilityCondition = {
      setting: "name",
      isEmpty: false,
    };
    expect(evaluateVisibility(condition, { name: "hello" })).toBe(true);
  });

  it("evaluates isEmpty: false — no match when empty", () => {
    const condition: VisibilityCondition = {
      setting: "name",
      isEmpty: false,
    };
    expect(evaluateVisibility(condition, { name: "" })).toBe(false);
  });

  // OR groups
  it("evaluates OR group — match when first condition true", () => {
    const rule: VisibilityRule = {
      or: [
        { setting: "plan", equals: "pro" },
        { setting: "plan", equals: "enterprise" },
      ],
    };
    expect(evaluateVisibility(rule, { plan: "pro" })).toBe(true);
  });

  it("evaluates OR group — match when second condition true", () => {
    const rule: VisibilityRule = {
      or: [
        { setting: "plan", equals: "pro" },
        { setting: "plan", equals: "enterprise" },
      ],
    };
    expect(evaluateVisibility(rule, { plan: "enterprise" })).toBe(true);
  });

  it("evaluates OR group — no match when none true", () => {
    const rule: VisibilityRule = {
      or: [
        { setting: "plan", equals: "pro" },
        { setting: "plan", equals: "enterprise" },
      ],
    };
    expect(evaluateVisibility(rule, { plan: "free" })).toBe(false);
  });

  it("evaluates mixed AND array with OR group", () => {
    const rules: VisibilityRule[] = [
      { setting: "enabled", equals: true },
      {
        or: [
          { setting: "plan", equals: "pro" },
          { setting: "plan", equals: "enterprise" },
        ],
      },
    ];
    // Both AND conditions met
    expect(evaluateVisibility(rules, { enabled: true, plan: "pro" })).toBe(true);
    // OR group fails
    expect(evaluateVisibility(rules, { enabled: true, plan: "free" })).toBe(false);
    // Plain condition fails
    expect(evaluateVisibility(rules, { enabled: false, plan: "pro" })).toBe(false);
  });
});
