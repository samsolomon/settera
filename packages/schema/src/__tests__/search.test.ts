import { describe, it, expect } from "vitest";
import { searchSchema } from "../search.js";
import type { SetteraSchema } from "../types.js";

const schema: SetteraSchema = {
  version: "1.0",
  pages: [
    {
      key: "general",
      title: "General Settings",
      sections: [
        {
          key: "profile",
          title: "Profile",
          settings: [
            { key: "name", title: "Display Name", type: "text" },
            { key: "email", title: "Email Address", type: "text", description: "Your primary email" },
          ],
        },
        {
          key: "notifications",
          title: "Notification Preferences",
          settings: [
            { key: "push", title: "Push Notifications", type: "boolean" },
            { key: "digest", title: "Email Digest", type: "boolean" },
          ],
          subsections: [
            {
              key: "advanced-notif",
              title: "Advanced Alerts",
              settings: [
                { key: "sound", title: "Sound", type: "boolean" },
              ],
            },
          ],
        },
      ],
    },
    {
      key: "appearance",
      title: "Appearance",
      sections: [
        {
          key: "theme",
          title: "Theme",
          settings: [
            { key: "dark-mode", title: "Dark Mode", type: "boolean" },
            { key: "font-size", title: "Font Size", type: "number" },
          ],
        },
      ],
      pages: [
        {
          key: "colors",
          title: "Custom Colors",
          sections: [
            {
              key: "palette",
              title: "Palette",
              settings: [
                { key: "primary", title: "Primary Color", type: "text" },
              ],
            },
          ],
        },
      ],
    },
  ],
};

describe("searchSchema", () => {
  it("returns empty sets for empty query", () => {
    const result = searchSchema(schema, "");
    expect(result.settingKeys.size).toBe(0);
    expect(result.pageKeys.size).toBe(0);
  });

  it("matches setting by title", () => {
    const result = searchSchema(schema, "Display Name");
    expect(result.settingKeys.has("name")).toBe(true);
    expect(result.pageKeys.has("general")).toBe(true);
  });

  it("matches setting by description", () => {
    const result = searchSchema(schema, "primary email");
    expect(result.settingKeys.has("email")).toBe(true);
  });

  it("is case-insensitive", () => {
    const result = searchSchema(schema, "display name");
    expect(result.settingKeys.has("name")).toBe(true);
  });

  it("matches page title and includes all settings on that page", () => {
    const result = searchSchema(schema, "Appearance");
    expect(result.pageKeys.has("appearance")).toBe(true);
    expect(result.settingKeys.has("dark-mode")).toBe(true);
    expect(result.settingKeys.has("font-size")).toBe(true);
  });

  it("matches section title and includes all settings in that section", () => {
    const result = searchSchema(schema, "Notification Preferences");
    expect(result.settingKeys.has("push")).toBe(true);
    expect(result.settingKeys.has("digest")).toBe(true);
  });

  it("matches subsection title and includes its settings", () => {
    const result = searchSchema(schema, "Advanced Alerts");
    expect(result.settingKeys.has("sound")).toBe(true);
    expect(result.pageKeys.has("general")).toBe(true);
  });

  it("propagates child page match to ancestor pages", () => {
    const result = searchSchema(schema, "Custom Colors");
    expect(result.pageKeys.has("colors")).toBe(true);
    expect(result.pageKeys.has("appearance")).toBe(true);
  });

  it("returns no matches for unrelated query", () => {
    const result = searchSchema(schema, "xyznonexistent");
    expect(result.settingKeys.size).toBe(0);
    expect(result.pageKeys.size).toBe(0);
  });

  it("matches partial strings", () => {
    const result = searchSchema(schema, "font");
    expect(result.settingKeys.has("font-size")).toBe(true);
  });
});

describe("searchSchema — page groups", () => {
  const groupSchema: SetteraSchema = {
    version: "1.0",
    pages: [
      { key: "general", title: "General", sections: [{ key: "main", title: "Main", settings: [{ key: "name", title: "Name", type: "text" }] }] },
      {
        label: "Administration",
        pages: [
          { key: "users", title: "Users", sections: [{ key: "mgmt", title: "Management", settings: [{ key: "role", title: "User Role", type: "text" }] }] },
          { key: "billing", title: "Billing", sections: [{ key: "plan", title: "Plan", settings: [{ key: "plan-type", title: "Plan Type", type: "text" }] }] },
        ],
      },
    ],
  };

  it("matches group label and includes all group pages", () => {
    const result = searchSchema(groupSchema, "Administration");
    expect(result.pageKeys.has("users")).toBe(true);
    expect(result.pageKeys.has("billing")).toBe(true);
    // Settings within those pages should also be included
    expect(result.settingKeys.has("role")).toBe(true);
    expect(result.settingKeys.has("plan-type")).toBe(true);
  });

  it("matches group label case-insensitively", () => {
    const result = searchSchema(groupSchema, "admin");
    expect(result.pageKeys.has("users")).toBe(true);
    expect(result.pageKeys.has("billing")).toBe(true);
  });

  it("still matches individual page titles within groups", () => {
    const result = searchSchema(groupSchema, "Users");
    expect(result.pageKeys.has("users")).toBe(true);
    expect(result.settingKeys.has("role")).toBe(true);
    // Billing should not match
    expect(result.pageKeys.has("billing")).toBe(false);
  });

  it("does not match non-existent group label", () => {
    const result = searchSchema(groupSchema, "xyznonexistent");
    expect(result.settingKeys.size).toBe(0);
    expect(result.pageKeys.size).toBe(0);
  });
});
