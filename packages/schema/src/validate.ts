import type {
  SetteraSchema,
  PageDefinition,
  PageItem,
  SectionDefinition,
  SettingDefinition,
  ActionSetting,
  SchemaValidationError,
  VisibilityCondition,
  VisibilityRule,
} from "./types.js";
import { isPageGroup } from "./traversal.js";

interface ValidationContext {
  errors: SchemaValidationError[];
  settingKeys: Set<string>;
  visibilityRefs: Array<{ path: string; setting: string }>;
}

/**
 * Validates a SetteraSchema and returns an array of errors.
 * Empty array = valid schema.
 */
export function validateSchema(schema: SetteraSchema): SchemaValidationError[] {
  const ctx: ValidationContext = {
    errors: [],
    settingKeys: new Set(),
    visibilityRefs: [],
  };

  // Version check
  if (schema.version !== "1.0") {
    ctx.errors.push({
      path: "version",
      code: "INVALID_VERSION",
      message: `Expected version "1.0", got "${schema.version}".`,
    });
  }

  // Must have pages
  if (!schema.pages || schema.pages.length === 0) {
    ctx.errors.push({
      path: "pages",
      code: "MISSING_PAGES",
      message: "Schema must have at least one page.",
    });
    return ctx.errors;
  }

  // Validate pages (unwrap groups)
  const pageKeys = new Set<string>();
  for (let i = 0; i < schema.pages.length; i++) {
    const item: PageItem = schema.pages[i];
    if (isPageGroup(item)) {
      if (!item.label) {
        ctx.errors.push({
          path: `pages[${i}].label`,
          code: "MISSING_REQUIRED_FIELD",
          message: "Page group must have a label.",
        });
      }
      for (let j = 0; j < item.pages.length; j++) {
        validatePage(item.pages[j], `pages[${i}].pages[${j}]`, pageKeys, ctx);
      }
    } else {
      validatePage(item, `pages[${i}]`, pageKeys, ctx);
    }
  }

  // Check visibility references point to real settings
  for (const ref of ctx.visibilityRefs) {
    if (!ctx.settingKeys.has(ref.setting)) {
      ctx.errors.push({
        path: ref.path,
        code: "INVALID_VISIBILITY_REF",
        message: `visibleWhen references unknown setting "${ref.setting}".`,
      });
    }
  }

  return ctx.errors;
}

function validatePage(
  page: PageDefinition,
  path: string,
  pageKeys: Set<string>,
  ctx: ValidationContext,
): void {
  // Required fields
  if (!page.key) {
    ctx.errors.push({
      path: `${path}.key`,
      code: "MISSING_REQUIRED_FIELD",
      message: "Page must have a key.",
    });
  }
  if (!page.title) {
    ctx.errors.push({
      path: `${path}.title`,
      code: "MISSING_REQUIRED_FIELD",
      message: "Page must have a title.",
    });
  }

  // Duplicate page key
  if (page.key) {
    if (pageKeys.has(page.key)) {
      ctx.errors.push({
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
        ctx,
      );
    }
  }

  if (page.mode === "custom" && !page.renderer) {
    ctx.errors.push({
      path: `${path}.renderer`,
      code: "MISSING_REQUIRED_FIELD",
      message: `Custom page "${page.key}" must define a renderer.`,
    });
  }

  // Validate nested pages
  if (page.pages) {
    for (let i = 0; i < page.pages.length; i++) {
      validatePage(page.pages[i], `${path}.pages[${i}]`, pageKeys, ctx);
    }
  }
}

function validateSection(
  section: SectionDefinition,
  path: string,
  sectionKeys: Set<string>,
  ctx: ValidationContext,
): void {
  // Required fields
  if (!section.key) {
    ctx.errors.push({
      path: `${path}.key`,
      code: "MISSING_REQUIRED_FIELD",
      message: "Section must have a key.",
    });
  }
  if (!section.title) {
    ctx.errors.push({
      path: `${path}.title`,
      code: "MISSING_REQUIRED_FIELD",
      message: "Section must have a title.",
    });
  }

  // Duplicate section key within page
  if (section.key) {
    if (sectionKeys.has(section.key)) {
      ctx.errors.push({
        path: `${path}.key`,
        code: "DUPLICATE_KEY",
        message: `Duplicate section key "${section.key}".`,
      });
    }
    sectionKeys.add(section.key);
  }

  // Collect section-level visibility refs
  collectVisibilityRefs(section.visibleWhen, `${path}.visibleWhen`, ctx);

  // Validate settings
  if (section.settings) {
    for (let i = 0; i < section.settings.length; i++) {
      validateSetting(section.settings[i], `${path}.settings[${i}]`, ctx);
    }
  }

  // Validate subsections
  if (section.subsections) {
    const subsectionKeys = new Set<string>();
    for (let i = 0; i < section.subsections.length; i++) {
      const sub = section.subsections[i];
      const subPath = `${path}.subsections[${i}]`;

      if (!sub.key) {
        ctx.errors.push({
          path: `${subPath}.key`,
          code: "MISSING_REQUIRED_FIELD",
          message: "Subsection must have a key.",
        });
      }
      if (!sub.title) {
        ctx.errors.push({
          path: `${subPath}.title`,
          code: "MISSING_REQUIRED_FIELD",
          message: "Subsection must have a title.",
        });
      }
      if (sub.key) {
        if (subsectionKeys.has(sub.key)) {
          ctx.errors.push({
            path: `${subPath}.key`,
            code: "DUPLICATE_KEY",
            message: `Duplicate subsection key "${sub.key}".`,
          });
        }
        subsectionKeys.add(sub.key);
      }

      // Collect subsection-level visibility refs
      collectVisibilityRefs(sub.visibleWhen, `${subPath}.visibleWhen`, ctx);

      if (sub.settings) {
        for (let j = 0; j < sub.settings.length; j++) {
          validateSetting(sub.settings[j], `${subPath}.settings[${j}]`, ctx);
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
  "repeatable",
  "action",
  "custom",
] as const;

function validateSetting(
  setting: SettingDefinition,
  path: string,
  ctx: ValidationContext,
  localKeys?: Set<string>,
): void {
  // Required fields
  if (!setting.key) {
    ctx.errors.push({
      path: `${path}.key`,
      code: "MISSING_REQUIRED_FIELD",
      message: "Setting must have a key.",
    });
  }
  if (!setting.title) {
    ctx.errors.push({
      path: `${path}.title`,
      code: "MISSING_REQUIRED_FIELD",
      message: "Setting must have a title.",
    });
  }
  if (!setting.type) {
    ctx.errors.push({
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
    ctx.errors.push({
      path: `${path}.type`,
      code: "INVALID_TYPE",
      message: `Invalid setting type "${setting.type}".`,
    });
  }

  // Duplicate setting key — check against localKeys (scoped) or ctx.settingKeys (global)
  const keySet = localKeys ?? ctx.settingKeys;
  if (setting.key) {
    if (keySet.has(setting.key)) {
      ctx.errors.push({
        path: `${path}.key`,
        code: "DUPLICATE_KEY",
        message: localKeys
          ? `Duplicate field key "${setting.key}".`
          : `Duplicate setting key "${setting.key}".`,
      });
    }
    keySet.add(setting.key);
  }

  // Type-specific validation
  if (setting.type === "select" || setting.type === "multiselect") {
    if (!setting.options || setting.options.length === 0) {
      ctx.errors.push({
        path: `${path}.options`,
        code: "EMPTY_OPTIONS",
        message: `${setting.type} setting "${setting.key}" must have at least one option.`,
      });
    }

    if (setting.options && setting.options.length > 0) {
      // Duplicate option values
      const seen = new Set<string>();
      for (let i = 0; i < setting.options.length; i++) {
        const val = setting.options[i].value;
        if (seen.has(val)) {
          ctx.errors.push({
            path: `${path}.options[${i}].value`,
            code: "DUPLICATE_OPTION_VALUE",
            message: `Duplicate option value "${val}" in ${setting.type} setting "${setting.key}".`,
          });
        }
        seen.add(val);
      }

      // Default must be in options
      if (setting.type === "select" && setting.default !== undefined) {
        const validValues = setting.options.map((o) => o.value);
        if (!validValues.includes(setting.default)) {
          ctx.errors.push({
            path: `${path}.default`,
            code: "INVALID_DEFAULT",
            message: `Default "${setting.default}" is not a valid option for select setting "${setting.key}".`,
          });
        }
      }
      if (setting.type === "multiselect" && setting.default !== undefined) {
        const validValues = new Set(setting.options.map((o) => o.value));
        for (const val of setting.default) {
          if (!validValues.has(val)) {
            ctx.errors.push({
              path: `${path}.default`,
              code: "INVALID_DEFAULT",
              message: `Default value "${val}" is not a valid option for multiselect setting "${setting.key}".`,
            });
            break;
          }
        }
      }
    }
  }

  // Number default within min/max
  if (setting.type === "number" && setting.default !== undefined) {
    const min = setting.validation?.min;
    const max = setting.validation?.max;
    if (min !== undefined && setting.default < min) {
      ctx.errors.push({
        path: `${path}.default`,
        code: "INVALID_DEFAULT",
        message: `Default ${setting.default} is below min ${min} for number setting "${setting.key}".`,
      });
    }
    if (max !== undefined && setting.default > max) {
      ctx.errors.push({
        path: `${path}.default`,
        code: "INVALID_DEFAULT",
        message: `Default ${setting.default} is above max ${max} for number setting "${setting.key}".`,
      });
    }
  }

  // Date default within minDate/maxDate
  if (setting.type === "date" && setting.default !== undefined) {
    const minDate = setting.validation?.minDate;
    const maxDate = setting.validation?.maxDate;
    if (minDate !== undefined && setting.default < minDate) {
      ctx.errors.push({
        path: `${path}.default`,
        code: "INVALID_DEFAULT",
        message: `Default "${setting.default}" is before minDate "${minDate}" for date setting "${setting.key}".`,
      });
    }
    if (maxDate !== undefined && setting.default > maxDate) {
      ctx.errors.push({
        path: `${path}.default`,
        code: "INVALID_DEFAULT",
        message: `Default "${setting.default}" is after maxDate "${maxDate}" for date setting "${setting.key}".`,
      });
    }
  }

  // Text pattern must be valid regex
  if (setting.type === "text" && setting.validation?.pattern) {
    try {
      new RegExp(setting.validation.pattern);
    } catch {
      ctx.errors.push({
        path: `${path}.validation.pattern`,
        code: "INVALID_PATTERN",
        message: `Invalid regex pattern "${setting.validation.pattern}" in text setting "${setting.key}".`,
      });
    }
  }

  if (setting.type === "action") {
    validateActionSetting(setting, path, ctx);
  }

  if (setting.type === "compound") {
    if (!setting.fields || setting.fields.length === 0) {
      ctx.errors.push({
        path: `${path}.fields`,
        code: "MISSING_REQUIRED_FIELD",
        message: `Compound setting "${setting.key}" must have at least one field.`,
      });
    }
    if (setting.fields) {
      const fieldKeys = new Set<string>();
      for (let i = 0; i < setting.fields.length; i++) {
        const field = setting.fields[i];
        // Compound-specific: dot-key check
        if (field.key && field.key.includes(".")) {
          ctx.errors.push({
            path: `${path}.fields[${i}].key`,
            code: "COMPOUND_FIELD_DOT_KEY",
            message: `Compound field key "${field.key}" must not contain dots.`,
          });
        }
        // Recursive validation (handles key, title, type, duplicates, type-specific checks)
        validateSetting(field, `${path}.fields[${i}]`, ctx, fieldKeys);
      }
    }
    if (!setting.displayStyle) {
      ctx.errors.push({
        path: `${path}.displayStyle`,
        code: "MISSING_REQUIRED_FIELD",
        message: `Compound setting "${setting.key}" must have a displayStyle.`,
      });
    }

    // Validate compound rules reference existing field keys
    if (setting.validation?.rules && setting.fields) {
      const fieldKeys = new Set(setting.fields.map((f) => f.key));
      for (let i = 0; i < setting.validation.rules.length; i++) {
        const rule = setting.validation.rules[i];
        if (rule.when && !fieldKeys.has(rule.when)) {
          ctx.errors.push({
            path: `${path}.validation.rules[${i}].when`,
            code: "INVALID_COMPOUND_RULE",
            message: `Compound rule "when" references unknown field "${rule.when}" in setting "${setting.key}".`,
          });
        }
        if (rule.require && !fieldKeys.has(rule.require)) {
          ctx.errors.push({
            path: `${path}.validation.rules[${i}].require`,
            code: "INVALID_COMPOUND_RULE",
            message: `Compound rule "require" references unknown field "${rule.require}" in setting "${setting.key}".`,
          });
        }
      }
    }
  }

  if (setting.type === "repeatable") {
    if (setting.itemType === "compound") {
      if (!setting.itemFields || setting.itemFields.length === 0) {
        ctx.errors.push({
          path: `${path}.itemFields`,
          code: "INVALID_REPEATABLE_CONFIG",
          message: `Repeatable setting "${setting.key}" with itemType "compound" must have at least one itemField.`,
        });
      }
    }
    if (setting.itemType === "text" && setting.itemFields && setting.itemFields.length > 0) {
      ctx.errors.push({
        path: `${path}.itemFields`,
        code: "INVALID_REPEATABLE_CONFIG",
        message: `Repeatable setting "${setting.key}" with itemType "text" must not define itemFields.`,
      });
    }

    // Recursive validation of repeatable itemFields
    if (setting.itemType === "compound" && setting.itemFields && setting.itemFields.length > 0) {
      const itemFieldKeys = new Set<string>();
      for (let i = 0; i < setting.itemFields.length; i++) {
        validateSetting(setting.itemFields[i], `${path}.itemFields[${i}]`, ctx, itemFieldKeys);
      }
    }
  }

  if (setting.type === "custom") {
    if (!setting.renderer) {
      ctx.errors.push({
        path: `${path}.renderer`,
        code: "MISSING_REQUIRED_FIELD",
        message: `Custom setting "${setting.key}" must have a renderer.`,
      });
    }
  }

  // Collect visibility refs
  if ("visibleWhen" in setting && setting.visibleWhen) {
    collectVisibilityRefs(setting.visibleWhen, `${path}.visibleWhen`, ctx);
  }
}

// ---- Action validation helpers ----

function validateActionSetting(
  setting: ActionSetting,
  path: string,
  ctx: ValidationContext,
): void {
  const hasSingleButton = setting.buttonLabel !== undefined || setting.actionType !== undefined;
  const hasMultiButton = setting.actions !== undefined;

  // Mutual exclusivity: must have one form or the other, not both, not neither
  if (hasSingleButton && hasMultiButton) {
    ctx.errors.push({
      path,
      code: "INVALID_ACTION_CONFIG",
      message: `Action setting "${setting.key}" must use either buttonLabel/actionType or actions, not both.`,
    });
    return;
  }

  if (!hasSingleButton && !hasMultiButton) {
    ctx.errors.push({
      path,
      code: "INVALID_ACTION_CONFIG",
      message: `Action setting "${setting.key}" must define either buttonLabel/actionType or actions.`,
    });
    return;
  }

  if (hasMultiButton) {
    // Multi-button form
    const actions = setting.actions!;
    if (actions.length === 0) {
      ctx.errors.push({
        path: `${path}.actions`,
        code: "INVALID_ACTION_CONFIG",
        message: `Action setting "${setting.key}" actions array must not be empty.`,
      });
      return;
    }

    const itemKeys = new Set<string>();
    for (let i = 0; i < actions.length; i++) {
      const item = actions[i];
      const itemPath = `${path}.actions[${i}]`;

      if (!item.key) {
        ctx.errors.push({
          path: `${itemPath}.key`,
          code: "MISSING_REQUIRED_FIELD",
          message: `Action item must have a key.`,
        });
      }
      if (!item.buttonLabel) {
        ctx.errors.push({
          path: `${itemPath}.buttonLabel`,
          code: "MISSING_REQUIRED_FIELD",
          message: `Action item "${item.key || "(unnamed)"}" must have a buttonLabel.`,
        });
      }
      if (!item.actionType) {
        ctx.errors.push({
          path: `${itemPath}.actionType`,
          code: "MISSING_REQUIRED_FIELD",
          message: `Action item "${item.key || "(unnamed)"}" must have an actionType.`,
        });
      }

      // Duplicate item key within the array
      if (item.key) {
        if (itemKeys.has(item.key)) {
          ctx.errors.push({
            path: `${itemPath}.key`,
            code: "DUPLICATE_KEY",
            message: `Duplicate action item key "${item.key}".`,
          });
        }
        itemKeys.add(item.key);

        // Global uniqueness
        if (ctx.settingKeys.has(item.key)) {
          ctx.errors.push({
            path: `${itemPath}.key`,
            code: "DUPLICATE_KEY",
            message: `Action item key "${item.key}" conflicts with an existing setting key.`,
          });
        }
        ctx.settingKeys.add(item.key);
      }

      // Validate modal/page config per item
      if (item.actionType) {
        validateActionTypeConfig(
          item.actionType,
          item.modal,
          item.page,
          itemPath,
          item.key || setting.key,
          ctx,
        );
      }
    }
  } else {
    // Single-button form
    if (!setting.buttonLabel) {
      ctx.errors.push({
        path: `${path}.buttonLabel`,
        code: "MISSING_REQUIRED_FIELD",
        message: `Action setting "${setting.key}" must have a buttonLabel.`,
      });
    }
    if (!setting.actionType) {
      ctx.errors.push({
        path: `${path}.actionType`,
        code: "MISSING_REQUIRED_FIELD",
        message: `Action setting "${setting.key}" must have an actionType.`,
      });
    }

    if (setting.actionType) {
      validateActionTypeConfig(
        setting.actionType,
        setting.modal,
        setting.page,
        path,
        setting.key,
        ctx,
      );
    }
  }
}

function validateActionTypeConfig(
  actionType: "modal" | "callback" | "page",
  modal: ActionSetting["modal"],
  page: ActionSetting["page"],
  path: string,
  label: string,
  ctx: ValidationContext,
): void {
  if (actionType === "modal") {
    if (!modal) {
      ctx.errors.push({
        path: `${path}.modal`,
        code: "MISSING_REQUIRED_FIELD",
        message: `Action "${label}" with actionType "modal" must define modal config.`,
      });
    } else if (!modal.fields || modal.fields.length === 0) {
      ctx.errors.push({
        path: `${path}.modal.fields`,
        code: "MISSING_REQUIRED_FIELD",
        message: `Action "${label}" modal must define at least one field.`,
      });
    } else {
      const modalFieldKeys = new Set<string>();
      for (let i = 0; i < modal.fields.length; i++) {
        validateSetting(
          modal.fields[i],
          `${path}.modal.fields[${i}]`,
          ctx,
          modalFieldKeys,
        );
      }
    }
  }

  if (actionType === "page") {
    if (!page) {
      ctx.errors.push({
        path: `${path}.page`,
        code: "MISSING_ACTION_PAGE_CONFIG",
        message: `Action "${label}" with actionType "page" must define page config.`,
      });
    } else if (!page.renderer && (!page.fields || page.fields.length === 0)) {
      ctx.errors.push({
        path: `${path}.page`,
        code: "MISSING_ACTION_PAGE_CONFIG",
        message: `Action "${label}" page config must define either a renderer or fields.`,
      });
    } else if (page.fields && page.fields.length > 0) {
      const pageFieldKeys = new Set<string>();
      for (let i = 0; i < page.fields.length; i++) {
        validateSetting(
          page.fields[i],
          `${path}.page.fields[${i}]`,
          ctx,
          pageFieldKeys,
        );
      }
    }
  }
}

const VISIBILITY_OPERATORS = [
  "equals",
  "notEquals",
  "oneOf",
  "greaterThan",
  "lessThan",
  "contains",
  "isEmpty",
] as const;

/** Count how many visibility operators are defined on a condition. */
function countOperators(condition: VisibilityCondition): number {
  let count = 0;
  for (const op of VISIBILITY_OPERATORS) {
    if (condition[op] !== undefined) count++;
  }
  return count;
}

/** Extract setting references from visibility rules and validate operator usage. */
function collectVisibilityRefs(
  visibleWhen: VisibilityRule | VisibilityRule[] | undefined,
  path: string,
  ctx: ValidationContext,
): void {
  if (!visibleWhen) return;

  const rules: VisibilityRule[] = Array.isArray(visibleWhen) ? visibleWhen : [visibleWhen];
  for (const rule of rules) {
    if ("or" in rule) {
      // OR group — collect refs from each inner condition
      for (const condition of rule.or) {
        if (condition.setting) {
          ctx.visibilityRefs.push({ path, setting: condition.setting });
        }
        if (countOperators(condition) > 1) {
          ctx.errors.push({
            path,
            code: "MULTIPLE_VISIBILITY_OPERATORS",
            message: `Visibility condition for "${condition.setting}" defines multiple operators. Use exactly one.`,
          });
        }
      }
    } else {
      // Plain condition
      if (rule.setting) {
        ctx.visibilityRefs.push({ path, setting: rule.setting });
      }
      if (countOperators(rule) > 1) {
        ctx.errors.push({
          path,
          code: "MULTIPLE_VISIBILITY_OPERATORS",
          message: `Visibility condition for "${rule.setting}" defines multiple operators. Use exactly one.`,
        });
      }
    }
  }
}
