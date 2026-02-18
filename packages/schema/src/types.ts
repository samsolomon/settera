// ---- Schema Root ----

export interface SetteraSchema {
  /** Schema version for future compatibility */
  version: "1.0";

  /** Application-level metadata */
  meta?: {
    title?: string;
    description?: string;
  };

  /** Top-level navigation pages (appear in sidebar) */
  pages: PageDefinition[];
}

// ---- Navigation Hierarchy ----

export interface PageDefinition {
  /** Unique key for this page */
  key: string;

  /** Display title in the sidebar */
  title: string;

  /** Optional description displayed below the page title */
  description?: string;

  /** Optional icon identifier (top-level pages only) */
  icon?: string;

  /** Page rendering mode: auto settings sections or custom app content */
  mode?: "settings" | "custom";

  /** Required when mode is "custom"; references a consumer-provided page renderer */
  renderer?: string;

  /** Content sections displayed on this page */
  sections?: SectionDefinition[];

  /** Nested child pages (appear as sub-items in sidebar) */
  pages?: PageDefinition[];
}

export interface SectionDefinition {
  /** Unique key within the page */
  key: string;

  /** Section heading displayed above the group */
  title: string;

  /** Optional section description */
  description?: string;

  /** Whether the section can be collapsed */
  collapsible?: boolean;

  /** Whether the section starts collapsed (requires collapsible) */
  defaultCollapsed?: boolean;

  /** Conditionally show/hide the entire section */
  visibleWhen?: VisibilityRule | VisibilityRule[];

  /** Settings within this section */
  settings?: SettingDefinition[];

  /** Optional subsections (one level deep only) */
  subsections?: SubsectionDefinition[];
}

export interface SubsectionDefinition {
  key: string;
  title: string;
  description?: string;
  /** Conditionally show/hide the entire subsection */
  visibleWhen?: VisibilityRule | VisibilityRule[];
  settings: SettingDefinition[];
}

// ---- Setting Types (Discriminated Union) ----

/** All setting types. Actions are separated from value-bearing settings. */
export type SettingDefinition = ValueSetting | ActionSetting;

/** Settings that hold a value. */
export type ValueSetting =
  | BooleanSetting
  | TextSetting
  | NumberSetting
  | SelectSetting
  | MultiSelectSetting
  | DateSetting
  | CompoundSetting
  | RepeatableSetting
  | CustomSetting;

// ---- Select Option ----

export interface SelectOption {
  value: string;
  label: string;
  /** Optional description shown below the label */
  description?: string;
  /** Optional group name for grouped option lists */
  group?: string;
}

// ---- Base Setting Interfaces ----

/** Fields shared by all setting types (value-bearing and actions). */
export interface BaseSettingFields {
  key: string;
  title: string;
  description?: string;
  helpText?: string;
  dangerous?: boolean;
  disabled?: boolean;
  badge?: string;
  deprecated?: string | boolean;
  visibleWhen?: VisibilityRule | VisibilityRule[];
}

/** Fields shared by all value-bearing settings (extends base with confirm). */
export interface BaseValueSettingFields extends BaseSettingFields {
  confirm?: ConfirmConfig;
}

// ---- Individual Setting Types ----

export interface BooleanSetting extends BaseValueSettingFields {
  type: "boolean";
  default?: boolean;
  validation?: never;
}

export interface TextSetting extends BaseValueSettingFields {
  type: "text";
  default?: string;
  placeholder?: string;
  inputType?: "text" | "email" | "url" | "password" | "textarea";
  /** Number of visible rows when inputType is "textarea" */
  rows?: number;
  readonly?: boolean;
  validation?: {
    required?: boolean;
    minLength?: number;
    maxLength?: number;
    pattern?: string;
    message?: string;
  };
}

export interface NumberSetting extends BaseValueSettingFields {
  type: "number";
  default?: number;
  placeholder?: string;
  readonly?: boolean;
  /** Display hint for rendering: standard input or slider */
  displayHint?: "input" | "slider";
  validation?: {
    required?: boolean;
    min?: number;
    max?: number;
    /** Step increment; use 1 to enforce integers */
    step?: number;
    message?: string;
  };
}

export interface SelectSetting extends BaseValueSettingFields {
  type: "select";
  options: SelectOption[];
  default?: string;
  placeholder?: string;
  validation?: {
    required?: boolean;
    message?: string;
  };
}

export interface MultiSelectSetting extends BaseValueSettingFields {
  type: "multiselect";
  options: SelectOption[];
  default?: string[];
  validation?: {
    required?: boolean;
    minSelections?: number;
    maxSelections?: number;
    message?: string;
  };
}

export interface DateSetting extends BaseValueSettingFields {
  type: "date";
  default?: string;
  readonly?: boolean;
  validation?: {
    required?: boolean;
    minDate?: string;
    maxDate?: string;
    message?: string;
  };
}

/** Field types allowed inside a compound setting. */
export type CompoundFieldDefinition =
  | TextSetting
  | NumberSetting
  | SelectSetting
  | MultiSelectSetting
  | DateSetting
  | BooleanSetting;

export interface CompoundSetting extends BaseValueSettingFields {
  type: "compound";
  displayStyle: "modal" | "page" | "inline";
  fields: CompoundFieldDefinition[];
  validation?: {
    rules?: Array<{
      when: string;
      require?: string;
      message: string;
    }>;
  };
}

/** Field types allowed inside a repeatable compound item. */
export type RepeatableFieldDefinition =
  | TextSetting
  | NumberSetting
  | SelectSetting
  | MultiSelectSetting
  | DateSetting
  | BooleanSetting;

export interface RepeatableSetting extends BaseValueSettingFields {
  type: "repeatable";
  itemType: "text" | "compound";
  itemFields?: RepeatableFieldDefinition[];
  default?: unknown[];
  validation?: {
    minItems?: number;
    maxItems?: number;
    message?: string;
  };
}

export interface ActionSetting extends BaseSettingFields {
  type: "action";
  buttonLabel: string;
  actionType: "modal" | "callback";
  modal?: {
    title?: string;
    description?: string;
    submitLabel?: string;
    cancelLabel?: string;
    fields: ModalActionFieldSetting[];
    initialValues?: Record<string, unknown>;
  };
}

export type ModalActionFieldSetting =
  | TextSetting
  | NumberSetting
  | BooleanSetting
  | SelectSetting
  | MultiSelectSetting
  | DateSetting
  | CompoundSetting
  | RepeatableSetting;

export interface CustomSetting extends BaseValueSettingFields {
  type: "custom";
  renderer: string;
  config?: Record<string, unknown>;
  default?: unknown;
  validation?: {
    required?: boolean;
    message?: string;
  };
}

// ---- Shared Types ----

export interface ConfirmConfig {
  /** Title of the confirmation dialog */
  title?: string;

  /** Message body */
  message: string;

  /** Label for the confirm button */
  confirmLabel?: string;

  /** Label for the cancel button */
  cancelLabel?: string;

  /** For dangerous actions, require typing a confirmation string */
  requireText?: string;
}

/** Primitive value types that can appear in visibility conditions. */
export type VisibilityValue = string | number | boolean | null;

export interface VisibilityCondition {
  /** The key of the setting this depends on */
  setting: string;

  /** Visible when value equals this */
  equals?: VisibilityValue;

  /** Visible when value does not equal this */
  notEquals?: VisibilityValue;

  /** Visible when value is one of these */
  oneOf?: VisibilityValue[];

  /** Visible when value is greater than this (numeric) */
  greaterThan?: number;

  /** Visible when value is less than this (numeric) */
  lessThan?: number;

  /** Visible when an array value contains this item (for multiselect) */
  contains?: VisibilityValue;

  /** Visible when value is empty (true) or not empty (false) */
  isEmpty?: boolean;
}

/** OR group: at least one condition must be true. */
export interface VisibilityConditionGroup {
  or: VisibilityCondition[];
}

/** A single visibility rule: either a direct condition or an OR group. */
export type VisibilityRule = VisibilityCondition | VisibilityConditionGroup;

// ---- Validation ----

export interface SchemaValidationError {
  /** Dot-path to the offending location in the schema */
  path: string;

  /** Machine-readable error code */
  code:
    | "INVALID_VERSION"
    | "INVALID_TYPE"
    | "MISSING_PAGES"
    | "MISSING_REQUIRED_FIELD"
    | "DUPLICATE_KEY"
    | "INVALID_VISIBILITY_REF"
    | "COMPOUND_FIELD_DOT_KEY"
    | "EMPTY_OPTIONS"
    | "DUPLICATE_OPTION_VALUE"
    | "INVALID_DEFAULT"
    | "INVALID_REPEATABLE_CONFIG"
    | "INVALID_PATTERN"
    | "INVALID_COMPOUND_RULE";

  /** Human-readable error message */
  message: string;
}

// ---- Traversal ----

export interface FlattenedSetting {
  /** The setting definition */
  definition: SettingDefinition;

  /** Dot-path through the schema structure */
  path: string;

  /** Key of the page this setting belongs to */
  pageKey: string;

  /** Key of the section this setting belongs to */
  sectionKey: string;
}
