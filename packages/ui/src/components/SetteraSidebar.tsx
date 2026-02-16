import React, {
  useContext,
  useEffect,
  useCallback,
  useRef,
  useMemo,
} from "react";
import {
  SetteraSchemaContext,
  useSetteraNavigation,
  useSetteraSearch,
  useRovingTabIndex,
} from "@settera/react";
import type { PageDefinition } from "@settera/schema";
import { isFlattenedPage, resolvePageKey } from "@settera/schema";
import { SetteraSearch } from "./SetteraSearch.js";

export interface SetteraSidebarProps {
  renderIcon?: (iconName: string) => React.ReactNode;
}

interface FlatItem {
  page: PageDefinition;
  depth: number;
  parentKey: string | null;
}

/**
 * Navigation tree rendered from schema.pages.
 * Handles active state, expand/collapse, nested pages, icon rendering,
 * and keyboard navigation (roving tabindex + arrow-key tree semantics).
 */
export function SetteraSidebar({ renderIcon }: SetteraSidebarProps) {
  const schemaCtx = useContext(SetteraSchemaContext);
  const { activePage, setActivePage, expandedGroups, toggleGroup } =
    useSetteraNavigation();
  const { isSearching, matchingPageKeys } = useSetteraSearch();

  if (!schemaCtx) {
    throw new Error("SetteraSidebar must be used within a SetteraProvider.");
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
      if (page.pages && !isFlattenedPage(page)) {
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

      if (isFlattenedPage(page)) {
        // Single-child parent without sections — navigate to the child
        setActivePage(resolvePageKey(page));
      } else if (hasChildren && !hasSections) {
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
  const filterPages = useCallback(
    (pages: PageDefinition[]): PageDefinition[] => {
      if (!isSearching) return pages;
      return pages.filter((page) => matchingPageKeys.has(page.key));
    },
    [isSearching, matchingPageKeys],
  );

  const visiblePages = filterPages(schema.pages);

  // --- Keyboard navigation ---

  // Build flat list of visible items (respecting expand/collapse + search filter)
  const flatItems = useMemo(() => {
    const items: FlatItem[] = [];

    function walk(
      pages: PageDefinition[],
      depth: number,
      parentKey: string | null,
    ) {
      for (const page of pages) {
        // During search, skip non-matching pages
        if (isSearching && !matchingPageKeys.has(page.key)) continue;
        items.push({ page, depth, parentKey });

        const flattened = isFlattenedPage(page);
        const hasChildren = !flattened && page.pages && page.pages.length > 0;
        if (hasChildren) {
          const isExpanded = isSearching
            ? page.pages!.some((child) => matchingPageKeys.has(child.key))
            : expandedGroups.has(page.key);
          if (isExpanded) {
            const children = isSearching
              ? page.pages!.filter((child) => matchingPageKeys.has(child.key))
              : page.pages!;
            walk(children, depth + 1, page.key);
          }
        }
      }
    }

    walk(schema.pages, 0, null);
    return items;
  }, [schema.pages, expandedGroups, isSearching, matchingPageKeys]);

  const { focusedIndex, setFocusedIndex, getTabIndex, onKeyDown } =
    useRovingTabIndex({
      itemCount: flatItems.length,
    });

  // Ref map for button elements (keyed by flat index)
  const buttonRefs = useRef<Map<number, HTMLButtonElement>>(new Map());

  const navRef = useRef<HTMLElement>(null);

  // Focus button when focusedIndex changes AND nav has focus
  useEffect(() => {
    const nav = navRef.current;
    if (!nav) return;
    if (!nav.contains(document.activeElement)) return;
    const btn = buttonRefs.current.get(focusedIndex);
    if (btn && document.activeElement !== btn) {
      btn.focus();
    }
  }, [focusedIndex]);

  // Build a key→index map for quick lookups (O(1) instead of findIndex)
  const keyToIndex = useMemo(() => {
    const map = new Map<string, number>();
    flatItems.forEach((item, i) => map.set(item.page.key, i));
    return map;
  }, [flatItems]);

  // Refs for values that change frequently, so handleNavKeyDown stays stable
  const focusedIndexRef = useRef(focusedIndex);
  focusedIndexRef.current = focusedIndex;
  const flatItemsRef = useRef(flatItems);
  flatItemsRef.current = flatItems;
  const onKeyDownRef = useRef(onKeyDown);
  onKeyDownRef.current = onKeyDown;

  // Tree keyboard handler: wraps roving tabindex with ArrowRight/Left/Enter.
  // Reads focusedIndex/flatItems/onKeyDown from refs so the callback is stable.
  const handleNavKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      const currentFlatItems = flatItemsRef.current;
      const currentIndex = focusedIndexRef.current;
      const item = currentFlatItems[currentIndex];
      if (!item) {
        onKeyDownRef.current(e);
        return;
      }

      const { page, parentKey } = item;
      const hasChildren =
        !isFlattenedPage(page) && page.pages && page.pages.length > 0;
      const isExpanded = hasChildren && expandedGroupsRef.current.has(page.key);

      if (e.key === "ArrowRight") {
        if (hasChildren && !isExpanded) {
          // Expand collapsed group
          e.preventDefault();
          toggleGroup(page.key);
        } else if (hasChildren && isExpanded) {
          // Move to first child
          e.preventDefault();
          const firstChildKey = page.pages![0]?.key;
          if (firstChildKey) {
            const childIndex = keyToIndex.get(firstChildKey);
            if (childIndex !== undefined) {
              setFocusedIndex(childIndex);
            }
          }
        }
        return;
      }

      if (e.key === "ArrowLeft") {
        if (hasChildren && isExpanded) {
          // Collapse expanded group
          e.preventDefault();
          toggleGroup(page.key);
        } else if (parentKey) {
          // Move to parent
          e.preventDefault();
          const parentIndex = keyToIndex.get(parentKey);
          if (parentIndex !== undefined) {
            setFocusedIndex(parentIndex);
          }
        }
        return;
      }

      if (e.key === "Enter") {
        e.preventDefault();
        if (item.depth === 0) {
          handlePageClick(page);
        } else {
          setActivePage(
            isFlattenedPage(page) ? resolvePageKey(page) : page.key,
          );
        }
        return;
      }

      // Delegate to roving tabindex for ArrowUp/Down/Home/End
      onKeyDownRef.current(e);
    },
    [toggleGroup, keyToIndex, setFocusedIndex, handlePageClick, setActivePage],
  );

  // Ref callback factory for storing button refs
  const setButtonRef = useCallback(
    (index: number, el: HTMLButtonElement | null) => {
      if (el) {
        buttonRefs.current.set(index, el);
      } else {
        buttonRefs.current.delete(index);
      }
    },
    [],
  );

  return (
    <nav
      ref={navRef}
      role="tree"
      aria-label="Settings navigation"
      onKeyDown={handleNavKeyDown}
      style={{
        width: "var(--settera-sidebar-width, 240px)",
        backgroundColor: "var(--settera-sidebar-bg, #fafafa)",
        borderRight: "var(--settera-sidebar-border, 1px solid #e5e7eb)",
        fontSize: "var(--settera-sidebar-font-size, 14px)",
        overflowY: "auto",
      }}
    >
      <SetteraSearch />
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
          keyToIndex={keyToIndex}
          getTabIndex={getTabIndex}
          setButtonRef={setButtonRef}
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
  keyToIndex: Map<string, number>;
  getTabIndex: (index: number) => 0 | -1;
  setButtonRef: (index: number, el: HTMLButtonElement | null) => void;
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
  keyToIndex,
  getTabIndex,
  setButtonRef,
}: SidebarItemProps) {
  const flattened = isFlattenedPage(page);
  const isActive = flattened
    ? activePage === resolvePageKey(page)
    : activePage === page.key;
  const hasChildren = !flattened && page.pages && page.pages.length > 0;
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

  // O(1) lookup via the key→index map instead of O(n) findIndex
  const flatIndex = keyToIndex.get(page.key) ?? -1;

  return (
    <div role="treeitem" aria-expanded={hasChildren ? isExpanded : undefined}>
      <button
        ref={(el) => setButtonRef(flatIndex, el)}
        onClick={() =>
          depth === 0
            ? onPageClick(page)
            : onChildClick(
                isFlattenedPage(page) ? resolvePageKey(page) : page.key,
              )
        }
        aria-current={isActive ? "page" : undefined}
        tabIndex={getTabIndex(flatIndex)}
        style={{
          display: "flex",
          alignItems: "center",
          gap: "8px",
          width: "100%",
          padding: `var(--settera-sidebar-item-padding, 8px ${paddingLeft}px)`,
          paddingLeft: `${paddingLeft}px`,
          border: "none",
          background: isActive
            ? "var(--settera-sidebar-active-bg, #f3f4f6)"
            : "transparent",
          color: isActive
            ? "var(--settera-sidebar-active-color, #111827)"
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
              keyToIndex={keyToIndex}
              getTabIndex={getTabIndex}
              setButtonRef={setButtonRef}
            />
          ))}
        </div>
      )}
    </div>
  );
}
