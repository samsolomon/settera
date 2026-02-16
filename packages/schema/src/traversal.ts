import type {
  SettaraSchema,
  PageDefinition,
  SettingDefinition,
  FlattenedSetting,
  VisibilityCondition,
} from "./types.js";

/**
 * Walk all pages/sections/subsections and return a flat list of settings
 * with their structural metadata.
 */
export function flattenSettings(schema: SettaraSchema): FlattenedSetting[] {
  const result: FlattenedSetting[] = [];

  function walkPages(pages: PageDefinition[], pathPrefix: string): void {
    for (let pi = 0; pi < pages.length; pi++) {
      const page = pages[pi];
      const pagePath = `${pathPrefix}[${pi}]`;

      if (page.sections) {
        for (let si = 0; si < page.sections.length; si++) {
          const section = page.sections[si];
          const sectionPath = `${pagePath}.sections[${si}]`;

          if (section.settings) {
            for (let i = 0; i < section.settings.length; i++) {
              result.push({
                definition: section.settings[i],
                path: `${sectionPath}.settings[${i}]`,
                pageKey: page.key,
                sectionKey: section.key,
              });
            }
          }

          if (section.subsections) {
            for (let ssi = 0; ssi < section.subsections.length; ssi++) {
              const subsection = section.subsections[ssi];
              const subPath = `${sectionPath}.subsections[${ssi}]`;
              for (let i = 0; i < subsection.settings.length; i++) {
                result.push({
                  definition: subsection.settings[i],
                  path: `${subPath}.settings[${i}]`,
                  pageKey: page.key,
                  sectionKey: section.key,
                });
              }
            }
          }
        }
      }

      if (page.pages) {
        walkPages(page.pages, `${pagePath}.pages`);
      }
    }
  }

  walkPages(schema.pages, "pages");
  return result;
}

/**
 * Find a setting definition by its key. Returns undefined if not found.
 */
export function getSettingByKey(
  schema: SettaraSchema,
  key: string,
): SettingDefinition | undefined {
  function searchPages(pages: PageDefinition[]): SettingDefinition | undefined {
    for (const page of pages) {
      if (page.sections) {
        for (const section of page.sections) {
          if (section.settings) {
            for (const setting of section.settings) {
              if (setting.key === key) return setting;
            }
          }
          if (section.subsections) {
            for (const sub of section.subsections) {
              for (const setting of sub.settings) {
                if (setting.key === key) return setting;
              }
            }
          }
        }
      }
      if (page.pages) {
        const found = searchPages(page.pages);
        if (found) return found;
      }
    }
    return undefined;
  }

  return searchPages(schema.pages);
}

/**
 * Find a page definition by its key. Searches recursively through nested pages.
 */
export function getPageByKey(
  schema: SettaraSchema,
  key: string,
): PageDefinition | undefined {
  function searchPages(pages: PageDefinition[]): PageDefinition | undefined {
    for (const page of pages) {
      if (page.key === key) return page;
      if (page.pages) {
        const found = searchPages(page.pages);
        if (found) return found;
      }
    }
    return undefined;
  }

  return searchPages(schema.pages);
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
export function resolvePageKey(page: PageDefinition): string {
  if (isFlattenedPage(page)) return resolvePageKey(page.pages![0]);
  return page.key;
}

/**
 * Build a dependency map from visibleWhen conditions.
 * Returns Map<dependentKey, controllerKeys[]>.
 */
export function resolveDependencies(
  schema: SettaraSchema,
): Map<string, string[]> {
  const deps = new Map<string, string[]>();
  const flattened = flattenSettings(schema);

  for (const { definition } of flattened) {
    if (!("visibleWhen" in definition) || !definition.visibleWhen) continue;

    const conditions: VisibilityCondition[] = Array.isArray(
      definition.visibleWhen,
    )
      ? definition.visibleWhen
      : [definition.visibleWhen];

    const controllers = conditions.map((c) => c.setting);
    if (controllers.length > 0) {
      deps.set(definition.key, controllers);
    }
  }

  return deps;
}
