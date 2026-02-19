import { describe, it, expect } from "vitest";
import {
  SCHEMA_VERSION,
  validateSchema,
  flattenSettings,
  getSettingByKey,
  getPageByKey,
  searchSchema,
} from "../index.js";
import type {
  SetteraSchema,
  BooleanSetting,
  SettingDefinition,
} from "../index.js";

describe("@settera/schema", () => {
  it("exports SCHEMA_VERSION as 1.0", () => {
    expect(SCHEMA_VERSION).toBe("1.0");
  });

  it("exports validateSchema", () => {
    expect(typeof validateSchema).toBe("function");
  });

  it("exports traversal utilities", () => {
    expect(typeof flattenSettings).toBe("function");
    expect(typeof getSettingByKey).toBe("function");
    expect(typeof getPageByKey).toBe("function");
    expect(typeof searchSchema).toBe("function");
  });

  it("exports types that compile correctly", () => {
    const schema: SetteraSchema = {
      version: "1.0",
      pages: [
        {
          key: "test",
          title: "Test",
          sections: [
            {
              key: "main",
              title: "Main",
              settings: [
                {
                  key: "toggle",
                  title: "Toggle",
                  type: "boolean",
                  default: false,
                },
              ],
            },
          ],
        },
      ],
    };

    const setting: SettingDefinition =
      schema.pages[0].sections![0].settings![0];
    if (setting.type === "boolean") {
      const boolSetting: BooleanSetting = setting;
      expect(boolSetting.type).toBe("boolean");
    }
  });
});
