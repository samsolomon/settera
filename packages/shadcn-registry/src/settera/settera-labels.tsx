"use client";

import { createContext, useContext } from "react";

export interface SetteraLabels {
  saving?: string;
  saved?: string;
  save?: string;
  saveFailed?: string;
  cancel?: string;
  confirm?: string;
  submit?: string;
  back?: string;
  backToApp?: string;
  select?: string;
  edit?: string;
  open?: string;
  addItem?: string;
  remove?: string;
  loading?: string;
  searchPlaceholder?: string;
  openCalendar?: string;
  selectDate?: string;
  copyLink?: string;
  copyLinkToSection?: string;
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
  select: "Select\u2026",
  edit: "Edit",
  open: "Open",
  addItem: "Add item",
  remove: "Remove",
  loading: "Loading\u2026",
  searchPlaceholder: "Search settings\u2026",
  openCalendar: "Open calendar",
  selectDate: "Select date",
  copyLink: "Copy link to setting",
  copyLinkToSection: "Copy link to section",
};

export const SetteraLabelsContext = createContext<Required<SetteraLabels>>(DEFAULT_LABELS);

export function useSetteraLabels(): Required<SetteraLabels> {
  return useContext(SetteraLabelsContext);
}

export function mergeLabels(overrides?: SetteraLabels): Required<SetteraLabels> {
  if (!overrides) return DEFAULT_LABELS;
  return { ...DEFAULT_LABELS, ...overrides };
}
