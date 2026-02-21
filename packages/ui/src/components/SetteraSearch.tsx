import React, { useCallback, useState } from "react";
import { token } from "@settera/schema";
import { useSetteraSearch } from "../hooks/useSetteraSearch.js";
import { PrimitiveButton, PrimitiveInput } from "./SetteraPrimitives.js";

const kbdStyle: React.CSSProperties = {
  position: "absolute",
  right: "8px",
  top: "50%",
  transform: "translateY(-50%)",
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  height: "20px",
  minWidth: "20px",
  pointerEvents: "none",
  userSelect: "none",
  fontSize: token("kbd-font-size"),
  fontFamily: "inherit",
  fontWeight: 500,
  lineHeight: 1,
  color: token("kbd-color"),
  backgroundColor: token("kbd-bg"),
  border: "none",
  borderRadius: token("kbd-border-radius"),
  padding: "0 4px",
};

/**
 * Search input for filtering settings.
 * Renders a text input with clear button and Escape-to-clear.
 */
export function SetteraSearch() {
  const { query, setQuery } = useSetteraSearch();
  const [isFocused, setIsFocused] = useState(false);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLInputElement>) => {
      if (e.key === "Escape") {
        setQuery("");
        return;
      }
      if (e.key === "ArrowDown") {
        const firstNavItem = document.querySelector(
          "[data-settera-nav] button[tabindex='0']",
        );
        if (firstNavItem instanceof HTMLElement) {
          e.preventDefault();
          firstNavItem.focus();
        }
      }
    },
    [setQuery],
  );

  const showKbd = !isFocused && query.length === 0;

  return (
    <div
      style={{
        margin: token("search-margin"),
        position: "relative",
      }}
    >
      <PrimitiveInput
        type="text"
        role="searchbox"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        onKeyDown={handleKeyDown}
        onFocus={() => setIsFocused(true)}
        onBlur={() => setIsFocused(false)}
        placeholder="Search settings…"
        aria-label="Search settings"
        focusVisible={isFocused}
        style={{
          width: "100%",
          padding: token("search-input-padding"),
          border: token("search-border"),
          borderRadius: token("search-border-radius"),
          fontSize: token("search-font-size"),
          backgroundColor: token("search-bg"),
          color: token("search-color"),
          fontFamily: "inherit",
          boxSizing: "border-box",
        }}
      />
      {showKbd && (
        <kbd style={kbdStyle}>/</kbd>
      )}
      {query.length > 0 && (
        <PrimitiveButton
          type="button"
          tone="default"
          onClick={() => setQuery("")}
          aria-label="Clear search"
          style={{
            position: "absolute",
            right: "6px",
            top: "50%",
            transform: "translateY(-50%)",
            background: "transparent",
            cursor: "pointer",
            fontSize: "14px",
            lineHeight: 1,
            padding: "2px",
            minWidth: "18px",
            minHeight: "18px",
            border: "none",
            backgroundColor: "transparent",
            color: token("search-placeholder-color"),
          }}
        >
          ×
        </PrimitiveButton>
      )}
    </div>
  );
}
