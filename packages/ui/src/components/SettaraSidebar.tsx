import React, { useContext, useEffect, useCallback, useRef } from "react";
import {
  SettaraSchemaContext,
  useSettaraNavigation,
  useSettaraSearch,
} from "@settara/react";
import type { PageDefinition } from "@settara/schema";
import { SettaraSearch } from "./SettaraSearch.js";

export interface SettaraSidebarProps {
  renderIcon?: (iconName: string) => React.ReactNode;
}

/**
 * Navigation tree rendered from schema.pages.
 * Handles active state, expand/collapse, nested pages, and icon rendering.
 */
export function SettaraSidebar({ renderIcon }: SettaraSidebarProps) {
  const schemaCtx = useContext(SettaraSchemaContext);
  const { activePage, setActivePage, expandedGroups, toggleGroup } =
    useSettaraNavigation();
  const { isSearching, matchingPageKeys } = useSettaraSearch();

  if (!schemaCtx) {
    throw new Error("SettaraSidebar must be used within a SettaraProvider.");
  }

  const { schema } = schemaCtx;

  // Ref to read expandedGroups without it being an effect dependency.
  // This prevents the double-render cycle: toggleGroup creates a new Set,
  // which would re-trigger the effect if expandedGroups were in the dep array.
  const expandedGroupsRef = useRef(expandedGroups);
  expandedGroupsRef.current = expandedGroups;

  // Auto-expand parent when a child page is active
  useEffect(() => {
    for (const page of schema.pages) {
      if (page.pages) {
        const isChildActive = page.pages.some((c) => c.key === activePage);
        if (isChildActive && !expandedGroupsRef.current.has(page.key)) {
          toggleGroup(page.key);
        }
      }
    }
  }, [activePage, schema.pages, toggleGroup]);

  const handlePageClick = useCallback(
    (page: PageDefinition) => {
      const hasChildren = page.pages && page.pages.length > 0;
      const hasSections = page.sections && page.sections.length > 0;

      if (hasChildren && !hasSections) {
        // Parent with only children — just toggle expand
        toggleGroup(page.key);
      } else if (hasChildren && hasSections) {
        // Parent with own sections + children — navigate AND toggle
        setActivePage(page.key);
        toggleGroup(page.key);
      } else {
        // Leaf page — just navigate
        setActivePage(page.key);
      }
    },
    [setActivePage, toggleGroup],
  );

  // Filter pages during search
  const filterPages = (pages: PageDefinition[]): PageDefinition[] => {
    if (!isSearching) return pages;
    return pages.filter((page) => matchingPageKeys.has(page.key));
  };

  const visiblePages = filterPages(schema.pages);

  return (
    <nav
      role="tree"
      aria-label="Settings navigation"
      style={{
        width: "var(--settara-sidebar-width, 240px)",
        backgroundColor: "var(--settara-sidebar-bg, #fafafa)",
        borderRight: "var(--settara-sidebar-border, 1px solid #e5e7eb)",
        fontSize: "var(--settara-sidebar-font-size, 14px)",
        overflowY: "auto",
      }}
    >
      <SettaraSearch />
      {visiblePages.map((page) => (
        <SidebarItem
          key={page.key}
          page={page}
          depth={0}
          activePage={activePage}
          expandedGroups={expandedGroups}
          onPageClick={handlePageClick}
          onChildClick={setActivePage}
          renderIcon={renderIcon}
          isSearching={isSearching}
          matchingPageKeys={matchingPageKeys}
        />
      ))}
    </nav>
  );
}

interface SidebarItemProps {
  page: PageDefinition;
  depth: number;
  activePage: string;
  expandedGroups: Set<string>;
  onPageClick: (page: PageDefinition) => void;
  onChildClick: (key: string) => void;
  renderIcon?: (iconName: string) => React.ReactNode;
  isSearching: boolean;
  matchingPageKeys: Set<string>;
}

function SidebarItem({
  page,
  depth,
  activePage,
  expandedGroups,
  onPageClick,
  onChildClick,
  renderIcon,
  isSearching,
  matchingPageKeys,
}: SidebarItemProps) {
  const isActive = activePage === page.key;
  const hasChildren = page.pages && page.pages.length > 0;
  // Auto-expand parents with matching children during search
  const isExpanded = isSearching
    ? hasChildren &&
      page.pages!.some((child) => matchingPageKeys.has(child.key))
    : expandedGroups.has(page.key);
  const paddingLeft = depth === 0 ? 16 : 16 + depth * 24;

  // During search, filter children to only matching pages
  const visibleChildren = hasChildren
    ? isSearching
      ? page.pages!.filter((child) => matchingPageKeys.has(child.key))
      : page.pages!
    : [];

  return (
    <div role="treeitem" aria-expanded={hasChildren ? isExpanded : undefined}>
      <button
        onClick={() =>
          depth === 0 ? onPageClick(page) : onChildClick(page.key)
        }
        aria-current={isActive ? "page" : undefined}
        style={{
          display: "flex",
          alignItems: "center",
          gap: "8px",
          width: "100%",
          padding: `var(--settara-sidebar-item-padding, 8px ${paddingLeft}px)`,
          paddingLeft: `${paddingLeft}px`,
          border: "none",
          background: isActive
            ? "var(--settara-sidebar-active-bg, #f3f4f6)"
            : "transparent",
          color: isActive
            ? "var(--settara-sidebar-active-color, #111827)"
            : "inherit",
          fontWeight: isActive ? 600 : 400,
          fontSize: "inherit",
          textAlign: "left",
          cursor: "pointer",
          fontFamily: "inherit",
        }}
      >
        {depth === 0 && page.icon && renderIcon && (
          <span aria-hidden="true">{renderIcon(page.icon)}</span>
        )}
        {page.title}
      </button>
      {hasChildren && isExpanded && (
        <div role="group">
          {visibleChildren.map((child) => (
            <SidebarItem
              key={child.key}
              page={child}
              depth={depth + 1}
              activePage={activePage}
              expandedGroups={expandedGroups}
              onPageClick={onPageClick}
              onChildClick={onChildClick}
              renderIcon={renderIcon}
              isSearching={isSearching}
              matchingPageKeys={matchingPageKeys}
            />
          ))}
        </div>
      )}
    </div>
  );
}
