import React from "react";
import { describe, it, expect, vi } from "vitest";
import { render, screen, act, fireEvent } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { SetteraProvider, SetteraRenderer } from "@settera/react";
import { ActionButton } from "../components/ActionButton.js";
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
              key: "reset",
              title: "Reset Data",
              type: "action",
              buttonLabel: "Reset All Data",
              actionType: "callback",
            },
            {
              key: "danger",
              title: "Delete Account",
              type: "action",
              buttonLabel: "Delete",
              actionType: "callback",
              dangerous: true,
            },
            {
              key: "invite",
              title: "Invite User",
              type: "action",
              buttonLabel: "Invite",
              actionType: "modal",
              modal: {
                title: "Invite teammate",
                fields: [
                  {
                    key: "email",
                    title: "Email",
                    type: "text",
                    inputType: "email",
                  },
                  {
                    key: "role",
                    title: "Role",
                    type: "select",
                    options: [
                      { value: "member", label: "Member" },
                      { value: "admin", label: "Admin" },
                    ],
                    default: "member",
                  },
                  {
                    key: "quota",
                    title: "Quota",
                    type: "number",
                    default: 1,
                  },
                ],
                submitLabel: "Send invite",
              },
            },
            {
              key: "disabled-action",
              title: "Disabled Action",
              type: "action",
              buttonLabel: "Disabled",
              actionType: "callback",
              disabled: true,
            },
            {
              key: "inviteAdvanced",
              title: "Invite Advanced",
              type: "action",
              buttonLabel: "Invite Advanced",
              actionType: "modal",
              modal: {
                title: "Invite advanced",
                fields: [
                  {
                    key: "profile",
                    title: "Profile",
                    type: "compound",
                    displayStyle: "inline",
                    fields: [
                      {
                        key: "name",
                        title: "Name",
                        type: "text",
                      },
                      {
                        key: "active",
                        title: "Active",
                        type: "boolean",
                        default: true,
                      },
                    ],
                  },
                  {
                    key: "tags",
                    title: "Tags",
                    type: "repeatable",
                    itemType: "text",
                    default: ["alpha"],
                  },
                ],
                submitLabel: "Submit advanced",
              },
            },
          ],
        },
      ],
    },
  ],
};

function renderActionButton(
  settingKey: string,
  onAction?: Record<string, (payload?: unknown) => void | Promise<void>>,
) {
  return render(
    <SetteraProvider schema={schema}>
      <SetteraRenderer values={{}} onChange={() => {}} onAction={onAction}>
        <ActionButton settingKey={settingKey} />
      </SetteraRenderer>
    </SetteraProvider>,
  );
}

describe("ActionButton", () => {
  it("renders a button element", () => {
    renderActionButton("reset", { reset: () => {} });
    expect(screen.getByRole("button")).toBeDefined();
  });

  it("displays buttonLabel text", () => {
    renderActionButton("reset", { reset: () => {} });
    expect(screen.getByText("Reset All Data")).toBeDefined();
  });

  it("calls handler on click", async () => {
    const user = userEvent.setup();
    const handler = vi.fn();
    renderActionButton("reset", { reset: handler });
    await user.click(screen.getByRole("button"));
    expect(handler).toHaveBeenCalledOnce();
  });

  it("tracks loading state for async handler", async () => {
    let resolve: () => void;
    const handler = vi.fn(
      () =>
        new Promise<void>((r) => {
          resolve = r;
        }),
    );
    renderActionButton("reset", { reset: handler });

    const button = screen.getByRole("button");
    expect(button.getAttribute("aria-busy")).toBe("false");

    await act(async () => {
      button.click();
    });

    expect(button.getAttribute("aria-busy")).toBe("true");
    expect(screen.getByText("Loading…")).toBeDefined();

    await act(async () => {
      resolve!();
    });

    expect(button.getAttribute("aria-busy")).toBe("false");
    expect(screen.getByText("Reset All Data")).toBeDefined();
  });

  it("is not disabled when no handler provided (no-ops on click)", () => {
    renderActionButton("reset");
    const button = screen.getByRole("button") as HTMLButtonElement;
    expect(button.disabled).toBe(false);
  });

  it("is disabled while loading", async () => {
    let resolve: () => void;
    const handler = vi.fn(
      () =>
        new Promise<void>((r) => {
          resolve = r;
        }),
    );
    renderActionButton("reset", { reset: handler });

    await act(async () => {
      screen.getByRole("button").click();
    });

    const button = screen.getByRole("button") as HTMLButtonElement;
    expect(button.disabled).toBe(true);

    await act(async () => {
      resolve!();
    });
  });

  it("has aria-label from definition title", () => {
    renderActionButton("reset", { reset: () => {} });
    expect(screen.getByLabelText("Reset Data")).toBeDefined();
  });

  it("has aria-busy='false' when idle", () => {
    renderActionButton("reset", { reset: () => {} });
    expect(screen.getByRole("button").getAttribute("aria-busy")).toBe("false");
  });

  it("shows focus ring on keyboard focus", async () => {
    const user = userEvent.setup();
    renderActionButton("reset", { reset: () => {} });
    await user.tab();
    const button = screen.getByRole("button");
    expect(button.style.boxShadow).toContain("0 0 0 2px");
  });

  it("applies dangerous styling", () => {
    renderActionButton("danger", { danger: () => {} });
    const button = screen.getByRole("button");
    expect(button.style.color).toContain("--settera-dangerous-color");
  });

  it("does not apply dangerous styling to normal buttons", () => {
    renderActionButton("reset", { reset: () => {} });
    const button = screen.getByRole("button");
    expect(button.style.color).not.toContain("--settera-dangerous-color");
  });

  it("opens modal action dialog", async () => {
    const user = userEvent.setup();
    renderActionButton("invite", { invite: () => {} });

    await user.click(screen.getByRole("button", { name: "Invite User" }));
    expect(
      screen.getByRole("dialog", { name: "Invite teammate" }),
    ).toBeDefined();
    expect(screen.getByLabelText("Email")).toBeDefined();
    expect(document.activeElement).toBe(screen.getByLabelText("Email"));
  });

  it("returns focus to trigger when modal closes", async () => {
    const user = userEvent.setup();
    renderActionButton("invite", { invite: () => {} });

    const trigger = screen.getByRole("button", { name: "Invite User" });
    await user.click(trigger);
    await user.click(screen.getByRole("button", { name: "Cancel" }));

    expect(trigger).toBe(document.activeElement);
  });

  it("closes modal on Escape when idle", async () => {
    const user = userEvent.setup();
    renderActionButton("invite", { invite: () => {} });

    await user.click(screen.getByRole("button", { name: "Invite User" }));
    expect(
      screen.getByRole("dialog", { name: "Invite teammate" }),
    ).toBeDefined();

    await user.keyboard("{Escape}");
    expect(
      screen.queryByRole("dialog", { name: "Invite teammate" }),
    ).toBeNull();
  });

  it("does not call modal action handler before submit", async () => {
    const user = userEvent.setup();
    const handler = vi.fn();
    renderActionButton("invite", { invite: handler });

    await user.click(screen.getByRole("button", { name: "Invite User" }));
    await user.type(screen.getByLabelText("Email"), "sam@example.com");
    expect(handler).not.toHaveBeenCalled();
  });

  it("submits modal payload on explicit submit", async () => {
    const user = userEvent.setup();
    const handler = vi.fn();
    renderActionButton("invite", { invite: handler });

    await user.click(screen.getByRole("button", { name: "Invite User" }));
    await user.type(screen.getByLabelText("Email"), "sam@example.com");
    await user.selectOptions(screen.getByLabelText("Role"), "admin");
    await user.clear(screen.getByLabelText("Quota"));
    await user.type(screen.getByLabelText("Quota"), "1.5");
    await user.click(screen.getByRole("button", { name: "Send invite" }));

    expect(handler).toHaveBeenCalledWith({
      email: "sam@example.com",
      role: "admin",
      quota: 1.5,
    });
  });

  it("cancels modal without calling handler", async () => {
    const user = userEvent.setup();
    const handler = vi.fn();
    renderActionButton("invite", { invite: handler });

    await user.click(screen.getByRole("button", { name: "Invite User" }));
    await user.type(screen.getByLabelText("Email"), "sam@example.com");
    await user.click(screen.getByRole("button", { name: "Cancel" }));

    expect(handler).not.toHaveBeenCalled();
  });

  it("resets modal draft after cancel and reopen", async () => {
    const user = userEvent.setup();
    renderActionButton("invite", { invite: () => {} });

    await user.click(screen.getByRole("button", { name: "Invite User" }));
    const email = screen.getByLabelText("Email") as HTMLInputElement;
    await user.type(email, "sam@example.com");
    expect(email.value).toBe("sam@example.com");

    await user.click(screen.getByRole("button", { name: "Cancel" }));
    await user.click(screen.getByRole("button", { name: "Invite User" }));

    expect((screen.getByLabelText("Email") as HTMLInputElement).value).toBe("");
  });

  it("submits nested modal payload shapes", async () => {
    const user = userEvent.setup();
    const handler = vi.fn();
    renderActionButton("inviteAdvanced", { inviteAdvanced: handler });

    await user.click(screen.getByRole("button", { name: "Invite Advanced" }));
    await user.type(screen.getByLabelText("Name"), "Sam");
    await user.click(screen.getByLabelText("Active"));
    await user.click(screen.getByRole("button", { name: "Add item" }));
    await user.type(screen.getByLabelText("Tags item 2"), "beta");
    await user.click(screen.getByRole("button", { name: "Submit advanced" }));

    expect(handler).toHaveBeenCalledWith({
      profile: { name: "Sam", active: false },
      tags: ["alpha", "beta"],
    });
  });

  it("keeps modal open and blocks duplicate submit while async in-flight", async () => {
    const user = userEvent.setup();
    let resolve: () => void;
    const handler = vi.fn(
      () =>
        new Promise<void>((r) => {
          resolve = r;
        }),
    );
    renderActionButton("invite", { invite: handler });

    await user.click(screen.getByRole("button", { name: "Invite User" }));
    await user.type(screen.getByLabelText("Email"), "sam@example.com");
    await user.click(screen.getByRole("button", { name: "Send invite" }));

    expect(handler).toHaveBeenCalledTimes(1);
    expect(
      screen.getByRole("dialog", { name: "Invite teammate" }),
    ).toBeDefined();
    const loadingSubmit = screen.getByRole("button", {
      name: "Loading…",
    }) as HTMLButtonElement;
    expect(loadingSubmit.disabled).toBe(true);

    await user.click(loadingSubmit);
    expect(handler).toHaveBeenCalledTimes(1);

    fireEvent.pointerDown(document.body);
    fireEvent.pointerUp(document.body);
    expect(
      screen.getByRole("dialog", { name: "Invite teammate" }),
    ).toBeDefined();

    await user.keyboard("{Escape}");
    expect(
      screen.getByRole("dialog", { name: "Invite teammate" }),
    ).toBeDefined();

    await act(async () => {
      resolve!();
    });

    expect(
      screen.queryByRole("dialog", { name: "Invite teammate" }),
    ).toBeNull();
  });

  describe("disabled", () => {
    it("renders a disabled button", () => {
      renderActionButton("disabled-action", { "disabled-action": () => {} });
      const button = screen.getByRole("button") as HTMLButtonElement;
      expect(button.disabled).toBe(true);
    });

    it("does not call handler on click when disabled", async () => {
      const user = userEvent.setup();
      const handler = vi.fn();
      renderActionButton("disabled-action", { "disabled-action": handler });
      await user.click(screen.getByRole("button"));
      expect(handler).not.toHaveBeenCalled();
    });
  });
});
