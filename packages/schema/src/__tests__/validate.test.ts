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

  it("rejects custom page without renderer", () => {
    const schema: SetteraSchema = {
      version: "1.0",
      pages: [
        {
          key: "users",
          title: "Users",
          mode: "custom",
        },
      ],
    };
    const errors = validateSchema(schema);
    expect(errors.some((e) => e.path.endsWith(".renderer"))).toBe(true);
  });

  it("accepts custom page with renderer and no sections", () => {
    const schema: SetteraSchema = {
      version: "1.0",
      pages: [
        {
          key: "users",
          title: "Users",
          mode: "custom",
          renderer: "usersPage",
        },
      ],
    };
    const errors = validateSchema(schema);
    expect(errors).toEqual([]);
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

  it("rejects modal action without modal config", () => {
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
                  key: "test.modalAction",
                  title: "Modal Action",
                  type: "action",
                  buttonLabel: "Open",
                  actionType: "modal",
                },
              ],
            },
          ],
        },
      ],
    };
    const errors = validateSchema(schema);
    expect(errors.some((e) => e.path.endsWith(".modal"))).toBe(true);
  });

  it("rejects modal action with empty fields", () => {
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
                  key: "test.modalAction",
                  title: "Modal Action",
                  type: "action",
                  buttonLabel: "Open",
                  actionType: "modal",
                  modal: {
                    fields: [],
                  },
                },
              ],
            },
          ],
        },
      ],
    };
    const errors = validateSchema(schema);
    expect(errors.some((e) => e.path.endsWith(".modal.fields"))).toBe(true);
  });

  // Duplicate option values
  it("rejects select with duplicate option values", () => {
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
                  options: [
                    { value: "a", label: "A" },
                    { value: "a", label: "A duplicate" },
                    { value: "b", label: "B" },
                  ],
                },
              ],
            },
          ],
        },
      ],
    };
    const errors = validateSchema(schema);
    expect(errors.some((e) => e.code === "DUPLICATE_OPTION_VALUE")).toBe(true);
  });

  it("rejects multiselect with duplicate option values", () => {
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
                  options: [
                    { value: "x", label: "X" },
                    { value: "y", label: "Y" },
                    { value: "x", label: "X again" },
                  ],
                },
              ],
            },
          ],
        },
      ],
    };
    const errors = validateSchema(schema);
    expect(errors.some((e) => e.code === "DUPLICATE_OPTION_VALUE")).toBe(true);
  });

  // Invalid defaults
  it("rejects select default not in options", () => {
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
                  options: [
                    { value: "a", label: "A" },
                    { value: "b", label: "B" },
                  ],
                  default: "c",
                },
              ],
            },
          ],
        },
      ],
    };
    const errors = validateSchema(schema);
    expect(errors.some((e) => e.code === "INVALID_DEFAULT")).toBe(true);
  });

  it("accepts select default that is in options", () => {
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
                  options: [
                    { value: "a", label: "A" },
                    { value: "b", label: "B" },
                  ],
                  default: "a",
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

  it("rejects multiselect default with value not in options", () => {
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
                  options: [
                    { value: "a", label: "A" },
                    { value: "b", label: "B" },
                  ],
                  default: ["a", "z"],
                },
              ],
            },
          ],
        },
      ],
    };
    const errors = validateSchema(schema);
    expect(errors.some((e) => e.code === "INVALID_DEFAULT")).toBe(true);
  });

  it("rejects number default below min", () => {
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
                  key: "test.num",
                  title: "Number",
                  type: "number",
                  default: 5,
                  validation: { min: 10 },
                },
              ],
            },
          ],
        },
      ],
    };
    const errors = validateSchema(schema);
    expect(errors.some((e) => e.code === "INVALID_DEFAULT")).toBe(true);
  });

  it("rejects number default above max", () => {
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
                  key: "test.num",
                  title: "Number",
                  type: "number",
                  default: 100,
                  validation: { max: 50 },
                },
              ],
            },
          ],
        },
      ],
    };
    const errors = validateSchema(schema);
    expect(errors.some((e) => e.code === "INVALID_DEFAULT")).toBe(true);
  });

  it("accepts number default within range", () => {
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
                  key: "test.num",
                  title: "Number",
                  type: "number",
                  default: 14,
                  validation: { min: 8, max: 72 },
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

  it("rejects date default before minDate", () => {
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
                  key: "test.date",
                  title: "Date",
                  type: "date",
                  default: "2020-01-01",
                  validation: { minDate: "2024-01-01" },
                },
              ],
            },
          ],
        },
      ],
    };
    const errors = validateSchema(schema);
    expect(errors.some((e) => e.code === "INVALID_DEFAULT")).toBe(true);
  });

  it("rejects date default after maxDate", () => {
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
                  key: "test.date",
                  title: "Date",
                  type: "date",
                  default: "2030-01-01",
                  validation: { maxDate: "2025-12-31" },
                },
              ],
            },
          ],
        },
      ],
    };
    const errors = validateSchema(schema);
    expect(errors.some((e) => e.code === "INVALID_DEFAULT")).toBe(true);
  });

  // Compound field key uniqueness
  it("rejects compound with duplicate field keys", () => {
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
                  displayStyle: "inline",
                  fields: [
                    { key: "host", title: "Host", type: "text" },
                    { key: "port", title: "Port", type: "number" },
                    { key: "host", title: "Host 2", type: "text" },
                  ],
                },
              ],
            },
          ],
        },
      ],
    };
    const errors = validateSchema(schema);
    expect(errors.some((e) => e.code === "DUPLICATE_KEY")).toBe(true);
    expect(errors.some((e) => e.message.includes("Duplicate field key"))).toBe(
      true,
    );
  });

  // Compound validation rules
  it("rejects compound rule with unknown 'when' field reference", () => {
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
                  displayStyle: "inline",
                  fields: [
                    { key: "host", title: "Host", type: "text" },
                    { key: "port", title: "Port", type: "number" },
                  ],
                  validation: {
                    rules: [
                      {
                        when: "nonexistent",
                        require: "port",
                        message: "Port is required",
                      },
                    ],
                  },
                },
              ],
            },
          ],
        },
      ],
    };
    const errors = validateSchema(schema);
    expect(errors).toHaveLength(1);
    expect(errors[0].code).toBe("INVALID_COMPOUND_RULE");
    expect(errors[0].path).toContain("rules[0].when");
  });

  it("rejects compound rule with unknown 'require' field reference", () => {
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
                  displayStyle: "inline",
                  fields: [
                    { key: "host", title: "Host", type: "text" },
                    { key: "port", title: "Port", type: "number" },
                  ],
                  validation: {
                    rules: [
                      {
                        when: "host",
                        require: "missing",
                        message: "Missing is required",
                      },
                    ],
                  },
                },
              ],
            },
          ],
        },
      ],
    };
    const errors = validateSchema(schema);
    expect(errors).toHaveLength(1);
    expect(errors[0].code).toBe("INVALID_COMPOUND_RULE");
    expect(errors[0].path).toContain("rules[0].require");
  });

  it("accepts compound rules referencing valid field keys", () => {
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
                  displayStyle: "inline",
                  fields: [
                    { key: "host", title: "Host", type: "text" },
                    { key: "port", title: "Port", type: "number" },
                  ],
                  validation: {
                    rules: [
                      {
                        when: "host",
                        require: "port",
                        message: "Port required when host is set",
                      },
                    ],
                  },
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

  // Repeatable itemType/itemFields coherence
  it("rejects repeatable with itemType compound but no itemFields", () => {
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
                  key: "items",
                  title: "Items",
                  type: "repeatable",
                  itemType: "compound",
                },
              ],
            },
          ],
        },
      ],
    };
    const errors = validateSchema(schema);
    expect(errors.some((e) => e.code === "INVALID_REPEATABLE_CONFIG")).toBe(
      true,
    );
  });

  it("rejects repeatable with itemType compound and empty itemFields", () => {
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
                  key: "items",
                  title: "Items",
                  type: "repeatable",
                  itemType: "compound",
                  itemFields: [],
                },
              ],
            },
          ],
        },
      ],
    };
    const errors = validateSchema(schema);
    expect(errors.some((e) => e.code === "INVALID_REPEATABLE_CONFIG")).toBe(
      true,
    );
  });

  it("rejects repeatable with itemType text and itemFields present", () => {
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
                  key: "tags",
                  title: "Tags",
                  type: "repeatable",
                  itemType: "text",
                  itemFields: [
                    { key: "label", title: "Label", type: "text" },
                  ],
                  // eslint-disable-next-line @typescript-eslint/no-explicit-any
                } as any,
              ],
            },
          ],
        },
      ],
    };
    const errors = validateSchema(schema);
    expect(errors).toHaveLength(1);
    expect(errors[0].code).toBe("INVALID_REPEATABLE_CONFIG");
    expect(errors[0].message).toContain("must not define itemFields");
  });

  it("accepts repeatable with itemType text and no itemFields", () => {
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
                  key: "tags",
                  title: "Tags",
                  type: "repeatable",
                  itemType: "text",
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

  // Invalid type
  it("rejects setting with unrecognized type", () => {
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
                  key: "test.checkbox",
                  title: "Checkbox",
                  type: "checkbox" as "boolean",
                },
              ],
            },
          ],
        },
      ],
    };
    const errors = validateSchema(schema);
    expect(errors).toHaveLength(1);
    expect(errors[0].code).toBe("INVALID_TYPE");
    expect(errors[0].message).toContain("checkbox");
  });

  // Action without actionType
  it("rejects action without actionType", () => {
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
                  buttonLabel: "Do it",
                  actionType: "" as "callback",
                  // eslint-disable-next-line @typescript-eslint/no-explicit-any
                } as any,
              ],
            },
          ],
        },
      ],
    };
    const errors = validateSchema(schema);
    expect(errors.some((e) => e.path.endsWith(".actionType"))).toBe(true);
    expect(errors.some((e) => e.code === "MISSING_REQUIRED_FIELD")).toBe(true);
  });

  // Custom setting without renderer
  it("rejects custom setting without renderer", () => {
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
                  key: "test.custom",
                  title: "Custom",
                  type: "custom",
                  renderer: "",
                  // eslint-disable-next-line @typescript-eslint/no-explicit-any
                } as any,
              ],
            },
          ],
        },
      ],
    };
    const errors = validateSchema(schema);
    expect(errors.some((e) => e.path.endsWith(".renderer"))).toBe(true);
    expect(errors.some((e) => e.code === "MISSING_REQUIRED_FIELD")).toBe(true);
  });

  // Missing title fields
  it("rejects section without title", () => {
    const schema: SetteraSchema = {
      version: "1.0",
      pages: [
        {
          key: "general",
          title: "General",
          sections: [{ key: "main", title: "" }],
        },
      ],
    };
    const errors = validateSchema(schema);
    expect(
      errors.some(
        (e) =>
          e.code === "MISSING_REQUIRED_FIELD" &&
          e.path.endsWith(".title") &&
          e.message.includes("Section"),
      ),
    ).toBe(true);
  });

  it("rejects subsection without title", () => {
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
                  title: "",
                  settings: [
                    { key: "s1", title: "S1", type: "boolean" },
                  ],
                  // eslint-disable-next-line @typescript-eslint/no-explicit-any
                } as any,
              ],
            },
          ],
        },
      ],
    };
    const errors = validateSchema(schema);
    expect(
      errors.some(
        (e) =>
          e.code === "MISSING_REQUIRED_FIELD" &&
          e.message.includes("Subsection"),
      ),
    ).toBe(true);
  });

  it("rejects setting without title", () => {
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
                { key: "test.notitle", title: "", type: "boolean" } as any,
              ],
            },
          ],
        },
      ],
    };
    const errors = validateSchema(schema);
    expect(
      errors.some(
        (e) =>
          e.code === "MISSING_REQUIRED_FIELD" &&
          e.path.endsWith(".title") &&
          e.message.includes("Setting"),
      ),
    ).toBe(true);
  });

  // Duplicate subsection keys
  it("rejects duplicate subsection keys within a section", () => {
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
                  key: "sub",
                  title: "Sub A",
                  settings: [
                    { key: "a", title: "A", type: "boolean" },
                  ],
                },
                {
                  key: "sub",
                  title: "Sub B",
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
    const errors = validateSchema(schema);
    expect(
      errors.some(
        (e) =>
          e.code === "DUPLICATE_KEY" &&
          e.message.includes("subsection"),
      ),
    ).toBe(true);
  });

  // Modal field validation errors propagate
  it("detects errors inside modal action fields", () => {
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
                  key: "test.modalAction",
                  title: "Modal Action",
                  type: "action",
                  buttonLabel: "Open",
                  actionType: "modal",
                  modal: {
                    fields: [
                      {
                        key: "email",
                        title: "Email",
                        type: "text",
                      },
                      {
                        key: "role",
                        title: "Role",
                        type: "select",
                        options: [],
                      },
                    ],
                  },
                },
              ],
            },
          ],
        },
      ],
    };
    const errors = validateSchema(schema);
    expect(errors.some((e) => e.code === "EMPTY_OPTIONS")).toBe(true);
    expect(errors[0].path).toContain("modal.fields");
  });

  it("rejects duplicate keys among modal action fields", () => {
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
                  key: "test.modalAction",
                  title: "Modal Action",
                  type: "action",
                  buttonLabel: "Open",
                  actionType: "modal",
                  modal: {
                    fields: [
                      { key: "name", title: "Name", type: "text" },
                      { key: "name", title: "Name 2", type: "text" },
                    ],
                  },
                },
              ],
            },
          ],
        },
      ],
    };
    const errors = validateSchema(schema);
    expect(
      errors.some(
        (e) =>
          e.code === "DUPLICATE_KEY" &&
          e.path.includes("modal.fields"),
      ),
    ).toBe(true);
  });

  // Nested page key collision across depth levels
  it("rejects nested page with same key as top-level page", () => {
    const schema: SetteraSchema = {
      version: "1.0",
      pages: [
        {
          key: "general",
          title: "General",
          pages: [
            {
              key: "general",
              title: "General Child",
              sections: [
                {
                  key: "s1",
                  title: "S1",
                  settings: [
                    { key: "a", title: "A", type: "boolean" },
                  ],
                },
              ],
            },
          ],
        },
      ],
    };
    const errors = validateSchema(schema);
    expect(
      errors.some(
        (e) => e.code === "DUPLICATE_KEY" && e.message.includes("page"),
      ),
    ).toBe(true);
  });

  // Compound without displayStyle
  it("rejects compound setting without displayStyle", () => {
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
                  displayStyle: "" as "inline",
                  fields: [
                    { key: "host", title: "Host", type: "text" },
                  ],
                  // eslint-disable-next-line @typescript-eslint/no-explicit-any
                } as any,
              ],
            },
          ],
        },
      ],
    };
    const errors = validateSchema(schema);
    expect(
      errors.some(
        (e) =>
          e.code === "MISSING_REQUIRED_FIELD" &&
          e.path.endsWith(".displayStyle"),
      ),
    ).toBe(true);
  });

  // Modal field visibleWhen refs validated against global keys
  it("rejects modal field visibleWhen referencing unknown setting", () => {
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
                  key: "test.modalAction",
                  title: "Modal Action",
                  type: "action",
                  buttonLabel: "Open",
                  actionType: "modal",
                  modal: {
                    fields: [
                      {
                        key: "name",
                        title: "Name",
                        type: "text",
                        visibleWhen: {
                          setting: "nonexistent.setting",
                          equals: true,
                        },
                      },
                    ],
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

  it("accepts modal field visibleWhen referencing valid global setting", () => {
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
                  key: "toggle",
                  title: "Toggle",
                  type: "boolean",
                },
                {
                  key: "test.modalAction",
                  title: "Modal Action",
                  type: "action",
                  buttonLabel: "Open",
                  actionType: "modal",
                  modal: {
                    fields: [
                      {
                        key: "name",
                        title: "Name",
                        type: "text",
                        visibleWhen: {
                          setting: "toggle",
                          equals: true,
                        },
                      },
                    ],
                  },
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

  // Text pattern regex validation
  it("rejects text setting with invalid regex pattern", () => {
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
                  key: "test.email",
                  title: "Email",
                  type: "text",
                  validation: {
                    pattern: "[invalid(regex",
                  },
                },
              ],
            },
          ],
        },
      ],
    };
    const errors = validateSchema(schema);
    expect(errors).toHaveLength(1);
    expect(errors[0].code).toBe("INVALID_PATTERN");
    expect(errors[0].path).toContain("validation.pattern");
  });

  it("accepts text setting with valid regex pattern", () => {
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
                  key: "test.email",
                  title: "Email",
                  type: "text",
                  validation: {
                    pattern: "^[^@]+@[^@]+\\.[^@]+$",
                  },
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

  // Color setting
  it("accepts valid color setting", () => {
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
                  key: "brand.color",
                  title: "Brand Color",
                  type: "color",
                  default: "#ff0000",
                  format: "hex",
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

  it("accepts color setting without format", () => {
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
                  key: "brand.color",
                  title: "Brand Color",
                  type: "color",
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

  // Section-level visibility
  it("validates section visibleWhen referencing unknown setting", () => {
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
              visibleWhen: { setting: "nonexistent", equals: true },
              settings: [
                { key: "a", title: "A", type: "boolean" },
              ],
            },
          ],
        },
      ],
    };
    const errors = validateSchema(schema);
    expect(errors.some((e) => e.code === "INVALID_VISIBILITY_REF")).toBe(true);
  });

  it("accepts section visibleWhen referencing valid setting", () => {
    const schema: SetteraSchema = {
      version: "1.0",
      pages: [
        {
          key: "general",
          title: "General",
          sections: [
            {
              key: "flags",
              title: "Flags",
              settings: [
                { key: "advanced", title: "Advanced", type: "boolean" },
              ],
            },
            {
              key: "advanced-section",
              title: "Advanced Section",
              visibleWhen: { setting: "advanced", equals: true },
              settings: [
                { key: "debug", title: "Debug", type: "boolean" },
              ],
            },
          ],
        },
      ],
    };
    const errors = validateSchema(schema);
    expect(errors).toEqual([]);
  });

  // Subsection-level visibility
  it("validates subsection visibleWhen referencing unknown setting", () => {
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
              ],
              subsections: [
                {
                  key: "sub1",
                  title: "Sub 1",
                  visibleWhen: { setting: "nonexistent", equals: true },
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
    const errors = validateSchema(schema);
    expect(errors.some((e) => e.code === "INVALID_VISIBILITY_REF")).toBe(true);
  });

  // OR group visibility
  it("validates OR group visibleWhen referencing unknown setting", () => {
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
                { key: "plan", title: "Plan", type: "select", options: [{ value: "free", label: "Free" }] },
                {
                  key: "premium.feature",
                  title: "Premium Feature",
                  type: "boolean",
                  visibleWhen: {
                    or: [
                      { setting: "plan", equals: "pro" },
                      { setting: "nonexistent", equals: "enterprise" },
                    ],
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

  it("accepts valid OR group visibleWhen", () => {
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
                { key: "plan", title: "Plan", type: "select", options: [{ value: "free", label: "Free" }, { value: "pro", label: "Pro" }] },
                {
                  key: "premium.feature",
                  title: "Premium Feature",
                  type: "boolean",
                  visibleWhen: {
                    or: [
                      { setting: "plan", equals: "pro" },
                      { setting: "plan", equals: "enterprise" },
                    ],
                  },
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
