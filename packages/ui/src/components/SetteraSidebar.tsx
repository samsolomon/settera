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
import { isFlattenedPage, resolvePageKey, isPageGroup, flattenPageItems, token } from "@settera/schema";
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
    getPageUrl,
  } = useSetteraNavigation();
  const { isSearching, matchingPageKeys, matchingSectionsByPage, setQuery } = useSetteraSearch();

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
        setQuery("");
        const pageKey = resolvePageKey(page);
        setActivePage(pageKey);
        onNavigate?.(pageKey);
      } else if (hasChildren && !hasSections) {
        // Parent with only children — just toggle expand
        toggleGroup(page.key);
      } else if (hasChildren && hasSections) {
        // Parent with own sections + children — navigate AND toggle
        setQuery("");
        setActivePage(page.key);
        toggleGroup(page.key);
      } else {
        // Leaf page — just navigate
        setQuery("");
        setActivePage(page.key);
        onNavigate?.(page.key);
      }
    },
    [setActivePage, toggleGroup, onNavigate, setQuery],
  );

  const handleChildClick = useCallback(
    (key: string) => {
      setQuery("");
      setActivePage(key);
      onNavigate?.(key);
    },
    [setActivePage, onNavigate, setQuery],
  );

  const handleSectionClick = useCallback(
    (pageKey: string, sectionKey: string) => {
      setQuery("");
      setActivePage(pageKey);
      setActiveSection(sectionKey);
      onNavigate?.(pageKey);
    },
    [onNavigate, setActivePage, setActiveSection, setQuery],
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

  // Ref map for interactive elements (keyed by flat index)
  const buttonRefs = useRef<Map<number, HTMLElement>>(new Map());

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
          setQuery("");
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
          setQuery("");
          requestFocusContent();
        }
        return;
      }

      // Delegate to roving tabindex for ArrowUp/Down/Home/End
      onKeyDownRef.current(e);
    },
    [toggleGroup, keyToIndex, setFocusedIndex, requestFocusContent, setQuery],
  );

  // Ref callback factory for storing element refs
  const setButtonRef = useCallback(
    (index: number, el: HTMLElement | null) => {
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
        width: token("sidebar-width"),
        backgroundColor: token("sidebar-bg"),
        borderRight: token("sidebar-border"),
        fontSize: token("sidebar-font-size"),
        padding: token("sidebar-padding"),
        overflowY: "auto",
        display: "flex",
        flexDirection: "column",
        gap: token("sidebar-gap"),
      }}
    >
      {backToApp && (
        <div
          style={{
            marginBottom: token("sidebar-back-margin-bottom"),
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
                  color: token("sidebar-group-color"),
                  fontWeight: 600,
                  padding: "2px 8px",
                  marginTop: idx === 0 ? undefined : token("sidebar-group-spacing"),
                }}
              >
                {item.label}
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: token("sidebar-item-list-gap") }}>
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
                    getPageUrl={getPageUrl}
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
            getPageUrl={getPageUrl}
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
  fontSize: token("kbd-font-size"),
  color: token("sidebar-muted-foreground"),
};

const hintKbdStyle: React.CSSProperties = {
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  minWidth: "16px",
  backgroundColor: token("kbd-bg"),
  border: token("kbd-border"),
  borderRadius: "4px",
  padding: "1px 4px",
  fontSize: "inherit",
  fontFamily: "inherit",
  lineHeight: 1,
  color: token("kbd-color"),
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
  setButtonRef: (index: number, el: HTMLElement | null) => void;
  getPageUrl?: (pageKey: string) => string;
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
  getPageUrl,
}: SidebarItemProps) {
  const [isHovered, setIsHovered] = useState(false);
  const flattened = isFlattenedPage(page);
  const isActive = flattened
    ? activePage === resolvePageKey(page)
    : activePage === page.key;
  const hasChildren = !flattened && page.pages && page.pages.length > 0;
  const hasSections = page.sections && page.sections.length > 0;
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

  // Compute href for navigable pages (not expand-only parents)
  const isExpandOnly = hasChildren && !hasSections && !flattened;
  const resolvedPageKey = flattened ? resolvePageKey(page) : page.key;
  const href = getPageUrl && !isExpandOnly ? getPageUrl(resolvedPageKey) : undefined;

  const handleItemClick = (e: React.MouseEvent) => {
    // Modifier click on <a> — let browser handle (new tab)
    if (href && (e.metaKey || e.ctrlKey)) return;
    if (href) e.preventDefault();
    if (depth === 0) {
      onPageClick(page);
    } else {
      onChildClick(resolvedPageKey);
    }
  };

  const itemStyle: React.CSSProperties = {
    display: "flex",
    alignItems: "center",
    gap: token("sidebar-item-gap"),
    width: "100%",
    minHeight: token("sidebar-item-height"),
    padding: token("sidebar-item-padding"),
    paddingLeft: `${paddingLeft}px`,
    border: "none",
    borderRadius: token("sidebar-item-radius"),
    background: isActive
      ? token("sidebar-active-bg")
      : isHovered
        ? token("sidebar-hover-bg")
        : "transparent",
    color: isActive
      ? token("sidebar-active-color")
      : token("sidebar-item-color"),
    fontWeight: 500,
    fontSize: "inherit",
    textAlign: "left",
    cursor: "pointer",
    fontFamily: "inherit",
    transition: "background-color 120ms ease, color 120ms ease",
    textDecoration: "none",
  };

  const itemContent = (
    <>
      {page.icon && renderIcon && (
        <span
          aria-hidden="true"
          style={{
            width: "16px",
            height: "16px",
            display: "inline-flex",
            alignItems: "center",
            justifyContent: "center",
            color: token("sidebar-icon-color"),
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
            color: token("sidebar-chevron-color"),
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
    </>
  );

  return (
    <div role="treeitem" aria-expanded={hasChildren ? isExpanded : undefined}>
      {href ? (
        <a
          href={href}
          ref={(el) => setButtonRef(flatIndex, el)}
          onClick={handleItemClick}
          onMouseEnter={() => setIsHovered(true)}
          onMouseLeave={() => setIsHovered(false)}
          aria-current={isActive ? "page" : undefined}
          tabIndex={getTabIndex(flatIndex)}
          style={itemStyle}
        >
          {itemContent}
        </a>
      ) : (
        <button
          ref={(el) => setButtonRef(flatIndex, el)}
          onClick={handleItemClick}
          onMouseEnter={() => setIsHovered(true)}
          onMouseLeave={() => setIsHovered(false)}
          aria-current={isActive ? "page" : undefined}
          tabIndex={getTabIndex(flatIndex)}
          style={itemStyle}
        >
          {itemContent}
        </button>
      )}
      {hasChildren && isExpanded && (
        <div
          role="group"
          style={{
            marginLeft: token("sidebar-sub-margin"),
            paddingLeft: token("sidebar-sub-padding"),
            borderLeft: token("sidebar-sub-border"),
            display: "flex",
            flexDirection: "column",
            gap: token("sidebar-sub-gap"),
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
              getPageUrl={getPageUrl}
            />
          ))}
        </div>
      )}
      {visibleSectionItems.length > 0 && (
        <div
          role="group"
          aria-label={`${page.title} matching sections`}
          style={{
            marginLeft: token("sidebar-sub-margin"),
            paddingLeft: token("sidebar-sub-padding"),
            borderLeft: token("sidebar-sub-border"),
            display: "flex",
            flexDirection: "column",
            gap: token("sidebar-sub-gap"),
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
                  minHeight: token("sidebar-item-height"),
                  padding: token("sidebar-item-padding"),
                  border: "none",
                  borderRadius: token("sidebar-item-radius"),
                  background: sectionIsActive
                    ? token("sidebar-active-bg")
                    : "transparent",
                  color: sectionIsActive
                    ? token("sidebar-active-color")
                    : token("sidebar-item-color"),
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
