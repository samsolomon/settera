import { describe, it, expect } from "vitest";
import { evaluateVisibility } from "../visibility.js";
import type { VisibilityCondition } from "@settera/schema";

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
});
