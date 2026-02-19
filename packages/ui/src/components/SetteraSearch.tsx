import React, { useCallback, useState } from "react";
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
  fontSize: "var(--settera-kbd-font-size, 12px)",
  fontFamily: "inherit",
  fontWeight: 500,
  lineHeight: 1,
  color: "var(--settera-kbd-color, var(--settera-muted-foreground, #9ca3af))",
  backgroundColor: "var(--settera-kbd-bg, var(--settera-muted, #f4f4f5))",
  border: "none",
  borderRadius: "var(--settera-kbd-border-radius, 4px)",
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
      }
    },
    [setQuery],
  );

  const showKbd = !isFocused && query.length === 0;

  return (
    <div
      style={{
        margin: "var(--settera-search-margin, 0 0 4px 0)",
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
          padding: "var(--settera-search-input-padding, 8px 10px)",
          border:
            "var(--settera-search-border, 1px solid var(--settera-input, #e4e4e7))",
          borderRadius: "var(--settera-search-border-radius, 8px)",
          fontSize: "var(--settera-search-font-size, 13px)",
          backgroundColor:
            "var(--settera-search-bg, var(--settera-sidebar-input-bg, transparent))",
          color:
            "var(--settera-search-color, var(--settera-sidebar-foreground, #3f3f46))",
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
            color:
              "var(--settera-search-placeholder-color, var(--settera-sidebar-muted-foreground, #9ca3af))",
          }}
        >
          ×
        </PrimitiveButton>
      )}
    </div>
  );
}
