import type { VisibilityCondition, VisibilityRule, VisibilityValue } from "./types.js";

/**
 * Evaluate whether a setting should be visible based on its visibility rules
 * and the current values object.
 *
 * - undefined/null rules → always visible (true)
 * - Single rule → evaluate that rule
 * - Array of rules → ALL must be true (implicit AND)
 * - OR group ({ or: [...] }) → at least one condition must be true
 */
export function evaluateVisibility(
  rules: VisibilityRule | VisibilityRule[] | undefined,
  values: Record<string, unknown>,
): boolean {
  if (!rules) return true;

  const ruleList = Array.isArray(rules) ? rules : [rules];

  return ruleList.every((rule) => evaluateRule(rule, values));
}

function evaluateRule(
  rule: VisibilityRule,
  values: Record<string, unknown>,
): boolean {
  // OR group
  if ("or" in rule) {
    return rule.or.some((condition) => evaluateCondition(condition, values));
  }

  return evaluateCondition(rule, values);
}

function evaluateCondition(
  condition: VisibilityCondition,
  values: Record<string, unknown>,
): boolean {
  const value = values[condition.setting];

  // equals check
  if ("equals" in condition && condition.equals !== undefined) {
    return value === condition.equals;
  }

  // notEquals check
  if ("notEquals" in condition && condition.notEquals !== undefined) {
    return value !== condition.notEquals;
  }

  // oneOf check
  if ("oneOf" in condition && condition.oneOf !== undefined) {
    return condition.oneOf.includes(value as VisibilityValue);
  }

  // greaterThan check (numeric)
  if ("greaterThan" in condition && condition.greaterThan !== undefined) {
    return typeof value === "number" && value > condition.greaterThan;
  }

  // lessThan check (numeric)
  if ("lessThan" in condition && condition.lessThan !== undefined) {
    return typeof value === "number" && value < condition.lessThan;
  }

  // contains check (for arrays / multiselect)
  if ("contains" in condition && condition.contains !== undefined) {
    return Array.isArray(value) && value.includes(condition.contains);
  }

  // isEmpty check
  if ("isEmpty" in condition && condition.isEmpty !== undefined) {
    const empty = isValueEmpty(value);
    return condition.isEmpty ? empty : !empty;
  }

  // Truthiness fallback (no operator specified)
  return Boolean(value);
}

function isValueEmpty(value: unknown): boolean {
  if (value === undefined || value === null || value === "") return true;
  if (Array.isArray(value)) return value.length === 0;
  return false;
}
