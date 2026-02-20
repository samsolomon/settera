import type {
  SetteraSchema,
  PageDefinition,
  PageGroup,
  PageItem,
  SectionDefinition,
  SubsectionDefinition,
  SettingDefinition,
  FlattenedSetting,
} from "./types.js";

// ---- Page Group Helpers ----

/**
 * Type guard: returns true when a page item is a `PageGroup` (has `label`, no `key`).
 */
export function isPageGroup(item: PageItem): item is PageGroup {
  return "label" in item && !("key" in item);
}

/**
 * Extract all `PageDefinition` entries from a mixed `PageItem[]` array,
 * unwrapping any `PageGroup` containers. Preserves declaration order.
 */
export function flattenPageItems(items: PageItem[]): PageDefinition[] {
  const result: PageDefinition[] = [];
  for (const item of items) {
    if (isPageGroup(item)) {
      result.push(...item.pages);
    } else {
      result.push(item);
    }
  }
  return result;
}

// ---- Generic Schema Walker ----

export interface SchemaWalkContext {
  /** Dot-path through the schema structure, e.g. "pages[0].sections[1].settings[2]" */
  path: string;
  /** Page nesting depth (0 = top-level) */
  depth: number;
  /** Key of the enclosing page */
  pageKey: string;
  /** Key of the enclosing section (empty string for page-level callbacks) */
  sectionKey: string;
  /** Key of the enclosing subsection (empty string when not in a subsection) */
  subsectionKey: string;
}

export interface SchemaVisitor {
  /** Called for each page. Return `false` to stop the entire walk. */
  onPage?(page: PageDefinition, ctx: SchemaWalkContext): void | false;
  /** Called for each section. Return `false` to stop the entire walk. */
  onSection?(section: SectionDefinition, ctx: SchemaWalkContext): void | false;
  /** Called for each subsection. Return `false` to stop the entire walk. */
  onSubsection?(subsection: SubsectionDefinition, ctx: SchemaWalkContext): void | false;
  /** Called for each setting (including those inside subsections). Return `false` to stop the entire walk. */
  onSetting?(setting: SettingDefinition, ctx: SchemaWalkContext): void | false;
}

/**
 * Walk a schema's page → section → subsection → setting tree, invoking
 * visitor callbacks at each level. Returning `false` from any callback
 * stops the entire walk immediately.
 */
export function walkSchema(
  schema: SetteraSchema,
  visitor: SchemaVisitor,
): void {
  // Unwrap top-level groups into a flat page list for walking
  const topLevelPages = flattenPageItems(schema.pages);

  function walk(
    pages: PageDefinition[],
    pathPrefix: string,
    depth: number,
  ): boolean {
    for (let pi = 0; pi < pages.length; pi++) {
      const page = pages[pi];
      const pagePath = `${pathPrefix}[${pi}]`;

      if (visitor.onPage) {
        const result = visitor.onPage(page, {
          path: pagePath,
          depth,
          pageKey: page.key,
          sectionKey: "",
          subsectionKey: "",
        });
        if (result === false) return false;
      }

      if (page.sections) {
        for (let si = 0; si < page.sections.length; si++) {
          const section = page.sections[si];
          const sectionPath = `${pagePath}.sections[${si}]`;
          const sectionCtx: SchemaWalkContext = {
            path: sectionPath,
            depth,
            pageKey: page.key,
            sectionKey: section.key,
            subsectionKey: "",
          };

          if (visitor.onSection) {
            const result = visitor.onSection(section, sectionCtx);
            if (result === false) return false;
          }

          if (section.settings && visitor.onSetting) {
            for (let i = 0; i < section.settings.length; i++) {
              const result = visitor.onSetting(section.settings[i], {
                path: `${sectionPath}.settings[${i}]`,
                depth,
                pageKey: page.key,
                sectionKey: section.key,
                subsectionKey: "",
              });
              if (result === false) return false;
            }
          }

          if (section.subsections) {
            for (let ssi = 0; ssi < section.subsections.length; ssi++) {
              const subsection = section.subsections[ssi];
              const subPath = `${sectionPath}.subsections[${ssi}]`;

              if (visitor.onSubsection) {
                const result = visitor.onSubsection(subsection, {
                  path: subPath,
                  depth,
                  pageKey: page.key,
                  sectionKey: section.key,
                  subsectionKey: subsection.key,
                });
                if (result === false) return false;
              }

              if (visitor.onSetting) {
                for (let i = 0; i < subsection.settings.length; i++) {
                  const result = visitor.onSetting(subsection.settings[i], {
                    path: `${subPath}.settings[${i}]`,
                    depth,
                    pageKey: page.key,
                    sectionKey: section.key,
                    subsectionKey: subsection.key,
                  });
                  if (result === false) return false;
                }
              }
            }
          }
        }
      }

      if (page.pages) {
        if (!walk(page.pages, `${pagePath}.pages`, depth + 1)) return false;
      }
    }
    return true;
  }

  walk(topLevelPages, "pages", 0);
}

// ---- Derived traversal helpers (built on walkSchema) ----

/**
 * Walk all pages/sections/subsections and return a flat list of settings
 * with their structural metadata.
 */
export function flattenSettings(schema: SetteraSchema): FlattenedSetting[] {
  const result: FlattenedSetting[] = [];
  walkSchema(schema, {
    onSetting(setting, ctx) {
      result.push({
        definition: setting,
        path: ctx.path,
        pageKey: ctx.pageKey,
        sectionKey: ctx.sectionKey,
        subsectionKey: ctx.subsectionKey,
      });
    },
  });
  return result;
}

/**
 * Find a setting definition by its key. Returns undefined if not found.
 */
export function getSettingByKey(
  schema: SetteraSchema,
  key: string,
): SettingDefinition | undefined {
  let found: SettingDefinition | undefined;
  walkSchema(schema, {
    onSetting(setting) {
      if (setting.key === key) {
        found = setting;
        return false;
      }
    },
  });
  return found;
}

/**
 * Find a page definition by its key. Searches recursively through nested pages.
 */
export function getPageByKey(
  schema: SetteraSchema,
  key: string,
): PageDefinition | undefined {
  let found: PageDefinition | undefined;
  walkSchema(schema, {
    onPage(page) {
      if (page.key === key) {
        found = page;
        return false;
      }
    },
  });
  return found;
}

/**
 * A page is "flattened" when it has exactly one child page and no sections
 * of its own. In the sidebar, it renders as a leaf that navigates directly
 * to its single child's content.
 */
export function isFlattenedPage(page: PageDefinition): boolean {
  return (
    page.pages?.length === 1 && (!page.sections || page.sections.length === 0)
  );
}

/**
 * Resolve through flattened pages to find the leaf key that should be used
 * as the activePage. Recurses when the single child is itself flattened.
 */
export function resolvePageKey(page: PageDefinition, depth = 0): string {
  if (depth > 10) return page.key;
  if (isFlattenedPage(page)) return resolvePageKey(page.pages![0], depth + 1);
  return page.key;
}

/**
 * Build an O(1) lookup index from setting key to FlattenedSetting.
 */
export function buildSettingIndex(
  flatSettings: FlattenedSetting[],
): Map<string, FlattenedSetting> {
  const index = new Map<string, FlattenedSetting>();
  for (const entry of flatSettings) {
    index.set(entry.definition.key, entry);
  }
  return index;
}

/**
 * Build an O(1) lookup index from "pageKey:sectionKey" to SectionDefinition.
 */
export function buildSectionIndex(
  schema: SetteraSchema,
): Map<string, SectionDefinition> {
  const index = new Map<string, SectionDefinition>();
  walkSchema(schema, {
    onSection(section, ctx) {
      index.set(`${ctx.pageKey}:${section.key}`, section);
    },
  });
  return index;
}

