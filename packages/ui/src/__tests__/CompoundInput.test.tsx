import React from "react";
import { describe, it, expect } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { Settera } from "@settera/react";
import { CompoundInput } from "../components/CompoundInput.js";
import type { SetteraSchema } from "@settera/schema";

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
              key: "profileInline",
              title: "Profile Inline",
              type: "compound",
              displayStyle: "inline",
              fields: [
                { key: "name", title: "Name", type: "text" },
                { key: "quota", title: "Quota", type: "number" },
                { key: "start", title: "Start", type: "date" },
                {
                  key: "role",
                  title: "Role",
                  type: "select",
                  options: [
                    { value: "member", label: "Member" },
                    { value: "admin", label: "Admin" },
                  ],
                },
              ],
            },
            {
              key: "profileModal",
              title: "Profile Modal",
              type: "compound",
              displayStyle: "modal",
              fields: [{ key: "nickname", title: "Nickname", type: "text" }],
            },
            {
              key: "profilePage",
              title: "Profile Page",
              type: "compound",
              displayStyle: "page",
              fields: [{ key: "handle", title: "Handle", type: "text" }],
            },
          ],
        },
      ],
    },
  ],
};

function renderCompound(
  settingKey: string,
  values: Record<string, unknown> = {},
) {
  return render(
    <Settera schema={schema} values={values} onChange={() => {}}>
      <CompoundInput settingKey={settingKey} />
    </Settera>,
  );
}

describe("CompoundInput", () => {
  it("shows focus ring for inline text field on focus", async () => {
    const user = userEvent.setup();
    renderCompound("profileInline", {
      profileInline: {
        name: "Sam",
        quota: 1,
        start: "2026-01-01",
        role: "member",
      },
    });

    const input = screen.getByLabelText("Name") as HTMLInputElement;
    await user.click(input);
    expect(input.style.boxShadow).toContain("0 0 0 2px");

    fireEvent.blur(input);
    expect(input.style.boxShadow).toBe("none");
  });

  it("shows focus ring for inline number field on focus", async () => {
    const user = userEvent.setup();
    renderCompound("profileInline", { profileInline: { quota: 5 } });

    const input = screen.getByLabelText("Quota") as HTMLInputElement;
    await user.click(input);
    expect(input.style.boxShadow).toContain("0 0 0 2px");
  });

  it("shows focus ring for inline date field on focus", async () => {
    const user = userEvent.setup();
    renderCompound("profileInline", { profileInline: { start: "2026-01-01" } });

    const input = screen.getByLabelText("Start") as HTMLInputElement;
    await user.click(input);
    expect(input.style.boxShadow).toContain("0 0 0 2px");
  });

  it("shows focus ring for inline select field on focus", async () => {
    const user = userEvent.setup();
    renderCompound("profileInline", { profileInline: { role: "member" } });

    const select = screen.getByLabelText("Role") as HTMLSelectElement;
    await user.click(select);
    expect(select.style.boxShadow).toContain("0 0 0 2px");
  });

  it("renders modal fields after opening and applies focus styles", async () => {
    const user = userEvent.setup();
    renderCompound("profileModal", { profileModal: { nickname: "Sam" } });

    expect(screen.queryByLabelText("Nickname")).toBeNull();
    await user.click(
      screen.getByRole("button", { name: "Edit Profile Modal" }),
    );

    const input = screen.getByLabelText("Nickname") as HTMLInputElement;
    await user.click(input);
    expect(input.style.boxShadow).toContain("0 0 0 2px");
  });

  it("renders page panel fields after opening and applies focus styles", async () => {
    const user = userEvent.setup();
    renderCompound("profilePage", { profilePage: { handle: "sam" } });

    expect(screen.queryByLabelText("Handle")).toBeNull();
    await user.click(screen.getByRole("button", { name: "Open Profile Page" }));

    const input = screen.getByLabelText("Handle") as HTMLInputElement;
    await user.click(input);
    expect(input.style.boxShadow).toContain("0 0 0 2px");
  });
});
