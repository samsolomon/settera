import { describe, it, expect } from "vitest";
import {
  walkSchema,
  flattenSettings,
  getSettingByKey,
  getPageByKey,
  isFlattenedPage,
  resolvePageKey,
} from "../traversal.js";
import { referenceSchema } from "./fixtures/reference-schema.js";
import type { SetteraSchema } from "../types.js";
import type { SchemaWalkContext } from "../traversal.js";

describe("flattenSettings", () => {
  it("returns all settings from the reference schema", () => {
    const flat = flattenSettings(referenceSchema);
    const keys = flat.map((f) => f.definition.key);
    expect(keys).toContain("general.autoSave");
    expect(keys).toContain("security.ssoEnabled");
    expect(keys).toContain("editor.fontSize");
    expect(keys).toContain("advanced.clearCache");
  });

  it("includes settings from nested pages", () => {
    const flat = flattenSettings(referenceSchema);
    const keys = flat.map((f) => f.definition.key);
    expect(keys).toContain("privacy.telemetry");
    expect(keys).toContain("privacy.crashReports");
  });

  it("sets correct pageKey for each setting", () => {
    const flat = flattenSettings(referenceSchema);
    const autoSave = flat.find((f) => f.definition.key === "general.autoSave");
    expect(autoSave?.pageKey).toBe("general");

    const telemetry = flat.find(
      (f) => f.definition.key === "privacy.telemetry",
    );
    expect(telemetry?.pageKey).toBe("general.privacy");
  });

  it("sets correct sectionKey for each setting", () => {
    const flat = flattenSettings(referenceSchema);
    const autoSave = flat.find((f) => f.definition.key === "general.autoSave");
    expect(autoSave?.sectionKey).toBe("behavior");

    const fontSize = flat.find((f) => f.definition.key === "editor.fontSize");
    expect(fontSize?.sectionKey).toBe("editor");
  });

  it("handles settings inside subsections", () => {
    const schema: SetteraSchema = {
      version: "1.0",
      pages: [
        {
          key: "p1",
          title: "P1",
          sections: [
            {
              key: "s1",
              title: "S1",
              subsections: [
                {
                  key: "sub1",
                  title: "Sub 1",
                  settings: [
                    {
                      key: "sub.setting",
                      title: "Sub Setting",
                      type: "boolean",
                    },
                  ],
                },
              ],
            },
          ],
        },
      ],
    };
    const flat = flattenSettings(schema);
    expect(flat).toHaveLength(1);
    expect(flat[0].definition.key).toBe("sub.setting");
    expect(flat[0].pageKey).toBe("p1");
    expect(flat[0].sectionKey).toBe("s1");
  });

  it("returns empty array for schema with no settings", () => {
    const schema: SetteraSchema = {
      version: "1.0",
      pages: [{ key: "empty", title: "Empty" }],
    };
    expect(flattenSettings(schema)).toEqual([]);
  });
});

describe("getSettingByKey", () => {
  it("finds a top-level setting", () => {
    const setting = getSettingByKey(referenceSchema, "general.autoSave");
    expect(setting).toBeDefined();
    expect(setting?.title).toBe("Auto Save");
  });

  it("finds a setting in a nested page", () => {
    const setting = getSettingByKey(referenceSchema, "privacy.telemetry");
    expect(setting).toBeDefined();
    expect(setting?.title).toBe("Send Telemetry");
  });

  it("returns undefined for unknown key", () => {
    expect(getSettingByKey(referenceSchema, "nonexistent")).toBeUndefined();
  });
});

describe("getPageByKey", () => {
  it("finds a top-level page", () => {
    const page = getPageByKey(referenceSchema, "general");
    expect(page).toBeDefined();
    expect(page?.title).toBe("General");
  });

  it("finds a nested page", () => {
    const page = getPageByKey(referenceSchema, "general.privacy");
    expect(page).toBeDefined();
    expect(page?.title).toBe("Privacy");
  });

  it("returns undefined for unknown key", () => {
    expect(getPageByKey(referenceSchema, "nonexistent")).toBeUndefined();
  });
});

describe("isFlattenedPage", () => {
  it("returns true for one child and no sections", () => {
    expect(
      isFlattenedPage({
        key: "parent",
        title: "Parent",
        pages: [{ key: "child", title: "Child" }],
      }),
    ).toBe(true);
  });

  it("returns true for one child and empty sections array", () => {
    expect(
      isFlattenedPage({
        key: "parent",
        title: "Parent",
        sections: [],
        pages: [{ key: "child", title: "Child" }],
      }),
    ).toBe(true);
  });

  it("returns false when page has sections", () => {
    expect(
      isFlattenedPage({
        key: "parent",
        title: "Parent",
        sections: [{ key: "s", title: "S", settings: [] }],
        pages: [{ key: "child", title: "Child" }],
      }),
    ).toBe(false);
  });

  it("returns false for multiple children", () => {
    expect(
      isFlattenedPage({
        key: "parent",
        title: "Parent",
        pages: [
          { key: "c1", title: "C1" },
          { key: "c2", title: "C2" },
        ],
      }),
    ).toBe(false);
  });

  it("returns false for a leaf page (no children)", () => {
    expect(isFlattenedPage({ key: "leaf", title: "Leaf" })).toBe(false);
  });
});

describe("flattenSettings — path values", () => {
  it("sets correct path for top-level settings", () => {
    const flat = flattenSettings(referenceSchema);
    const autoSave = flat.find((f) => f.definition.key === "general.autoSave");
    expect(autoSave?.path).toBe("pages[0].sections[0].settings[0]");
  });

  it("sets correct path for nested-page settings", () => {
    const flat = flattenSettings(referenceSchema);
    const telemetry = flat.find(
      (f) => f.definition.key === "privacy.telemetry",
    );
    expect(telemetry?.path).toBe(
      "pages[0].pages[0].sections[0].settings[0]",
    );
  });

  it("sets correct path for subsection settings", () => {
    const schema: SetteraSchema = {
      version: "1.0",
      pages: [
        {
          key: "p1",
          title: "P1",
          sections: [
            {
              key: "s1",
              title: "S1",
              subsections: [
                {
                  key: "sub1",
                  title: "Sub 1",
                  settings: [
                    { key: "sub.a", title: "A", type: "boolean" },
                  ],
                },
              ],
            },
          ],
        },
      ],
    };
    const flat = flattenSettings(schema);
    expect(flat[0].path).toBe(
      "pages[0].sections[0].subsections[0].settings[0]",
    );
  });

  it("preserves declaration order across sections and subsections", () => {
    const schema: SetteraSchema = {
      version: "1.0",
      pages: [
        {
          key: "p1",
          title: "P1",
          sections: [
            {
              key: "s1",
              title: "S1",
              settings: [{ key: "first", title: "First", type: "boolean" }],
              subsections: [
                {
                  key: "sub1",
                  title: "Sub",
                  settings: [
                    { key: "second", title: "Second", type: "boolean" },
                  ],
                },
              ],
            },
            {
              key: "s2",
              title: "S2",
              settings: [{ key: "third", title: "Third", type: "boolean" }],
            },
          ],
        },
      ],
    };
    const flat = flattenSettings(schema);
    const keys = flat.map((f) => f.definition.key);
    expect(keys).toEqual(["first", "second", "third"]);
  });
});

describe("getSettingByKey — subsections", () => {
  it("finds a setting inside a subsection", () => {
    const schema: SetteraSchema = {
      version: "1.0",
      pages: [
        {
          key: "p1",
          title: "P1",
          sections: [
            {
              key: "s1",
              title: "S1",
              subsections: [
                {
                  key: "sub1",
                  title: "Sub 1",
                  settings: [
                    {
                      key: "sub.hidden",
                      title: "Hidden",
                      type: "boolean",
                    },
                  ],
                },
              ],
            },
          ],
        },
      ],
    };
    const setting = getSettingByKey(schema, "sub.hidden");
    expect(setting).toBeDefined();
    expect(setting?.title).toBe("Hidden");
  });
});

describe("resolvePageKey", () => {
  it("returns own key for non-flatten page", () => {
    expect(
      resolvePageKey({
        key: "leaf",
        title: "Leaf",
        sections: [{ key: "s", title: "S", settings: [] }],
      }),
    ).toBe("leaf");
  });

  it("returns child key for flattened page", () => {
    expect(
      resolvePageKey({
        key: "parent",
        title: "Parent",
        pages: [{ key: "child", title: "Child" }],
      }),
    ).toBe("child");
  });

  it("resolves recursively through nested flattened pages", () => {
    expect(
      resolvePageKey({
        key: "grandparent",
        title: "GP",
        pages: [
          {
            key: "parent",
            title: "P",
            pages: [{ key: "leaf", title: "Leaf" }],
          },
        ],
      }),
    ).toBe("leaf");
  });

  it("stops at a page with sections even if it has one child", () => {
    expect(
      resolvePageKey({
        key: "parent",
        title: "Parent",
        sections: [{ key: "s", title: "S", settings: [] }],
        pages: [{ key: "child", title: "Child" }],
      }),
    ).toBe("parent");
  });

  it("returns current key when depth limit is exceeded", () => {
    // Build a chain of 12 flattened pages (each with 1 child, no sections)
    type Page = { key: string; title: string; pages?: Page[] };
    let deepest: Page = { key: "leaf-12", title: "L12" };
    for (let i = 11; i >= 0; i--) {
      deepest = { key: `level-${i}`, title: `L${i}`, pages: [deepest] };
    }
    // depth > 10 guard triggers: should NOT resolve to "leaf-12"
    const result = resolvePageKey(deepest);
    expect(result).not.toBe("leaf-12");
    // Should stop at the 11th level (depth=10 is the last valid recurse,
    // depth=11 returns early)
    expect(result).toBe("level-11");
  });
});

describe("walkSchema", () => {
  it("visits all pages, sections, and settings", () => {
    const pages: string[] = [];
    const sections: string[] = [];
    const settings: string[] = [];

    walkSchema(referenceSchema, {
      onPage(page) {
        pages.push(page.key);
      },
      onSection(section) {
        sections.push(section.key);
      },
      onSetting(setting) {
        settings.push(setting.key);
      },
    });

    expect(pages).toContain("general");
    expect(pages).toContain("general.privacy");
    expect(pages).toContain("appearance");
    expect(pages).toContain("advanced");

    expect(sections).toContain("behavior");
    expect(sections).toContain("security");
    expect(sections).toContain("theme");
    expect(sections).toContain("editor");

    expect(settings).toContain("general.autoSave");
    expect(settings).toContain("privacy.telemetry");
    expect(settings).toContain("editor.fontSize");
    expect(settings).toContain("advanced.clearCache");
  });

  it("provides correct context for pages", () => {
    const contexts: Array<{ key: string; ctx: SchemaWalkContext }> = [];

    walkSchema(referenceSchema, {
      onPage(page, ctx) {
        contexts.push({ key: page.key, ctx: { ...ctx } });
      },
    });

    const general = contexts.find((c) => c.key === "general");
    expect(general?.ctx.depth).toBe(0);
    expect(general?.ctx.pageKey).toBe("general");
    expect(general?.ctx.sectionKey).toBe("");

    const privacy = contexts.find((c) => c.key === "general.privacy");
    expect(privacy?.ctx.depth).toBe(1);
    expect(privacy?.ctx.pageKey).toBe("general.privacy");
  });

  it("provides correct context for sections", () => {
    const contexts: Array<{ key: string; ctx: SchemaWalkContext }> = [];

    walkSchema(referenceSchema, {
      onSection(section, ctx) {
        contexts.push({ key: section.key, ctx: { ...ctx } });
      },
    });

    const behavior = contexts.find((c) => c.key === "behavior");
    expect(behavior?.ctx.pageKey).toBe("general");
    expect(behavior?.ctx.sectionKey).toBe("behavior");
    expect(behavior?.ctx.depth).toBe(0);
  });

  it("provides correct context for settings", () => {
    const contexts: Array<{ key: string; ctx: SchemaWalkContext }> = [];

    walkSchema(referenceSchema, {
      onSetting(setting, ctx) {
        contexts.push({ key: setting.key, ctx: { ...ctx } });
      },
    });

    const autoSave = contexts.find((c) => c.key === "general.autoSave");
    expect(autoSave?.ctx.pageKey).toBe("general");
    expect(autoSave?.ctx.sectionKey).toBe("behavior");
    expect(autoSave?.ctx.path).toBe("pages[0].sections[0].settings[0]");

    const telemetry = contexts.find((c) => c.key === "privacy.telemetry");
    expect(telemetry?.ctx.pageKey).toBe("general.privacy");
    expect(telemetry?.ctx.depth).toBe(1);
  });

  it("stops walk when onPage returns false", () => {
    const pages: string[] = [];

    walkSchema(referenceSchema, {
      onPage(page) {
        pages.push(page.key);
        if (page.key === "general") return false;
      },
    });

    expect(pages).toEqual(["general"]);
  });

  it("stops walk when onSection returns false", () => {
    const sections: string[] = [];

    walkSchema(referenceSchema, {
      onSection(section) {
        sections.push(section.key);
        if (section.key === "security") return false;
      },
    });

    expect(sections).toEqual(["behavior", "security"]);
  });

  it("stops walk when onSetting returns false", () => {
    const settings: string[] = [];

    walkSchema(referenceSchema, {
      onSetting(setting) {
        settings.push(setting.key);
        if (setting.key === "general.autoSave") return false;
      },
    });

    expect(settings).toEqual(["general.autoSave"]);
  });

  it("visits settings inside subsections", () => {
    const schema: SetteraSchema = {
      version: "1.0",
      pages: [
        {
          key: "p1",
          title: "P1",
          sections: [
            {
              key: "s1",
              title: "S1",
              settings: [{ key: "direct", title: "Direct", type: "boolean" }],
              subsections: [
                {
                  key: "sub1",
                  title: "Sub 1",
                  settings: [
                    { key: "nested", title: "Nested", type: "boolean" },
                  ],
                },
              ],
            },
          ],
        },
      ],
    };

    const settings: string[] = [];
    walkSchema(schema, {
      onSetting(setting) {
        settings.push(setting.key);
      },
    });

    expect(settings).toEqual(["direct", "nested"]);
  });

  it("handles empty schema gracefully", () => {
    const schema: SetteraSchema = {
      version: "1.0",
      pages: [],
    };

    const visited: string[] = [];
    walkSchema(schema, {
      onPage(page) {
        visited.push(page.key);
      },
    });

    expect(visited).toEqual([]);
  });

  it("provides correct path for subsection settings", () => {
    const schema: SetteraSchema = {
      version: "1.0",
      pages: [
        {
          key: "p1",
          title: "P1",
          sections: [
            {
              key: "s1",
              title: "S1",
              settings: [{ key: "direct", title: "Direct", type: "boolean" }],
              subsections: [
                {
                  key: "sub1",
                  title: "Sub 1",
                  settings: [
                    { key: "nested", title: "Nested", type: "boolean" },
                  ],
                },
              ],
            },
          ],
        },
      ],
    };

    const paths: Array<{ key: string; path: string }> = [];
    walkSchema(schema, {
      onSetting(setting, ctx) {
        paths.push({ key: setting.key, path: ctx.path });
      },
    });

    expect(paths).toEqual([
      { key: "direct", path: "pages[0].sections[0].settings[0]" },
      {
        key: "nested",
        path: "pages[0].sections[0].subsections[0].settings[0]",
      },
    ]);
  });

  it("does nothing with an empty visitor", () => {
    // Should not throw with no callbacks defined
    walkSchema(referenceSchema, {});
  });

  it("calls onSubsection with correct key and context", () => {
    const schema: SetteraSchema = {
      version: "1.0",
      pages: [
        {
          key: "p1",
          title: "P1",
          sections: [
            {
              key: "s1",
              title: "S1",
              subsections: [
                {
                  key: "sub1",
                  title: "Sub 1",
                  settings: [
                    { key: "nested", title: "Nested", type: "boolean" },
                  ],
                },
              ],
            },
          ],
        },
      ],
    };

    const subsections: Array<{ key: string; ctx: SchemaWalkContext }> = [];
    walkSchema(schema, {
      onSubsection(subsection, ctx) {
        subsections.push({ key: subsection.key, ctx: { ...ctx } });
      },
    });

    expect(subsections).toHaveLength(1);
    expect(subsections[0].key).toBe("sub1");
    expect(subsections[0].ctx.pageKey).toBe("p1");
    expect(subsections[0].ctx.sectionKey).toBe("s1");
    expect(subsections[0].ctx.subsectionKey).toBe("sub1");
    expect(subsections[0].ctx.path).toBe(
      "pages[0].sections[0].subsections[0]",
    );
  });

  it("stops walk when onSubsection returns false", () => {
    const schema: SetteraSchema = {
      version: "1.0",
      pages: [
        {
          key: "p1",
          title: "P1",
          sections: [
            {
              key: "s1",
              title: "S1",
              subsections: [
                {
                  key: "sub1",
                  title: "Sub 1",
                  settings: [
                    { key: "a", title: "A", type: "boolean" },
                  ],
                },
                {
                  key: "sub2",
                  title: "Sub 2",
                  settings: [
                    { key: "b", title: "B", type: "boolean" },
                  ],
                },
              ],
            },
          ],
        },
      ],
    };

    const visited: string[] = [];
    walkSchema(schema, {
      onSubsection(subsection) {
        visited.push(subsection.key);
        if (subsection.key === "sub1") return false;
      },
      onSetting(setting) {
        visited.push(setting.key);
      },
    });

    expect(visited).toEqual(["sub1"]);
  });

  it("sets subsectionKey to empty string for non-subsection settings", () => {
    const schema: SetteraSchema = {
      version: "1.0",
      pages: [
        {
          key: "p1",
          title: "P1",
          sections: [
            {
              key: "s1",
              title: "S1",
              settings: [{ key: "direct", title: "Direct", type: "boolean" }],
              subsections: [
                {
                  key: "sub1",
                  title: "Sub 1",
                  settings: [
                    { key: "nested", title: "Nested", type: "boolean" },
                  ],
                },
              ],
            },
          ],
        },
      ],
    };

    const contexts: Array<{ key: string; subsectionKey: string }> = [];
    walkSchema(schema, {
      onSetting(setting, ctx) {
        contexts.push({ key: setting.key, subsectionKey: ctx.subsectionKey });
      },
    });

    expect(contexts).toEqual([
      { key: "direct", subsectionKey: "" },
      { key: "nested", subsectionKey: "sub1" },
    ]);
  });
});

describe("flattenSettings — subsectionKey", () => {
  it("includes subsectionKey in flattened output", () => {
    const schema: SetteraSchema = {
      version: "1.0",
      pages: [
        {
          key: "p1",
          title: "P1",
          sections: [
            {
              key: "s1",
              title: "S1",
              settings: [{ key: "direct", title: "Direct", type: "boolean" }],
              subsections: [
                {
                  key: "sub1",
                  title: "Sub 1",
                  settings: [
                    { key: "nested", title: "Nested", type: "boolean" },
                  ],
                },
              ],
            },
          ],
        },
      ],
    };

    const flat = flattenSettings(schema);
    const direct = flat.find((f) => f.definition.key === "direct");
    const nested = flat.find((f) => f.definition.key === "nested");
    expect(direct?.subsectionKey).toBe("");
    expect(nested?.subsectionKey).toBe("sub1");
  });
});
