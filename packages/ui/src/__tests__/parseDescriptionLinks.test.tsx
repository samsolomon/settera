import React from "react";
import { describe, it, expect } from "vitest";
import { render } from "@testing-library/react";
import { parseDescriptionLinks } from "../utils/parseDescriptionLinks.js";

describe("parseDescriptionLinks", () => {
  it("returns the original string when no links present", () => {
    const result = parseDescriptionLinks("Plain text with no links.");
    expect(result).toBe("Plain text with no links.");
  });

  it("parses a single markdown link", () => {
    const result = parseDescriptionLinks(
      "See [our docs](https://example.com) for more.",
    );
    const { container } = render(<>{result}</>);
    const link = container.querySelector("a");
    expect(link).not.toBeNull();
    expect(link!.href).toBe("https://example.com/");
    expect(link!.textContent).toBe("our docs");
    expect(container.textContent).toBe("See our docs for more.");
  });

  it("parses multiple links in one string", () => {
    const result = parseDescriptionLinks(
      "Visit [Docs](https://docs.example.com) and [Blog](https://blog.example.com).",
    );
    const { container } = render(<>{result}</>);
    const links = container.querySelectorAll("a");
    expect(links.length).toBe(2);
    expect(links[0].textContent).toBe("Docs");
    expect(links[1].textContent).toBe("Blog");
  });

  it("sets target=_blank and rel=noopener noreferrer on links", () => {
    const result = parseDescriptionLinks(
      "Click [here](https://example.com).",
    );
    const { container } = render(<>{result}</>);
    const link = container.querySelector("a")!;
    expect(link.target).toBe("_blank");
    expect(link.rel).toBe("noopener noreferrer");
  });

  it("supports http URLs", () => {
    const result = parseDescriptionLinks(
      "Visit [site](http://example.com).",
    );
    const { container } = render(<>{result}</>);
    const link = container.querySelector("a");
    expect(link).not.toBeNull();
    expect(link!.href).toBe("http://example.com/");
  });

  it("does not match non-http URLs like javascript:", () => {
    const text = "Click [here](javascript:alert(1)).";
    const result = parseDescriptionLinks(text);
    // Should return the original string since no valid links found
    expect(result).toBe(text);
  });

  it("does not match malformed markdown links", () => {
    const text = "Not a link: [text](ftp://example.com)";
    const result = parseDescriptionLinks(text);
    expect(result).toBe(text);
  });
});
