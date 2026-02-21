"use client";

import React, { useCallback, useState } from "react";
import { useSetteraSearch } from "./use-settera-search";
import {
  InputGroup,
  InputGroupAddon,
  InputGroupButton,
  InputGroupInput,
} from "@/components/ui/input-group";
import { Kbd } from "@/components/ui/kbd";
import { useSetteraLabels } from "./settera-labels";

export function SetteraSearch() {
  const { query, setQuery } = useSetteraSearch();
  const labels = useSetteraLabels();
  const [isFocused, setIsFocused] = useState(false);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLInputElement>) => {
      if (e.key === "Escape") {
        setQuery("");
      }
      if (e.key === "ArrowDown") {
        const sidebar = (e.target as HTMLElement).closest('[data-sidebar="sidebar"]');
        const firstItem = sidebar?.querySelector<HTMLElement>('[data-sidebar="menu-button"]');
        if (firstItem) {
          e.preventDefault();
          firstItem.focus();
        }
      }
    },
    [setQuery],
  );

  const showKbd = !isFocused && query.length === 0;

  return (
    <InputGroup className="bg-card dark:bg-card">
      <InputGroupInput
        type="text"
        role="searchbox"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        onKeyDown={handleKeyDown}
        onFocus={() => setIsFocused(true)}
        onBlur={() => setIsFocused(false)}
        placeholder={labels.searchPlaceholder}
        aria-label={labels.searchPlaceholder}
      />
      {showKbd && (
        <InputGroupAddon align="inline-end">
          <Kbd>/</Kbd>
        </InputGroupAddon>
      )}
      {query.length > 0 && (
        <InputGroupAddon align="inline-end">
          <InputGroupButton
            size="icon-xs"
            onClick={() => setQuery("")}
            aria-label="Clear search"
          >
            &times;
          </InputGroupButton>
        </InputGroupAddon>
      )}
    </InputGroup>
  );
}
