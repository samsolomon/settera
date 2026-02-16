import type {
  SetteraSchema,
  PageDefinition,
  SectionDefinition,
  SettingDefinition,
  SchemaValidationError,
  VisibilityCondition,
} from "./types.js";

/**
 * Validates a SetteraSchema and returns an array of errors.
 * Empty array = valid schema.
 */
export function validateSchema(schema: SetteraSchema): SchemaValidationError[] {
  const errors: SchemaValidationError[] = [];

  // Version check
  if (schema.version !== "1.0") {
    errors.push({
      path: "version",
      code: "INVALID_VERSION",
      message: `Expected version "1.0", got "${schema.version}".`,
    });
  }

  // Must have pages
  if (!schema.pages || schema.pages.length === 0) {
    errors.push({
      path: "pages",
      code: "MISSING_PAGES",
      message: "Schema must have at least one page.",
    });
    return errors;
  }

  // Collect all setting keys for uniqueness + visibility ref checking
  const allSettingKeys = new Set<string>();
  const allVisibilityRefs: Array<{
    path: string;
    setting: string;
  }> = [];

  // Validate pages
  const pageKeys = new Set<string>();
  for (let i = 0; i < schema.pages.length; i++) {
    validatePage(
      schema.pages[i],
      `pages[${i}]`,
      pageKeys,
      allSettingKeys,
      allVisibilityRefs,
      errors,
    );
  }

  // Check visibility references point to real settings
  for (const ref of allVisibilityRefs) {
    if (!allSettingKeys.has(ref.setting)) {
      errors.push({
        path: ref.path,
        code: "INVALID_VISIBILITY_REF",
        message: `visibleWhen references unknown setting "${ref.setting}".`,
      });
    }
  }

  return errors;
}

function validatePage(
  page: PageDefinition,
  path: string,
  pageKeys: Set<string>,
  allSettingKeys: Set<string>,
  allVisibilityRefs: Array<{ path: string; setting: string }>,
  errors: SchemaValidationError[],
): void {
  // Required fields
  if (!page.key) {
    errors.push({
      path: `${path}.key`,
      code: "MISSING_REQUIRED_FIELD",
      message: "Page must have a key.",
    });
  }
  if (!page.title) {
    errors.push({
      path: `${path}.title`,
      code: "MISSING_REQUIRED_FIELD",
      message: "Page must have a title.",
    });
  }

  // Duplicate page key
  if (page.key) {
    if (pageKeys.has(page.key)) {
      errors.push({
        path: `${path}.key`,
        code: "DUPLICATE_KEY",
        message: `Duplicate page key "${page.key}".`,
      });
    }
    pageKeys.add(page.key);
  }

  // Validate sections
  if (page.sections) {
    const sectionKeys = new Set<string>();
    for (let i = 0; i < page.sections.length; i++) {
      validateSection(
        page.sections[i],
        `${path}.sections[${i}]`,
        sectionKeys,
        allSettingKeys,
        allVisibilityRefs,
        errors,
      );
    }
  }

  // Validate nested pages
  if (page.pages) {
    for (let i = 0; i < page.pages.length; i++) {
      validatePage(
        page.pages[i],
        `${path}.pages[${i}]`,
        pageKeys,
        allSettingKeys,
        allVisibilityRefs,
        errors,
      );
    }
  }
}

function validateSection(
  section: SectionDefinition,
  path: string,
  sectionKeys: Set<string>,
  allSettingKeys: Set<string>,
  allVisibilityRefs: Array<{ path: string; setting: string }>,
  errors: SchemaValidationError[],
): void {
  // Required fields
  if (!section.key) {
    errors.push({
      path: `${path}.key`,
      code: "MISSING_REQUIRED_FIELD",
      message: "Section must have a key.",
    });
  }
  if (!section.title) {
    errors.push({
      path: `${path}.title`,
      code: "MISSING_REQUIRED_FIELD",
      message: "Section must have a title.",
    });
  }

  // Duplicate section key within page
  if (section.key) {
    if (sectionKeys.has(section.key)) {
      errors.push({
        path: `${path}.key`,
        code: "DUPLICATE_KEY",
        message: `Duplicate section key "${section.key}".`,
      });
    }
    sectionKeys.add(section.key);
  }

  // Validate settings
  if (section.settings) {
    for (let i = 0; i < section.settings.length; i++) {
      validateSetting(
        section.settings[i],
        `${path}.settings[${i}]`,
        allSettingKeys,
        allVisibilityRefs,
        errors,
      );
    }
  }

  // Validate subsections
  if (section.subsections) {
    const subsectionKeys = new Set<string>();
    for (let i = 0; i < section.subsections.length; i++) {
      const sub = section.subsections[i];
      const subPath = `${path}.subsections[${i}]`;

      if (!sub.key) {
        errors.push({
          path: `${subPath}.key`,
          code: "MISSING_REQUIRED_FIELD",
          message: "Subsection must have a key.",
        });
      }
      if (!sub.title) {
        errors.push({
          path: `${subPath}.title`,
          code: "MISSING_REQUIRED_FIELD",
          message: "Subsection must have a title.",
        });
      }
      if (sub.key) {
        if (subsectionKeys.has(sub.key)) {
          errors.push({
            path: `${subPath}.key`,
            code: "DUPLICATE_KEY",
            message: `Duplicate subsection key "${sub.key}".`,
          });
        }
        subsectionKeys.add(sub.key);
      }

      if (sub.settings) {
        for (let j = 0; j < sub.settings.length; j++) {
          validateSetting(
            sub.settings[j],
            `${subPath}.settings[${j}]`,
            allSettingKeys,
            allVisibilityRefs,
            errors,
          );
        }
      }
    }
  }
}

const VALID_SETTING_TYPES = [
  "boolean",
  "text",
  "number",
  "select",
  "multiselect",
  "date",
  "compound",
  "list",
  "action",
  "custom",
] as const;

function validateSetting(
  setting: SettingDefinition,
  path: string,
  allSettingKeys: Set<string>,
  allVisibilityRefs: Array<{ path: string; setting: string }>,
  errors: SchemaValidationError[],
): void {
  // Required fields
  if (!setting.key) {
    errors.push({
      path: `${path}.key`,
      code: "MISSING_REQUIRED_FIELD",
      message: "Setting must have a key.",
    });
  }
  if (!setting.title) {
    errors.push({
      path: `${path}.title`,
      code: "MISSING_REQUIRED_FIELD",
      message: "Setting must have a title.",
    });
  }
  if (!setting.type) {
    errors.push({
      path: `${path}.type`,
      code: "MISSING_REQUIRED_FIELD",
      message: "Setting must have a type.",
    });
    return;
  }

  // Valid type
  if (
    !VALID_SETTING_TYPES.includes(
      setting.type as (typeof VALID_SETTING_TYPES)[number],
    )
  ) {
    errors.push({
      path: `${path}.type`,
      code: "INVALID_TYPE",
      message: `Invalid setting type "${setting.type}".`,
    });
  }

  // Duplicate setting key (global)
  if (setting.key) {
    if (allSettingKeys.has(setting.key)) {
      errors.push({
        path: `${path}.key`,
        code: "DUPLICATE_KEY",
        message: `Duplicate setting key "${setting.key}".`,
      });
    }
    allSettingKeys.add(setting.key);
  }

  // Type-specific validation
  if (setting.type === "select" || setting.type === "multiselect") {
    if (!setting.options || setting.options.length === 0) {
      errors.push({
        path: `${path}.options`,
        code: "EMPTY_OPTIONS",
        message: `${setting.type} setting "${setting.key}" must have at least one option.`,
      });
    }
  }

  if (setting.type === "action") {
    if (!setting.buttonLabel) {
      errors.push({
        path: `${path}.buttonLabel`,
        code: "MISSING_REQUIRED_FIELD",
        message: `Action setting "${setting.key}" must have a buttonLabel.`,
      });
    }
    if (!setting.actionType) {
      errors.push({
        path: `${path}.actionType`,
        code: "MISSING_REQUIRED_FIELD",
        message: `Action setting "${setting.key}" must have an actionType.`,
      });
    }
  }

  if (setting.type === "compound") {
    if (!setting.fields || setting.fields.length === 0) {
      errors.push({
        path: `${path}.fields`,
        code: "MISSING_REQUIRED_FIELD",
        message: `Compound setting "${setting.key}" must have at least one field.`,
      });
    }
    if (setting.fields) {
      for (let i = 0; i < setting.fields.length; i++) {
        const field = setting.fields[i];
        if (field.key && field.key.includes(".")) {
          errors.push({
            path: `${path}.fields[${i}].key`,
            code: "COMPOUND_FIELD_DOT_KEY",
            message: `Compound field key "${field.key}" must not contain dots.`,
          });
        }
      }
    }
    if (!setting.displayStyle) {
      errors.push({
        path: `${path}.displayStyle`,
        code: "MISSING_REQUIRED_FIELD",
        message: `Compound setting "${setting.key}" must have a displayStyle.`,
      });
    }
  }

  if (setting.type === "custom") {
    if (!setting.renderer) {
      errors.push({
        path: `${path}.renderer`,
        code: "MISSING_REQUIRED_FIELD",
        message: `Custom setting "${setting.key}" must have a renderer.`,
      });
    }
  }

  // Collect visibility refs
  if ("visibleWhen" in setting && setting.visibleWhen) {
    const conditions = Array.isArray(setting.visibleWhen)
      ? setting.visibleWhen
      : [setting.visibleWhen];
    for (const condition of conditions as VisibilityCondition[]) {
      if (condition.setting) {
        allVisibilityRefs.push({
          path: `${path}.visibleWhen`,
          setting: condition.setting,
        });
      }
    }
  }
}
