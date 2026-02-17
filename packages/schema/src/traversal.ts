import type {
  SetteraSchema,
  PageDefinition,
  SectionDefinition,
  SettingDefinition,
  FlattenedSetting,
  VisibilityCondition,
} from "./types.js";

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
}

export interface SchemaVisitor {
  /** Called for each page. Return `false` to stop the entire walk. */
  onPage?(page: PageDefinition, ctx: SchemaWalkContext): void | false;
  /** Called for each section. Return `false` to stop the entire walk. */
  onSection?(section: SectionDefinition, ctx: SchemaWalkContext): void | false;
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
        });
        if (result === false) return false;
      }

      if (page.sections) {
        for (let si = 0; si < page.sections.length; si++) {
          const section = page.sections[si];
          const sectionPath = `${pagePath}.sections[${si}]`;
          const sectionCtx = {
            path: sectionPath,
            depth,
            pageKey: page.key,
            sectionKey: section.key,
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
              });
              if (result === false) return false;
            }
          }

          if (section.subsections && visitor.onSetting) {
            for (let ssi = 0; ssi < section.subsections.length; ssi++) {
              const subsection = section.subsections[ssi];
              const subPath = `${sectionPath}.subsections[${ssi}]`;
              for (let i = 0; i < subsection.settings.length; i++) {
                const result = visitor.onSetting(subsection.settings[i], {
                  path: `${subPath}.settings[${i}]`,
                  depth,
                  pageKey: page.key,
                  sectionKey: section.key,
                });
                if (result === false) return false;
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

  walk(schema.pages, "pages", 0);
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
 * Build a dependency map from visibleWhen conditions.
 * Returns Map<dependentKey, controllerKeys[]>.
 */
export function resolveDependencies(
  schema: SetteraSchema,
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
