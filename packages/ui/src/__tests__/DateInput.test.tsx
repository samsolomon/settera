import React from "react";
import { describe, it, expect, vi } from "vitest";
import { render, screen, act, fireEvent } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { SetteraProvider, SetteraRenderer } from "@settera/react";
import { DateInput } from "../components/DateInput.js";
import { SettingRow } from "../components/SettingRow.js";
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
              key: "birthday",
              title: "Birthday",
              type: "date",
              default: "2000-01-01",
            },
            {
              key: "required-date",
              title: "Required Date",
              type: "date",
              validation: {
                required: true,
              },
            },
            {
              key: "ranged-date",
              title: "Ranged Date",
              type: "date",
              validation: {
                minDate: "2025-01-01",
                maxDate: "2025-12-31",
              },
            },
            {
              key: "dangerous-date",
              title: "Dangerous Date",
              type: "date",
              dangerous: true,
            },
          ],
        },
      ],
    },
  ],
};

function renderDateInput(
  settingKey: string,
  values: Record<string, unknown>,
  onChange: (key: string, value: unknown) => void = () => {},
) {
  return render(
    <SetteraProvider schema={schema}>
      <SetteraRenderer values={values} onChange={onChange}>
        <DateInput settingKey={settingKey} />
      </SetteraRenderer>
    </SetteraProvider>,
  );
}

describe("DateInput", () => {
  it("renders a date input", () => {
    renderDateInput("birthday", { birthday: "2000-01-01" });
    const input = screen.getByLabelText("Birthday") as HTMLInputElement;
    expect(input.type).toBe("date");
  });

  it("displays the current value", () => {
    renderDateInput("birthday", { birthday: "1995-06-15" });
    const input = screen.getByLabelText("Birthday") as HTMLInputElement;
    expect(input.value).toBe("1995-06-15");
  });

  it("calls onChange when value changes", () => {
    const onChange = vi.fn();
    renderDateInput("birthday", { birthday: "2000-01-01" }, onChange);
    const input = screen.getByLabelText("Birthday") as HTMLInputElement;
    fireEvent.change(input, { target: { value: "2001-02-14" } });
    expect(onChange).toHaveBeenCalledWith("birthday", "2001-02-14");
  });

  it("clears value with empty string", () => {
    const onChange = vi.fn();
    renderDateInput("birthday", { birthday: "2000-01-01" }, onChange);
    const input = screen.getByLabelText("Birthday") as HTMLInputElement;
    fireEvent.change(input, { target: { value: "" } });
    expect(onChange).toHaveBeenCalledWith("birthday", "");
  });

  it("sets min and max attributes from validation", () => {
    renderDateInput("ranged-date", { "ranged-date": "2025-06-15" });
    const input = screen.getByLabelText("Ranged Date") as HTMLInputElement;
    expect(input.min).toBe("2025-01-01");
    expect(input.max).toBe("2025-12-31");
  });

  it("uses default value when not in values", () => {
    renderDateInput("birthday", {});
    const input = screen.getByLabelText("Birthday") as HTMLInputElement;
    expect(input.value).toBe("2000-01-01");
  });

  it("has aria-label from definition title", () => {
    renderDateInput("birthday", { birthday: "2000-01-01" });
    expect(screen.getByLabelText("Birthday")).toBeDefined();
  });

  it("has aria-invalid=false when no error", () => {
    renderDateInput("birthday", { birthday: "2000-01-01" });
    const input = screen.getByLabelText("Birthday");
    expect(input.getAttribute("aria-invalid")).toBe("false");
  });

  it("shows required validation error on blur", async () => {
    const user = userEvent.setup();
    render(
      <SetteraProvider schema={schema}>
        <SetteraRenderer values={{ "required-date": "" }} onChange={() => {}}>
          <SettingRow settingKey="required-date">
            <DateInput settingKey="required-date" />
          </SettingRow>
        </SetteraRenderer>
      </SetteraProvider>,
    );

    const input = screen.getByLabelText("Required Date", {
      selector: "input",
    });
    await act(async () => {
      await user.click(input);
      await user.tab();
    });

    expect(screen.getByRole("alert").textContent).toBe(
      "This field is required",
    );
  });

  it("shows focus ring on keyboard focus", async () => {
    const user = userEvent.setup();
    renderDateInput("birthday", { birthday: "2000-01-01" });
    await user.tab();
    const input = screen.getByLabelText("Birthday");
    expect(input.style.boxShadow).toContain("0 0 0 2px");
  });

  it("applies dangerous styling", () => {
    renderDateInput("dangerous-date", { "dangerous-date": "2025-01-01" });
    const input = screen.getByLabelText("Dangerous Date");
    expect(input.style.color).toContain("--settera-dangerous-color");
  });

  it("runs async validation on blur", async () => {
    const user = userEvent.setup();
    const asyncValidator = vi.fn().mockResolvedValue("Date not available");
    render(
      <SetteraProvider schema={schema}>
        <SetteraRenderer
          values={{ birthday: "2000-01-01" }}
          onChange={() => {}}
          onValidate={{ birthday: asyncValidator }}
        >
          <SettingRow settingKey="birthday">
            <DateInput settingKey="birthday" />
          </SettingRow>
        </SetteraRenderer>
      </SetteraProvider>,
    );

    await act(async () => {
      await user.click(
        screen.getByLabelText("Birthday", { selector: "input" }),
      );
      await user.tab();
    });

    expect(asyncValidator).toHaveBeenCalledWith("2000-01-01");
    expect(screen.getByRole("alert").textContent).toBe("Date not available");
  });
});
