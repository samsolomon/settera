import { describe, it, expect } from "vitest";
import {
  parseISODate,
  formatDisplayDate,
  formatISODate,
  parseDateInput,
} from "../settera/settera-date-input";

describe("parseISODate", () => {
  it("parses valid ISO date string", () => {
    const result = parseISODate("2024-03-15");
    expect(result).toBeDefined();
    expect(result!.getFullYear()).toBe(2024);
    expect(result!.getMonth()).toBe(2); // 0-indexed
    expect(result!.getDate()).toBe(15);
  });

  it("returns undefined for invalid string", () => {
    expect(parseISODate("not-a-date")).toBeUndefined();
  });

  it("returns undefined for empty string", () => {
    expect(parseISODate("")).toBeUndefined();
  });
});

describe("formatDisplayDate", () => {
  it("formats date as M/d/yyyy", () => {
    const date = new Date(2024, 2, 15); // March 15, 2024
    expect(formatDisplayDate(date)).toBe("3/15/2024");
  });

  it("does not zero-pad month or day", () => {
    const date = new Date(2024, 0, 5); // Jan 5
    expect(formatDisplayDate(date)).toBe("1/5/2024");
  });
});

describe("formatISODate", () => {
  it("formats date as yyyy-MM-dd", () => {
    const date = new Date(2024, 2, 15);
    expect(formatISODate(date)).toBe("2024-03-15");
  });

  it("zero-pads month and day", () => {
    const date = new Date(2024, 0, 5);
    expect(formatISODate(date)).toBe("2024-01-05");
  });
});

describe("parseDateInput", () => {
  it("parses M/d/yyyy format", () => {
    const result = parseDateInput("3/15/2024");
    expect(result).toBeDefined();
    expect(formatISODate(result!)).toBe("2024-03-15");
  });

  it("parses MM/dd/yyyy format", () => {
    const result = parseDateInput("03/15/2024");
    expect(result).toBeDefined();
    expect(formatISODate(result!)).toBe("2024-03-15");
  });

  it("parses ISO format", () => {
    const result = parseDateInput("2024-03-15");
    expect(result).toBeDefined();
    expect(formatISODate(result!)).toBe("2024-03-15");
  });

  it("parses MMM d, yyyy format", () => {
    const result = parseDateInput("Mar 15, 2024");
    expect(result).toBeDefined();
    expect(formatISODate(result!)).toBe("2024-03-15");
  });

  it("returns undefined for empty string", () => {
    expect(parseDateInput("")).toBeUndefined();
  });

  it("returns undefined for whitespace", () => {
    expect(parseDateInput("   ")).toBeUndefined();
  });

  it("returns undefined for garbage", () => {
    expect(parseDateInput("not a date")).toBeUndefined();
  });

  it("trims whitespace before parsing", () => {
    const result = parseDateInput("  3/15/2024  ");
    expect(result).toBeDefined();
    expect(formatISODate(result!)).toBe("2024-03-15");
  });
});
