import { createContext, useContext } from "react";

export interface SetteraLabels {
  // Save status
  saving?: string;
  saved?: string;
  save?: string;
  saveFailed?: string;

  // Common actions
  cancel?: string;
  confirm?: string;
  submit?: string;
  back?: string;
  backToApp?: string;
  edit?: string;
  open?: string;
  remove?: string;
  loading?: string;

  // Select
  select?: string;
  searchSelectPlaceholder?: string;
  noResults?: string;

  // List / repeatable
  addItem?: string;
  up?: string;
  down?: string;

  // Search
  searchPlaceholder?: string;
  clearSearch?: string;

  // Section collapse
  expandSection?: string;
  collapseSection?: string;
  expand?: string;
  collapse?: string;

  // Deep links
  copyLink?: string;
  copyLinkToSection?: string;

  // Calendar
  openCalendar?: string;
  selectDate?: string;

  // Navigation
  openNavigation?: string;

  // Confirm dialog
  typeToConfirm?: string;

  // Action modal fallback
  reviewFieldsAndSubmit?: string;
}

export const DEFAULT_LABELS: Required<SetteraLabels> = {
  saving: "Saving\u2026",
  saved: "Saved",
  save: "Save",
  saveFailed: "Save failed",
  cancel: "Cancel",
  confirm: "Confirm",
  submit: "Submit",
  back: "Back",
  backToApp: "Back to app",
  edit: "Edit",
  open: "Open",
  remove: "Remove",
  loading: "Loading\u2026",
  select: "Select\u2026",
  searchSelectPlaceholder: "Search\u2026",
  noResults: "No results",
  addItem: "Add item",
  up: "Up",
  down: "Down",
  searchPlaceholder: "Search settings\u2026",
  clearSearch: "Clear search",
  expandSection: "Expand section",
  collapseSection: "Collapse section",
  expand: "Expand",
  collapse: "Collapse",
  copyLink: "Copy link to setting",
  copyLinkToSection: "Copy link to section",
  openCalendar: "Open calendar",
  selectDate: "Select date",
  openNavigation: "Open navigation",
  typeToConfirm: "Type {text} to confirm",
  reviewFieldsAndSubmit: "Review the fields and submit.",
};

export const SetteraLabelsContext =
  createContext<Required<SetteraLabels>>(DEFAULT_LABELS);

export function useSetteraLabels(): Required<SetteraLabels> {
  return useContext(SetteraLabelsContext);
}

export function mergeLabels(
  overrides?: SetteraLabels,
): Required<SetteraLabels> {
  if (!overrides) return DEFAULT_LABELS;
  return { ...DEFAULT_LABELS, ...overrides };
}
