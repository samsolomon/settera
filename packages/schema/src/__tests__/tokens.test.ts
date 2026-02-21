import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { token, UI_TOKENS, SHADCN_TOKENS } from "../tokens.js";

describe("token()", () => {
  it("returns var() with canonical fallback for known tokens", () => {
    expect(token("foreground")).toBe("var(--settera-foreground, #111827)");
    expect(token("input-font-size")).toBe(
      "var(--settera-input-font-size, 0.875rem)",
    );
  });

  it("handles nested var() cascades in fallback", () => {
    expect(token("card-bg")).toBe(
      "var(--settera-card-bg, var(--settera-card, white))",
    );
  });

  it("returns var() without fallback for unknown tokens", () => {
    expect(token("nonexistent-token")).toBe("var(--settera-nonexistent-token)");
  });

  describe("dev warning", () => {
    let warnSpy: ReturnType<typeof vi.spyOn>;
    const originalEnv = process.env.NODE_ENV;

    beforeEach(() => {
      warnSpy = vi.spyOn(console, "warn").mockImplementation(() => {});
      process.env.NODE_ENV = "development";
    });

    afterEach(() => {
      warnSpy.mockRestore();
      process.env.NODE_ENV = originalEnv;
    });

    it("warns in development for unknown tokens", () => {
      token("fake-token-name");
      expect(warnSpy).toHaveBeenCalledWith(
        expect.stringContaining("Unknown token"),
      );
    });

    it("does not warn for known tokens", () => {
      token("foreground");
      expect(warnSpy).not.toHaveBeenCalled();
    });
  });
});

describe("UI_TOKENS", () => {
  it("contains core semantic tokens", () => {
    expect(UI_TOKENS["foreground"]).toBe("#111827");
    expect(UI_TOKENS["background"]).toBe("#f9fafb");
    expect(UI_TOKENS["card"]).toBe("white");
    expect(UI_TOKENS["primary"]).toBe("#2563eb");
    expect(UI_TOKENS["destructive"]).toBe("#dc2626");
  });

  it("uses rem for font sizes", () => {
    expect(UI_TOKENS["input-font-size"]).toBe("0.875rem");
    expect(UI_TOKENS["description-font-size"]).toBe("0.8125rem");
    expect(UI_TOKENS["page-title-font-size"]).toBe("1.25rem");
    expect(UI_TOKENS["section-title-font-size"]).toBe("1rem");
  });

  it("uses rem for spacing and dimensions", () => {
    expect(UI_TOKENS["space-50"]).toBe("0.25rem");
    expect(UI_TOKENS["space-100"]).toBe("0.5rem");
    expect(UI_TOKENS["sidebar-width"]).toBe("17.5rem");
    expect(UI_TOKENS["input-width"]).toBe("12.5rem");
  });

  it("uses rem for border-radius", () => {
    expect(UI_TOKENS["input-border-radius"]).toBe("0.25rem");
    expect(UI_TOKENS["card-border-radius"]).toBe("0.5rem");
    expect(UI_TOKENS["dialog-border-radius"]).toBe("0.5rem");
  });

  it("keeps px for border widths", () => {
    expect(UI_TOKENS["input-border"]).toContain("1px solid");
    expect(UI_TOKENS["card-border"]).toContain("1px solid");
  });

  it("keeps px for z-index values", () => {
    expect(UI_TOKENS["z-overlay"]).toBe("1000");
    expect(UI_TOKENS["z-dialog"]).toBe("1001");
  });

  it("keeps px for shadow values", () => {
    expect(UI_TOKENS["dialog-shadow"]).toContain("px");
    expect(UI_TOKENS["select-content-shadow"]).toContain("px");
  });

  it("has consistent muted-foreground canonical value", () => {
    expect(UI_TOKENS["muted-foreground"]).toBe("#6b7280");
  });

  it("has correct mobile-drawer-bg (using --settera-background cascade)", () => {
    expect(UI_TOKENS["mobile-drawer-bg"]).toBe(
      "var(--settera-background, #f9fafb)",
    );
  });

  it("has correct search-border (using #d1d5db, not #e4e4e7)", () => {
    expect(UI_TOKENS["search-border"]).toBe(
      "1px solid var(--settera-input, #d1d5db)",
    );
  });
});

describe("SHADCN_TOKENS", () => {
  it("contains 14 tokens", () => {
    expect(Object.keys(SHADCN_TOKENS).length).toBe(14);
  });

  it("has success-color", () => {
    expect(SHADCN_TOKENS["success-color"]).toBe("#16a34a");
  });

  it("uses rem for font sizes", () => {
    expect(SHADCN_TOKENS["page-title-font-size"]).toBe("1.5rem");
    expect(SHADCN_TOKENS["section-title-font-size"]).toBe("1rem");
  });

  it("keeps px for layout breakpoint values", () => {
    expect(SHADCN_TOKENS["content-max-width"]).toBe("640px");
    expect(SHADCN_TOKENS["control-width"]).toBe("200px");
  });
});
