import React, { useCallback } from "react";
import { useSetteraSearch } from "../hooks/useSetteraSearch.js";

/**
 * Search input for filtering settings.
 * Renders a text input with clear button and Escape-to-clear.
 */
export function SetteraSearch() {
  const { query, setQuery } = useSetteraSearch();

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLInputElement>) => {
      if (e.key === "Escape") {
        setQuery("");
      }
    },
    [setQuery],
  );

  return (
    <div
      style={{
        margin: "var(--settera-search-margin, 0 0 4px 0)",
        position: "relative",
      }}
    >
      <input
        type="text"
        role="searchbox"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder="Search settings…"
        aria-label="Search settings"
        style={{
          width: "100%",
          padding: "var(--settera-search-input-padding, 6px 10px)",
          border: "var(--settera-search-border, 1px solid #e5e7eb)",
          borderRadius: "var(--settera-search-border-radius, 6px)",
          fontSize: "var(--settera-search-font-size, 13px)",
          backgroundColor: "var(--settera-search-bg, white)",
          fontFamily: "inherit",
          boxSizing: "border-box",
        }}
      />
      {query.length > 0 && (
        <button
          onClick={() => setQuery("")}
          aria-label="Clear search"
          style={{
            position: "absolute",
            right: "6px",
            top: "50%",
            transform: "translateY(-50%)",
            border: "none",
            background: "transparent",
            cursor: "pointer",
            fontSize: "14px",
            lineHeight: 1,
            padding: "2px",
            color: "var(--settera-search-placeholder-color, #9ca3af)",
          }}
        >
          ×
        </button>
      )}
    </div>
  );
}
