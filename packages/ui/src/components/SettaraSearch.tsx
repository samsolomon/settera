import React, { useCallback } from "react";
import { useSettaraSearch } from "@settara/react";

/**
 * Search input for filtering settings.
 * Renders a text input with clear button and Escape-to-clear.
 */
export function SettaraSearch() {
  const { query, setQuery } = useSettaraSearch();

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
        margin: "var(--settara-search-margin, 8px 12px)",
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
          padding: "var(--settara-search-input-padding, 6px 10px)",
          border: "var(--settara-search-border, 1px solid #e5e7eb)",
          borderRadius: "var(--settara-search-border-radius, 6px)",
          fontSize: "var(--settara-search-font-size, 13px)",
          backgroundColor: "var(--settara-search-bg, white)",
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
            color: "var(--settara-search-placeholder-color, #9ca3af)",
          }}
        >
          ×
        </button>
      )}
    </div>
  );
}
