import { describe, it, expect } from "vitest";
import { validateSchema } from "../validate.js";
import { referenceSchema } from "./fixtures/reference-schema.js";
import type { SetteraSchema } from "../types.js";

function makeMinimalSchema(overrides?: Partial<SetteraSchema>): SetteraSchema {
  return {
    version: "1.0",
    pages: [
      {
        key: "general",
        title: "General",
        sections: [
          {
            key: "main",
            title: "Main",
            settings: [
              {
                key: "test.setting",
                title: "Test Setting",
                type: "boolean",
              },
            ],
          },
        ],
      },
    ],
    ...overrides,
  };
}

describe("validateSchema", () => {
  it("returns no errors for the reference schema", () => {
    const errors = validateSchema(referenceSchema);
    expect(errors).toEqual([]);
  });

  it("returns no errors for a minimal valid schema", () => {
    const errors = validateSchema(makeMinimalSchema());
    expect(errors).toEqual([]);
  });

  // Version checks
  it("rejects invalid version", () => {
    const schema = makeMinimalSchema({
      version: "2.0" as "1.0",
    });
    const errors = validateSchema(schema);
    expect(errors).toHaveLength(1);
    expect(errors[0].code).toBe("INVALID_VERSION");
  });

  // Missing pages
  it("rejects schema with no pages", () => {
    const schema = makeMinimalSchema({ pages: [] });
    const errors = validateSchema(schema);
    expect(errors).toHaveLength(1);
    expect(errors[0].code).toBe("MISSING_PAGES");
  });

  // Missing required fields
  it("rejects page without key", () => {
    const schema: SetteraSchema = {
      version: "1.0",
      pages: [{ key: "", title: "General" }],
    };
    const errors = validateSchema(schema);
    expect(errors.some((e) => e.code === "MISSING_REQUIRED_FIELD")).toBe(true);
  });

  it("rejects page without title", () => {
    const schema: SetteraSchema = {
      version: "1.0",
      pages: [{ key: "general", title: "" }],
    };
    const errors = validateSchema(schema);
    expect(errors.some((e) => e.code === "MISSING_REQUIRED_FIELD")).toBe(true);
  });

  it("rejects section without key", () => {
    const schema: SetteraSchema = {
      version: "1.0",
      pages: [
        {
          key: "general",
          title: "General",
          sections: [{ key: "", title: "Main" }],
        },
      ],
    };
    const errors = validateSchema(schema);
    expect(errors.some((e) => e.code === "MISSING_REQUIRED_FIELD")).toBe(true);
  });

  it("rejects setting without key", () => {
    const schema: SetteraSchema = {
      version: "1.0",
      pages: [
        {
          key: "general",
          title: "General",
          sections: [
            {
              key: "main",
              title: "Main",
              settings: [{ key: "", title: "Test", type: "boolean" }],
            },
          ],
        },
      ],
    };
    const errors = validateSchema(schema);
    expect(errors.some((e) => e.code === "MISSING_REQUIRED_FIELD")).toBe(true);
  });

  it("rejects setting without type", () => {
    const schema: SetteraSchema = {
      version: "1.0",
      pages: [
        {
          key: "general",
          title: "General",
          sections: [
            {
              key: "main",
              title: "Main",
              settings: [{ key: "test", title: "Test", type: "" as "boolean" }],
            },
          ],
        },
      ],
    };
    const errors = validateSchema(schema);
    expect(errors.some((e) => e.code === "MISSING_REQUIRED_FIELD")).toBe(true);
  });

  // Duplicate keys
  it("rejects duplicate setting keys across pages", () => {
    const schema: SetteraSchema = {
      version: "1.0",
      pages: [
        {
          key: "page1",
          title: "Page 1",
          sections: [
            {
              key: "s1",
              title: "S1",
              settings: [{ key: "dup.key", title: "First", type: "boolean" }],
            },
          ],
        },
        {
          key: "page2",
          title: "Page 2",
          sections: [
            {
              key: "s2",
              title: "S2",
              settings: [{ key: "dup.key", title: "Second", type: "boolean" }],
            },
          ],
        },
      ],
    };
    const errors = validateSchema(schema);
    expect(errors.some((e) => e.code === "DUPLICATE_KEY")).toBe(true);
  });

  it("rejects duplicate page keys", () => {
    const schema: SetteraSchema = {
      version: "1.0",
      pages: [
        { key: "general", title: "General" },
        { key: "general", title: "General 2" },
      ],
    };
    const errors = validateSchema(schema);
    expect(errors.some((e) => e.code === "DUPLICATE_KEY")).toBe(true);
  });

  it("rejects duplicate section keys within a page", () => {
    const schema: SetteraSchema = {
      version: "1.0",
      pages: [
        {
          key: "general",
          title: "General",
          sections: [
            { key: "main", title: "Main" },
            { key: "main", title: "Main 2" },
          ],
        },
      ],
    };
    const errors = validateSchema(schema);
    expect(errors.some((e) => e.code === "DUPLICATE_KEY")).toBe(true);
  });

  // Visibility references
  it("rejects visibleWhen referencing unknown setting", () => {
    const schema: SetteraSchema = {
      version: "1.0",
      pages: [
        {
          key: "general",
          title: "General",
          sections: [
            {
              key: "main",
              title: "Main",
              settings: [
                {
                  key: "test.setting",
                  title: "Test",
                  type: "boolean",
                  visibleWhen: {
                    setting: "nonexistent.setting",
                    equals: true,
                  },
                },
              ],
            },
          ],
        },
      ],
    };
    const errors = validateSchema(schema);
    expect(errors.some((e) => e.code === "INVALID_VISIBILITY_REF")).toBe(true);
  });

  it("validates array visibleWhen references", () => {
    const schema: SetteraSchema = {
      version: "1.0",
      pages: [
        {
          key: "general",
          title: "General",
          sections: [
            {
              key: "main",
              title: "Main",
              settings: [
                { key: "a", title: "A", type: "boolean" },
                {
                  key: "b",
                  title: "B",
                  type: "boolean",
                  visibleWhen: [
                    { setting: "a", equals: true },
                    { setting: "missing", equals: true },
                  ],
                },
              ],
            },
          ],
        },
      ],
    };
    const errors = validateSchema(schema);
    expect(errors.some((e) => e.code === "INVALID_VISIBILITY_REF")).toBe(true);
  });

  it("accepts valid visibleWhen references", () => {
    const schema: SetteraSchema = {
      version: "1.0",
      pages: [
        {
          key: "general",
          title: "General",
          sections: [
            {
              key: "main",
              title: "Main",
              settings: [
                { key: "toggle", title: "Toggle", type: "boolean" },
                {
                  key: "dependent",
                  title: "Dependent",
                  type: "text",
                  visibleWhen: { setting: "toggle", equals: true },
                },
              ],
            },
          ],
        },
      ],
    };
    const errors = validateSchema(schema);
    expect(errors).toEqual([]);
  });

  // Compound field dot keys
  it("rejects compound field keys containing dots", () => {
    const schema: SetteraSchema = {
      version: "1.0",
      pages: [
        {
          key: "general",
          title: "General",
          sections: [
            {
              key: "main",
              title: "Main",
              settings: [
                {
                  key: "smtp",
                  title: "SMTP",
                  type: "compound",
                  displayStyle: "modal",
                  fields: [
                    {
                      key: "host.name",
                      title: "Host",
                      type: "text",
                    },
                  ],
                },
              ],
            },
          ],
        },
      ],
    };
    const errors = validateSchema(schema);
    expect(errors.some((e) => e.code === "COMPOUND_FIELD_DOT_KEY")).toBe(true);
  });

  // Empty options
  it("rejects select with no options", () => {
    const schema: SetteraSchema = {
      version: "1.0",
      pages: [
        {
          key: "general",
          title: "General",
          sections: [
            {
              key: "main",
              title: "Main",
              settings: [
                {
                  key: "test.select",
                  title: "Select",
                  type: "select",
                  options: [],
                },
              ],
            },
          ],
        },
      ],
    };
    const errors = validateSchema(schema);
    expect(errors.some((e) => e.code === "EMPTY_OPTIONS")).toBe(true);
  });

  it("rejects multiselect with no options", () => {
    const schema: SetteraSchema = {
      version: "1.0",
      pages: [
        {
          key: "general",
          title: "General",
          sections: [
            {
              key: "main",
              title: "Main",
              settings: [
                {
                  key: "test.multi",
                  title: "Multi",
                  type: "multiselect",
                  options: [],
                },
              ],
            },
          ],
        },
      ],
    };
    const errors = validateSchema(schema);
    expect(errors.some((e) => e.code === "EMPTY_OPTIONS")).toBe(true);
  });

  // Action-specific
  it("rejects action without buttonLabel", () => {
    const schema: SetteraSchema = {
      version: "1.0",
      pages: [
        {
          key: "general",
          title: "General",
          sections: [
            {
              key: "main",
              title: "Main",
              settings: [
                {
                  key: "test.action",
                  title: "Action",
                  type: "action",
                  buttonLabel: "",
                  actionType: "callback",
                  // eslint-disable-next-line @typescript-eslint/no-explicit-any
                } as any,
              ],
            },
          ],
        },
      ],
    };
    const errors = validateSchema(schema);
    expect(errors.some((e) => e.code === "MISSING_REQUIRED_FIELD")).toBe(true);
  });

  // Subsection validation
  it("validates settings inside subsections", () => {
    const schema: SetteraSchema = {
      version: "1.0",
      pages: [
        {
          key: "general",
          title: "General",
          sections: [
            {
              key: "main",
              title: "Main",
              subsections: [
                {
                  key: "sub1",
                  title: "Sub 1",
                  settings: [
                    {
                      key: "sub.setting",
                      title: "Sub Setting",
                      type: "boolean",
                      visibleWhen: {
                        setting: "nonexistent",
                        equals: true,
                      },
                    },
                  ],
                },
              ],
            },
          ],
        },
      ],
    };
    const errors = validateSchema(schema);
    expect(errors.some((e) => e.code === "INVALID_VISIBILITY_REF")).toBe(true);
  });
});
