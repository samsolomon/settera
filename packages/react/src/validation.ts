import type { SettingDefinition } from "@settera/schema";

/**
 * Validate a setting value against the definition's validation rules.
 * Returns an error message string, or null if valid.
 * Pure function — no React dependencies.
 */
export function validateSettingValue(
  definition: SettingDefinition,
  value: unknown,
): string | null {
  switch (definition.type) {
    case "text":
      return validateText(definition.validation, value);
    case "number":
      return validateNumber(definition.validation, value);
    case "select":
      return validateSelect(definition.validation, value);
    case "multiselect":
      return validateMultiSelect(definition.validation, value);
    case "date":
      return validateDate(definition.validation, value);
    case "repeatable":
      return validateRepeatable(definition.validation, value);
    default:
      return null;
  }
}

function validateText(
  validation:
    | {
        required?: boolean;
        minLength?: number;
        maxLength?: number;
        pattern?: string;
        message?: string;
      }
    | undefined,
  value: unknown,
): string | null {
  if (!validation) return null;

  const str = typeof value === "string" ? value : "";
  const isEmpty = str.length === 0;

  if (validation.required && isEmpty) {
    return validation.message ?? "This field is required";
  }

  // Skip further checks if empty and not required
  if (isEmpty) return null;

  if (validation.minLength !== undefined && str.length < validation.minLength) {
    return (
      validation.message ??
      `Must be at least ${validation.minLength} characters`
    );
  }

  if (validation.maxLength !== undefined && str.length > validation.maxLength) {
    return (
      validation.message ?? `Must be at most ${validation.maxLength} characters`
    );
  }

  if (validation.pattern !== undefined) {
    try {
      const regex = new RegExp(validation.pattern);
      if (!regex.test(str)) {
        return validation.message ?? "Invalid format";
      }
    } catch {
      return validation.message ?? "Invalid validation pattern";
    }
  }

  return null;
}

function validateNumber(
  validation:
    | { required?: boolean; min?: number; max?: number; step?: number; message?: string }
    | undefined,
  value: unknown,
): string | null {
  if (!validation) return null;

  const isEmpty = value === undefined || value === null || value === "";

  if (validation.required && isEmpty) {
    return validation.message ?? "This field is required";
  }

  // Skip further checks if empty and not required
  if (isEmpty) return null;

  const num = typeof value === "number" ? value : Number(value);

  if (Number.isNaN(num)) {
    return validation.message ?? "Must be a number";
  }

  if (validation.min !== undefined && num < validation.min) {
    return validation.message ?? `Must be at least ${validation.min}`;
  }

  if (validation.max !== undefined && num > validation.max) {
    return validation.message ?? `Must be at most ${validation.max}`;
  }

  if (validation.step !== undefined && validation.step > 0) {
    const base = validation.min ?? 0;
    // Use rounding to avoid floating-point precision issues
    const remainder = Math.abs((num - base) % validation.step);
    const tolerance = 1e-10;
    if (remainder > tolerance && Math.abs(remainder - validation.step) > tolerance) {
      if (validation.step === 1) {
        return validation.message ?? "Must be a whole number";
      }
      return validation.message ?? `Must be a multiple of ${validation.step}`;
    }
  }

  return null;
}

function validateSelect(
  validation: { required?: boolean; message?: string } | undefined,
  value: unknown,
): string | null {
  if (!validation) return null;

  const isEmpty = value === undefined || value === null || value === "";

  if (validation.required && isEmpty) {
    return validation.message ?? "This field is required";
  }

  return null;
}

function validateMultiSelect(
  validation:
    | {
        required?: boolean;
        minSelections?: number;
        maxSelections?: number;
        message?: string;
      }
    | undefined,
  value: unknown,
): string | null {
  if (!validation) return null;

  const arr = Array.isArray(value) ? value : [];

  if (validation.required && arr.length === 0) {
    return validation.message ?? "At least one selection is required";
  }

  // Skip further checks if empty and not required
  if (arr.length === 0) return null;

  if (
    validation.minSelections !== undefined &&
    arr.length < validation.minSelections
  ) {
    return validation.message ?? `Select at least ${validation.minSelections}`;
  }

  if (
    validation.maxSelections !== undefined &&
    arr.length > validation.maxSelections
  ) {
    return validation.message ?? `Select at most ${validation.maxSelections}`;
  }

  return null;
}

function validateDate(
  validation:
    | {
        required?: boolean;
        minDate?: string;
        maxDate?: string;
        message?: string;
      }
    | undefined,
  value: unknown,
): string | null {
  if (!validation) return null;

  const str = typeof value === "string" ? value : "";
  const isEmpty = str.length === 0;

  if (validation.required && isEmpty) {
    return validation.message ?? "This field is required";
  }

  // Skip further checks if empty and not required
  if (isEmpty) return null;

  if (validation.minDate !== undefined && str < validation.minDate) {
    return (
      validation.message ?? `Date must be on or after ${validation.minDate}`
    );
  }

  if (validation.maxDate !== undefined && str > validation.maxDate) {
    return (
      validation.message ?? `Date must be on or before ${validation.maxDate}`
    );
  }

  return null;
}

function validateRepeatable(
  validation:
    | {
        minItems?: number;
        maxItems?: number;
        message?: string;
      }
    | undefined,
  value: unknown,
): string | null {
  if (!validation) return null;

  const arr = Array.isArray(value) ? value : [];

  if (validation.minItems !== undefined && arr.length < validation.minItems) {
    return validation.message ?? `Add at least ${validation.minItems} items`;
  }

  if (validation.maxItems !== undefined && arr.length > validation.maxItems) {
    return validation.message ?? `Add at most ${validation.maxItems} items`;
  }

  return null;
}
