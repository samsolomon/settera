import { describe, it, expect } from "vitest";
import {
  flattenSettings,
  getSettingByKey,
  getPageByKey,
  resolveDependencies,
  isFlattenedPage,
  resolvePageKey,
} from "../traversal.js";
import { referenceSchema } from "./fixtures/reference-schema.js";
import type { SettaraSchema } from "../types.js";

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
    const schema: SettaraSchema = {
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
    const schema: SettaraSchema = {
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

describe("resolveDependencies", () => {
  it("returns dependency map from visibleWhen conditions", () => {
    const deps = resolveDependencies(referenceSchema);

    // ssoProvider depends on ssoEnabled
    expect(deps.get("security.ssoProvider")).toEqual(["security.ssoEnabled"]);

    // ssoDomain depends on ssoEnabled AND ssoProvider
    expect(deps.get("security.ssoDomain")).toEqual([
      "security.ssoEnabled",
      "security.ssoProvider",
    ]);
  });

  it("does not include settings without visibleWhen", () => {
    const deps = resolveDependencies(referenceSchema);
    expect(deps.has("general.autoSave")).toBe(false);
  });

  it("returns empty map for schema with no dependencies", () => {
    const schema: SettaraSchema = {
      version: "1.0",
      pages: [
        {
          key: "p1",
          title: "P1",
          sections: [
            {
              key: "s1",
              title: "S1",
              settings: [{ key: "a", title: "A", type: "boolean" }],
            },
          ],
        },
      ],
    };
    const deps = resolveDependencies(schema);
    expect(deps.size).toBe(0);
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
});
