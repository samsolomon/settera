import React, {
  useContext,
  useEffect,
  useCallback,
  useRef,
  useMemo,
  useState,
} from "react";
import { SetteraSchemaContext } from "@settera/react";
import { useSetteraNavigation } from "../hooks/useSetteraNavigation.js";
import { useSetteraSearch } from "../hooks/useSetteraSearch.js";
import { useRovingTabIndex } from "@settera/react";
import type { PageDefinition, PageItem } from "@settera/schema";
import { isFlattenedPage, resolvePageKey, isPageGroup, flattenPageItems } from "@settera/schema";
import { SetteraSearch } from "./SetteraSearch.js";
import { BackButton } from "./SetteraPrimitives.js";

export interface SetteraSidebarProps {
  renderIcon?: (iconName: string) => React.ReactNode;
  onNavigate?: (pageKey: string) => void;
  backToApp?: {
    label?: string;
    href?: string;
    onClick?: () => void;
  };
  /** Hide the keyboard shortcut hints in the sidebar footer (e.g. in mobile drawers). */
  hideFooterHints?: boolean;
}

interface FlatItem {
  kind: "page" | "section";
  depth: number;
  parentKey: string | null;
  page?: PageDefinition;
  pageKey?: string;
  sectionKey?: string;
}

function getFlatItemKey(item: FlatItem): string {
  if (item.kind === "section") {
    return `section:${item.pageKey}:${item.sectionKey}`;
  }
  return `page:${item.page!.key}`;
}

/**
 * Navigation tree rendered from schema.pages.
 * Handles active state, expand/collapse, nested pages, icon rendering,
 * and keyboard navigation (roving tabindex + arrow-key tree semantics).
 */
export function SetteraSidebar({
  renderIcon,
  onNavigate,
  backToApp,
  hideFooterHints,
}: SetteraSidebarProps) {
  const schemaCtx = useContext(SetteraSchemaContext);
  const {
    activePage,
    setActivePage,
    activeSection,
    setActiveSection,
    expandedGroups,
    toggleGroup,
    requestFocusContent,
  } = useSetteraNavigation();
  const { isSearching, matchingPageKeys, matchingSectionsByPage } = useSetteraSearch();

  if (!schemaCtx) {
    throw new Error("SetteraSidebar must be used within a Settera component.");
  }

  const { schema } = schemaCtx;

  // Ref to read expandedGroups without it being an effect dependency.
  // This prevents the double-render cycle: toggleGroup creates a new Set,
  // which would re-trigger the effect if expandedGroups were in the dep array.
  const expandedGroupsRef = useRef(expandedGroups);
  expandedGroupsRef.current = expandedGroups;

  // Auto-expand parent when a child page is active
  useEffect(() => {
    const allPages = flattenPageItems(schema.pages);
    for (const page of allPages) {
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
        const pageKey = resolvePageKey(page);
        setActivePage(pageKey);
        onNavigate?.(pageKey);
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
        onNavigate?.(page.key);
      }
    },
    [setActivePage, toggleGroup, onNavigate],
  );

  const handleChildClick = useCallback(
    (key: string) => {
      setActivePage(key);
      onNavigate?.(key);
    },
    [setActivePage, onNavigate],
  );

  const handleSectionClick = useCallback(
    (pageKey: string, sectionKey: string) => {
      setActivePage(pageKey);
      setActiveSection(sectionKey);
      onNavigate?.(pageKey);
    },
    [onNavigate, setActivePage, setActiveSection],
  );

  // Filter page items during search, preserving groups (with filtered pages inside)
  const visiblePageItems: PageItem[] = useMemo(() => {
    if (!isSearching) return schema.pages;
    const result: PageItem[] = [];
    for (const item of schema.pages) {
      if (isPageGroup(item)) {
        const filtered = item.pages.filter((p) => matchingPageKeys.has(p.key));
        if (filtered.length > 0) {
          result.push({ ...item, pages: filtered });
        }
      } else {
        if (matchingPageKeys.has(item.key)) {
          result.push(item);
        }
      }
    }
    return result;
  }, [schema.pages, isSearching, matchingPageKeys]);

  // --- Keyboard navigation ---

  // Build flat list of visible items (respecting expand/collapse + search filter)
  // Group labels are skipped — only pages participate in keyboard nav.
  const flatItems = useMemo(() => {
    const items: FlatItem[] = [];
    const getVisibleSectionItems = (page: PageDefinition) => {
      const searchableSections =
        (page.sections ?? []).filter(
          (section) =>
            section.key && section.title && section.title.trim().length > 0,
        ) ?? [];
      const matchingSections = matchingSectionsByPage.get(page.key);
      if (!isSearching || searchableSections.length <= 1 || !matchingSections) {
        return [];
      }
      return searchableSections.filter((section) =>
        matchingSections.has(section.key),
      );
    };

    function walk(
      pages: PageDefinition[],
      depth: number,
      parentKey: string | null,
    ) {
      for (const page of pages) {
        // During search, skip non-matching pages
        if (isSearching && !matchingPageKeys.has(page.key)) continue;
        items.push({ kind: "page", page, depth, parentKey });

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
        const visibleSections = getVisibleSectionItems(page);
        for (const section of visibleSections) {
          items.push({
            kind: "section",
            pageKey: page.key,
            sectionKey: section.key,
            depth: depth + 1,
            parentKey: page.key,
          });
        }
      }
    }

    // Unwrap groups to get flat page list for keyboard nav
    const topLevelPages = flattenPageItems(
      isSearching ? visiblePageItems : schema.pages,
    );
    walk(topLevelPages, 0, null);
    return items;
  }, [
    schema.pages,
    visiblePageItems,
    expandedGroups,
    isSearching,
    matchingPageKeys,
    matchingSectionsByPage,
  ]);

  const { focusedIndex, setFocusedIndex, getTabIndex, onKeyDown } =
    useRovingTabIndex({
      itemCount: flatItems.length,
    });

  // Ref map for button elements (keyed by flat index)
  const buttonRefs = useRef<Map<number, HTMLButtonElement>>(new Map());

  const navRef = useRef<HTMLElement>(null);

  // Focus button when focusedIndex changes AND nav has focus.
  // Also navigate to the focused page so content live-updates.
  // Uses flatItemsRef (not flatItems) to avoid firing when search results change.
  useEffect(() => {
    const nav = navRef.current;
    if (!nav) return;
    if (!nav.contains(document.activeElement)) return;
    const btn = buttonRefs.current.get(focusedIndex);
    if (btn && document.activeElement !== btn) {
      btn.focus();
    }

    // Navigate to the focused item so the content area updates
    const item = flatItemsRef.current[focusedIndex];
    if (item) {
      if (item.kind === "section") {
        if (!item.pageKey || !item.sectionKey) return;
        setActivePage(item.pageKey);
        setActiveSection(item.sectionKey);
        return;
      }

      const { page } = item;
      if (!page) return;
      const hasChildren =
        !isFlattenedPage(page) && page.pages && page.pages.length > 0;
      const hasSections = page.sections && page.sections.length > 0;

      // Don't navigate to expand-only parents (they have no content)
      if (hasChildren && !hasSections && !isFlattenedPage(page)) return;

      const pageKey = isFlattenedPage(page) ? resolvePageKey(page) : page.key;
      setActivePage(pageKey);
    }
  }, [focusedIndex, setActivePage, setActiveSection]);

  // Build a key→index map for quick lookups (O(1) instead of findIndex)
  const keyToIndex = useMemo(() => {
    const map = new Map<string, number>();
    flatItems.forEach((item, i) => map.set(getFlatItemKey(item), i));
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

      if (item.kind === "section") {
        if (e.key === "ArrowLeft" && item.parentKey) {
          e.preventDefault();
          const parentIndex = keyToIndex.get(`page:${item.parentKey}`);
          if (parentIndex !== undefined) {
            setFocusedIndex(parentIndex);
          }
          return;
        }
        if (e.key === "Enter") {
          e.preventDefault();
          requestFocusContent();
          return;
        }
        onKeyDownRef.current(e);
        return;
      }

      const { page, parentKey } = item;
      if (!page) {
        onKeyDownRef.current(e);
        return;
      }
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
            const childIndex = keyToIndex.get(`page:${firstChildKey}`);
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
          const parentIndex = keyToIndex.get(`page:${parentKey}`);
          if (parentIndex !== undefined) {
            setFocusedIndex(parentIndex);
          }
        }
        return;
      }

      if (e.key === "Enter") {
        e.preventDefault();
        const isExpandOnly =
          hasChildren &&
          !(page.sections && page.sections.length > 0) &&
          !isFlattenedPage(page);
        if (isExpandOnly) {
          // Expand-only parent — just toggle, don't focus content
          toggleGroup(page.key);
        } else {
          // Page already loaded via arrow-key navigation; move focus to content
          requestFocusContent();
        }
        return;
      }

      // Delegate to roving tabindex for ArrowUp/Down/Home/End
      onKeyDownRef.current(e);
    },
    [toggleGroup, keyToIndex, setFocusedIndex, requestFocusContent],
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
      data-settera-nav
      onKeyDown={handleNavKeyDown}
      style={{
        width: "var(--settera-sidebar-width, 280px)",
        backgroundColor:
          "var(--settera-sidebar-bg, var(--settera-sidebar-background, var(--settera-background, #fafafa)))",
        borderRight:
          "var(--settera-sidebar-border, 1px solid var(--settera-sidebar-border-color, var(--settera-border, #e4e4e7)))",
        fontSize: "var(--settera-sidebar-font-size, 14px)",
        padding: "var(--settera-sidebar-padding, 12px)",
        overflowY: "auto",
        display: "flex",
        flexDirection: "column",
        gap: "var(--settera-sidebar-gap, 10px)",
      }}
    >
      {backToApp && (
        <div
          style={{
            marginBottom: "var(--settera-sidebar-back-margin-bottom, 0px)",
          }}
        >
          <BackButton
            onClick={backToApp.onClick}
            href={backToApp.onClick ? undefined : backToApp.href}
          >
            {backToApp.label ?? "Back to app"}
          </BackButton>
        </div>
      )}

      <SetteraSearch />

      {visiblePageItems.map((item, idx) => {
        if (isPageGroup(item)) {
          return (
            <div key={`group-${item.label}`}>
              <div
                aria-hidden="true"
                style={{
                  fontSize: "11px",
                  letterSpacing: "0.08em",
                  textTransform: "uppercase",
                  color:
                    "var(--settera-sidebar-group-color, var(--settera-sidebar-muted-foreground, var(--settera-muted-foreground, #71717a)))",
                  fontWeight: 600,
                  padding: "2px 8px",
                  marginTop: idx === 0 ? undefined : "var(--settera-sidebar-group-spacing, 12px)",
                }}
              >
                {item.label}
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: "var(--settera-sidebar-item-list-gap, 2px)" }}>
                {item.pages.map((page) => (
                  <SidebarItem
                    key={page.key}
                    page={page}
                    depth={0}
                    activePage={activePage}
                    expandedGroups={expandedGroups}
                    onPageClick={handlePageClick}
                    onChildClick={handleChildClick}
                    renderIcon={renderIcon}
                    isSearching={isSearching}
                    matchingPageKeys={matchingPageKeys}
                    matchingSectionsByPage={matchingSectionsByPage}
                    activeSection={activeSection}
                    onSectionClick={handleSectionClick}
                    keyToIndex={keyToIndex}
                    getTabIndex={getTabIndex}
                    setButtonRef={setButtonRef}
                  />
                ))}
              </div>
            </div>
          );
        }

        return (
          <SidebarItem
            key={item.key}
            page={item}
            depth={0}
            activePage={activePage}
            expandedGroups={expandedGroups}
            onPageClick={handlePageClick}
            onChildClick={handleChildClick}
            renderIcon={renderIcon}
            isSearching={isSearching}
            matchingPageKeys={matchingPageKeys}
            matchingSectionsByPage={matchingSectionsByPage}
            activeSection={activeSection}
            onSectionClick={handleSectionClick}
            keyToIndex={keyToIndex}
            getTabIndex={getTabIndex}
            setButtonRef={setButtonRef}
          />
        );
      })}

      {!hideFooterHints && <SidebarFooterHints />}
    </nav>
  );
}

const hintBarStyle: React.CSSProperties = {
  marginTop: "auto",
  display: "flex",
  alignItems: "center",
  gap: "12px",
  padding: "8px 8px 4px",
  fontSize: "var(--settera-kbd-font-size, 11px)",
  color:
    "var(--settera-sidebar-muted-foreground, var(--settera-muted-foreground, #9ca3af))",
};

const hintKbdStyle: React.CSSProperties = {
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  minWidth: "16px",
  backgroundColor:
    "var(--settera-kbd-bg, var(--settera-sidebar-accent, rgba(0, 0, 0, 0.05)))",
  border:
    "var(--settera-kbd-border, 1px solid var(--settera-sidebar-border-color, rgba(0, 0, 0, 0.08)))",
  borderRadius: "4px",
  padding: "1px 4px",
  fontSize: "inherit",
  fontFamily: "inherit",
  lineHeight: 1,
  color:
    "var(--settera-kbd-color, var(--settera-sidebar-muted-foreground, #9ca3af))",
};

function SidebarFooterHints() {
  return (
    <div aria-hidden="true" style={hintBarStyle}>
      <span
        style={{ display: "inline-flex", alignItems: "center", gap: "4px" }}
      >
        <kbd style={hintKbdStyle}>/</kbd> Search
      </span>
      <span
        style={{ display: "inline-flex", alignItems: "center", gap: "4px" }}
      >
        <kbd style={hintKbdStyle}>↑↓</kbd> Navigate
      </span>
      <span
        style={{ display: "inline-flex", alignItems: "center", gap: "4px" }}
      >
        <kbd style={hintKbdStyle}>Esc</kbd> Back
      </span>
    </div>
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
  matchingSectionsByPage: Map<string, Set<string>>;
  activeSection: string | null;
  onSectionClick: (pageKey: string, sectionKey: string) => void;
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
  matchingSectionsByPage,
  activeSection,
  onSectionClick,
  keyToIndex,
  getTabIndex,
  setButtonRef,
}: SidebarItemProps) {
  const [isHovered, setIsHovered] = useState(false);
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
  const paddingLeft = 8;

  // During search, filter children to only matching pages
  const visibleChildren = hasChildren
    ? isSearching
      ? page.pages!.filter((child) => matchingPageKeys.has(child.key))
      : page.pages!
    : [];
  const searchableSections =
    (page.sections ?? []).filter(
      (section) => section.key && section.title && section.title.trim().length > 0,
    ) ?? [];
  const matchingSections = matchingSectionsByPage.get(page.key);
  const visibleSectionItems =
    isSearching && searchableSections.length > 1 && matchingSections
      ? searchableSections.filter((section) => matchingSections.has(section.key))
      : [];

  // O(1) lookup via the key→index map instead of O(n) findIndex
  const flatIndex = keyToIndex.get(`page:${page.key}`) ?? -1;

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
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        aria-current={isActive ? "page" : undefined}
        tabIndex={getTabIndex(flatIndex)}
        style={{
          display: "flex",
          alignItems: "center",
          gap: "var(--settera-sidebar-item-gap, 8px)",
          width: "100%",
          minHeight: "var(--settera-sidebar-item-height, 34px)",
          padding: `var(--settera-sidebar-item-padding, 6px 8px)`,
          paddingLeft: `${paddingLeft}px`,
          border: "none",
          borderRadius: "var(--settera-sidebar-item-radius, 8px)",
          background: isActive
            ? "var(--settera-sidebar-active-bg, var(--settera-sidebar-accent, var(--settera-muted, #f4f4f5)))"
            : isHovered
              ? "var(--settera-sidebar-hover-bg, var(--settera-sidebar-accent-hover, #f4f4f5))"
              : "transparent",
          color: isActive
            ? "var(--settera-sidebar-active-color, var(--settera-sidebar-accent-foreground, var(--settera-foreground, #18181b)))"
            : "var(--settera-sidebar-item-color, var(--settera-sidebar-foreground, var(--settera-foreground, #3f3f46)))",
          fontWeight: 500,
          fontSize: "inherit",
          textAlign: "left",
          cursor: "pointer",
          fontFamily: "inherit",
          transition: "background-color 120ms ease, color 120ms ease",
        }}
      >
        {depth === 0 && page.icon && renderIcon && (
          <span
            aria-hidden="true"
            style={{
              width: "16px",
              height: "16px",
              display: "inline-flex",
              alignItems: "center",
              justifyContent: "center",
              color:
                "var(--settera-sidebar-icon-color, var(--settera-sidebar-muted-foreground, var(--settera-muted-foreground, #71717a)))",
              flexShrink: 0,
            }}
          >
            {renderIcon(page.icon)}
          </span>
        )}
        {page.title}
        {hasChildren && (
          <svg
            aria-hidden="true"
            width="16"
            height="16"
            viewBox="0 0 16 16"
            fill="none"
            style={{
              marginLeft: "auto",
              flexShrink: 0,
              color: "var(--settera-sidebar-chevron-color, #9ca3af)",
              transition: "transform 120ms ease",
              transform: isExpanded ? "rotate(90deg)" : "rotate(0deg)",
            }}
          >
            <path
              d="M6 4l4 4-4 4"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        )}
      </button>
      {hasChildren && isExpanded && (
        <div
          role="group"
          style={{
            marginLeft: "var(--settera-sidebar-sub-margin, 16px)",
            paddingLeft: "var(--settera-sidebar-sub-padding, 8px)",
            borderLeft:
              "var(--settera-sidebar-sub-border, 1px solid var(--settera-sidebar-border-color, var(--settera-border, #e4e4e7)))",
            display: "flex",
            flexDirection: "column",
            gap: "var(--settera-sidebar-sub-gap, 1px)",
            paddingTop: "2px",
            paddingBottom: "2px",
          }}
        >
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
              matchingSectionsByPage={matchingSectionsByPage}
              activeSection={activeSection}
              onSectionClick={onSectionClick}
              keyToIndex={keyToIndex}
              getTabIndex={getTabIndex}
              setButtonRef={setButtonRef}
            />
          ))}
        </div>
      )}
      {visibleSectionItems.length > 0 && (
        <div
          role="group"
          aria-label={`${page.title} matching sections`}
          style={{
            marginLeft: "var(--settera-sidebar-sub-margin, 16px)",
            paddingLeft: "var(--settera-sidebar-sub-padding, 8px)",
            borderLeft:
              "var(--settera-sidebar-sub-border, 1px solid var(--settera-sidebar-border-color, var(--settera-border, #e4e4e7)))",
            display: "flex",
            flexDirection: "column",
            gap: "var(--settera-sidebar-sub-gap, 1px)",
            paddingTop: "2px",
            paddingBottom: "2px",
          }}
        >
          {visibleSectionItems.map((section) => {
            const sectionIsActive = isActive && activeSection === section.key;
            const sectionFlatIndex =
              keyToIndex.get(`section:${page.key}:${section.key}`) ?? -1;
            return (
              <button
                key={`${page.key}:${section.key}`}
                ref={(el) => setButtonRef(sectionFlatIndex, el)}
                type="button"
                onClick={() => onSectionClick(page.key, section.key)}
                tabIndex={getTabIndex(sectionFlatIndex)}
                style={{
                  display: "flex",
                  alignItems: "center",
                  width: "100%",
                  minHeight: "var(--settera-sidebar-item-height, 34px)",
                  padding: `var(--settera-sidebar-item-padding, 6px 8px)`,
                  border: "none",
                  borderRadius: "var(--settera-sidebar-item-radius, 8px)",
                  background: sectionIsActive
                    ? "var(--settera-sidebar-active-bg, var(--settera-sidebar-accent, var(--settera-muted, #f4f4f5)))"
                    : "transparent",
                  color: sectionIsActive
                    ? "var(--settera-sidebar-active-color, var(--settera-sidebar-accent-foreground, var(--settera-foreground, #18181b)))"
                    : "var(--settera-sidebar-item-color, var(--settera-sidebar-foreground, var(--settera-foreground, #3f3f46)))",
                  fontWeight: sectionIsActive ? 600 : 500,
                  fontSize: "inherit",
                  textAlign: "left",
                  cursor: "pointer",
                  fontFamily: "inherit",
                }}
              >
                {section.title}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
