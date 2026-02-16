// ---- Schema Root ----

export interface SettaraSchema {
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

  /** Optional icon identifier (top-level pages only) */
  icon?: string;

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

  /** Settings within this section */
  settings?: SettingDefinition[];

  /** Optional subsections (one level deep only) */
  subsections?: SubsectionDefinition[];
}

export interface SubsectionDefinition {
  key: string;
  title: string;
  description?: string;
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
  | ListSetting
  | CustomSetting;

// ---- Individual Setting Types ----

export interface BooleanSetting {
  key: string;
  title: string;
  description?: string;
  helpText?: string;
  type: "boolean";
  default?: boolean;
  confirm?: ConfirmConfig;
  dangerous?: boolean;
  visibleWhen?: VisibilityCondition | VisibilityCondition[];
  validation?: never;
}

export interface TextSetting {
  key: string;
  title: string;
  description?: string;
  helpText?: string;
  type: "text";
  default?: string;
  placeholder?: string;
  inputType?: "text" | "email" | "url" | "password";
  confirm?: ConfirmConfig;
  dangerous?: boolean;
  visibleWhen?: VisibilityCondition | VisibilityCondition[];
  validation?: {
    required?: boolean;
    minLength?: number;
    maxLength?: number;
    pattern?: string;
    message?: string;
  };
}

export interface NumberSetting {
  key: string;
  title: string;
  description?: string;
  helpText?: string;
  type: "number";
  default?: number;
  placeholder?: string;
  confirm?: ConfirmConfig;
  dangerous?: boolean;
  visibleWhen?: VisibilityCondition | VisibilityCondition[];
  validation?: {
    required?: boolean;
    min?: number;
    max?: number;
    message?: string;
  };
}

export interface SelectSetting {
  key: string;
  title: string;
  description?: string;
  helpText?: string;
  type: "select";
  options: Array<{ value: string; label: string }>;
  default?: string;
  confirm?: ConfirmConfig;
  dangerous?: boolean;
  visibleWhen?: VisibilityCondition | VisibilityCondition[];
  validation?: {
    required?: boolean;
    message?: string;
  };
}

export interface MultiSelectSetting {
  key: string;
  title: string;
  description?: string;
  helpText?: string;
  type: "multiselect";
  options: Array<{ value: string; label: string }>;
  default?: string[];
  confirm?: ConfirmConfig;
  dangerous?: boolean;
  visibleWhen?: VisibilityCondition | VisibilityCondition[];
  validation?: {
    required?: boolean;
    minSelections?: number;
    maxSelections?: number;
    message?: string;
  };
}

export interface DateSetting {
  key: string;
  title: string;
  description?: string;
  helpText?: string;
  type: "date";
  default?: string;
  confirm?: ConfirmConfig;
  dangerous?: boolean;
  visibleWhen?: VisibilityCondition | VisibilityCondition[];
  validation?: {
    required?: boolean;
    minDate?: string;
    maxDate?: string;
    message?: string;
  };
}

export interface CompoundSetting {
  key: string;
  title: string;
  description?: string;
  helpText?: string;
  type: "compound";
  displayStyle: "modal" | "page" | "inline";
  fields: Array<
    | TextSetting
    | NumberSetting
    | SelectSetting
    | MultiSelectSetting
    | DateSetting
    | BooleanSetting
  >;
  validation?: {
    rules?: Array<{
      when: string;
      require?: string;
      message: string;
    }>;
  };
  confirm?: ConfirmConfig;
  dangerous?: boolean;
  visibleWhen?: VisibilityCondition | VisibilityCondition[];
}

export interface ListSetting {
  key: string;
  title: string;
  description?: string;
  helpText?: string;
  type: "list";
  itemType: "text" | "compound";
  itemFields?: Array<
    TextSetting | NumberSetting | SelectSetting | BooleanSetting
  >;
  default?: unknown[];
  confirm?: ConfirmConfig;
  dangerous?: boolean;
  visibleWhen?: VisibilityCondition | VisibilityCondition[];
  validation?: {
    minItems?: number;
    maxItems?: number;
    message?: string;
  };
}

export interface ActionSetting {
  key: string;
  title: string;
  description?: string;
  helpText?: string;
  type: "action";
  buttonLabel: string;
  actionType: "modal" | "callback";
  dangerous?: boolean;
  visibleWhen?: VisibilityCondition | VisibilityCondition[];
}

export interface CustomSetting {
  key: string;
  title: string;
  description?: string;
  helpText?: string;
  type: "custom";
  renderer: string;
  config?: Record<string, unknown>;
  default?: unknown;
  confirm?: ConfirmConfig;
  dangerous?: boolean;
  visibleWhen?: VisibilityCondition | VisibilityCondition[];
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

export interface VisibilityCondition {
  /** The key of the setting this depends on */
  setting: string;

  /** Visible when value equals this */
  equals?: unknown;

  /** Visible when value does not equal this */
  notEquals?: unknown;

  /** Visible when value is one of these */
  oneOf?: unknown[];
}

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
    | "EMPTY_OPTIONS";

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
