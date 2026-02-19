"use client";

import React, { useCallback, useState } from "react";
import { useSetteraSearch } from "./use-settera-search";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

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
    <div className="relative mb-1">
      <Input
        type="text"
        role="searchbox"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        onKeyDown={handleKeyDown}
        onFocus={() => setIsFocused(true)}
        onBlur={() => setIsFocused(false)}
        placeholder="Search settings\u2026"
        aria-label="Search settings"
        className="w-full pr-8"
      />
      {showKbd && (
        <kbd className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 inline-flex h-5 items-center justify-center rounded bg-muted px-1 text-xs font-medium text-muted-foreground">
          /
        </kbd>
      )}
      {query.length > 0 && (
        <Button
          type="button"
          variant="ghost"
          size="icon"
          onClick={() => setQuery("")}
          aria-label="Clear search"
          className="absolute right-1 top-1/2 -translate-y-1/2 h-6 w-6"
        >
          &times;
        </Button>
      )}
    </div>
  );
}
