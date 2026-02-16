import type { VisibilityCondition } from "@settera/schema";

/**
 * Evaluate whether a setting should be visible based on its visibility conditions
 * and the current values object.
 *
 * - undefined/null conditions → always visible (true)
 * - Single condition → evaluate that condition
 * - Array of conditions → ALL must be true (implicit AND)
 */
export function evaluateVisibility(
  conditions: VisibilityCondition | VisibilityCondition[] | undefined,
  values: Record<string, unknown>,
): boolean {
  if (!conditions) return true;

  const conditionList = Array.isArray(conditions) ? conditions : [conditions];

  return conditionList.every((condition) =>
    evaluateCondition(condition, values),
  );
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
    return condition.oneOf.includes(value);
  }

  // Truthiness fallback (no operator specified)
  return Boolean(value);
}
