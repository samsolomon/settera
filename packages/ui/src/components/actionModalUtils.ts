import type { ActionSetting } from "@settera/schema";
import { isObjectRecord } from "../utils/isObjectRecord.js";

export type ModalActionFieldSetting = NonNullable<
  NonNullable<ActionSetting["modal"]>["fields"]
>[number];

export function getDefaultFieldValue(field: ModalActionFieldSetting): unknown {
  if ("default" in field && field.default !== undefined) {
    return field.default;
  }

  switch (field.type) {
    case "boolean":
      return false;
    case "multiselect":
      return [];
    case "compound": {
      const defaults: Record<string, unknown> = {};
      for (const subField of field.fields) {
        defaults[subField.key] = getDefaultFieldValue(
          subField as ModalActionFieldSetting,
        );
      }
      return defaults;
    }
    case "repeatable":
      return Array.isArray(field.default) ? field.default : [];
    default:
      return "";
  }
}

export function buildModalDraft(
  fields: ModalActionFieldSetting[],
  initialValues?: Record<string, unknown>,
) {
  const defaults: Record<string, unknown> = {};
  for (const field of fields) {
    defaults[field.key] = getDefaultFieldValue(field);
  }
  return { ...defaults, ...(initialValues ?? {}) };
}

export { isObjectRecord } from "../utils/isObjectRecord.js";
