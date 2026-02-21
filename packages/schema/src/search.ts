import type { SetteraSchema } from "./types.js";
import { walkSchema, isPageGroup } from "./traversal.js";

export interface SearchSchemaResult {
  settingKeys: Set<string>;
  pageKeys: Set<string>;
}

/**
 * Search a schema for settings and pages matching a query string.
 *
 * Matches are case-insensitive against page titles, section titles,
 * subsection titles, and setting titles/descriptions. When a container
 * matches (page, section, subsection), all settings within it are included.
 * Ancestor pages of any matched page are included so navigation trees
 * can show the full path.
 */
export function searchSchema(
  schema: SetteraSchema,
  query: string,
): SearchSchemaResult {
  const settingKeys = new Set<string>();
  const pageKeys = new Set<string>();

  if (!query) {
    return { settingKeys, pageKeys };
  }

  const q = query.toLowerCase();

  const matchedPages = new Set<string>();
  const matchedSections = new Set<string>();
  const subsectionMatchedSettings = new Set<string>();
  const parentMap = new Map<string, string>();

  // Match group labels — when a group label matches, include all its pages
  for (const item of schema.pages) {
    if (isPageGroup(item) && item.label.toLowerCase().includes(q)) {
      for (const page of item.pages) {
        matchedPages.add(page.key);
        pageKeys.add(page.key);
      }
    }
  }

  walkSchema(schema, {
    onPage(page) {
      if (page.pages) {
        for (const child of page.pages) {
          parentMap.set(child.key, page.key);
        }
      }
      if (page.title?.toLowerCase().includes(q)) {
        matchedPages.add(page.key);
        pageKeys.add(page.key);
      }
    },
    onSection(section, ctx) {
      if (section.title?.toLowerCase().includes(q)) {
        matchedSections.add(`${ctx.pageKey}:${section.key}`);
      }
      if (section.subsections) {
        for (const sub of section.subsections) {
          if (sub.title.toLowerCase().includes(q)) {
            for (const setting of sub.settings) {
              subsectionMatchedSettings.add(setting.key);
            }
          }
        }
      }
    },
    onSetting(setting, ctx) {
      const pageMatched = matchedPages.has(ctx.pageKey);
      const sectionMatched = matchedSections.has(
        `${ctx.pageKey}:${ctx.sectionKey}`,
      );
      const subMatched = subsectionMatchedSettings.has(setting.key);
      const titleMatch =
        setting.title?.toLowerCase().includes(q) ?? false;
      const descMatch =
        setting.description?.toLowerCase().includes(q) ?? false;

      if (
        pageMatched ||
        sectionMatched ||
        subMatched ||
        titleMatch ||
        descMatch
      ) {
        settingKeys.add(setting.key);
        pageKeys.add(ctx.pageKey);
      }
    },
  });

  // Propagate: if a child page matched, include all ancestor pages
  for (const key of [...pageKeys]) {
    let current = key;
    while (parentMap.has(current)) {
      const parent = parentMap.get(current)!;
      pageKeys.add(parent);
      current = parent;
    }
  }

  return { settingKeys, pageKeys };
}
