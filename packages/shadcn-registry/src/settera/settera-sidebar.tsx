"use client";

import React, {
  useContext,
  useEffect,
  useCallback,
  useRef,
  useMemo,
  useState,
} from "react";
import { SetteraSchemaContext } from "@settera/react";
import { useSetteraNavigation } from "./use-settera-navigation";
import { useSetteraSearch } from "./use-settera-search";
import { useRovingTabIndex } from "./use-roving-tab-index";
import type { PageDefinition } from "@settera/schema";
import { isFlattenedPage, resolvePageKey } from "@settera/schema";
import { SetteraSearch } from "./settera-search";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export interface SetteraSidebarProps {
  renderIcon?: (iconName: string) => React.ReactNode;
  onNavigate?: (pageKey: string) => void;
  backToApp?: {
    label?: string;
    href?: string;
    onClick?: () => void;
  };
  hideFooterHints?: boolean;
}

interface FlatItem {
  page: PageDefinition;
  depth: number;
  parentKey: string | null;
}

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
    expandedGroups,
    toggleGroup,
    requestFocusContent,
  } = useSetteraNavigation();
  const { isSearching, matchingPageKeys } = useSetteraSearch();

  if (!schemaCtx) {
    throw new Error("SetteraSidebar must be used within a Settera component.");
  }

  const { schema } = schemaCtx;

  const expandedGroupsRef = useRef(expandedGroups);
  expandedGroupsRef.current = expandedGroups;

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
        const pageKey = resolvePageKey(page);
        setActivePage(pageKey);
        onNavigate?.(pageKey);
      } else if (hasChildren && !hasSections) {
        toggleGroup(page.key);
      } else if (hasChildren && hasSections) {
        setActivePage(page.key);
        toggleGroup(page.key);
      } else {
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

  const filterPages = useCallback(
    (pages: PageDefinition[]): PageDefinition[] => {
      if (!isSearching) return pages;
      return pages.filter((page) => matchingPageKeys.has(page.key));
    },
    [isSearching, matchingPageKeys],
  );

  const visiblePages = filterPages(schema.pages);

  const flatItems = useMemo(() => {
    const items: FlatItem[] = [];

    function walk(
      pages: PageDefinition[],
      depth: number,
      parentKey: string | null,
    ) {
      for (const page of pages) {
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

  const buttonRefs = useRef<Map<number, HTMLButtonElement>>(new Map());
  const navRef = useRef<HTMLElement>(null);

  useEffect(() => {
    const nav = navRef.current;
    if (!nav) return;
    if (!nav.contains(document.activeElement)) return;
    const btn = buttonRefs.current.get(focusedIndex);
    if (btn && document.activeElement !== btn) {
      btn.focus();
    }

    const item = flatItemsRef.current[focusedIndex];
    if (item) {
      const { page } = item;
      const hasChildren =
        !isFlattenedPage(page) && page.pages && page.pages.length > 0;
      const hasSections = page.sections && page.sections.length > 0;

      if (hasChildren && !hasSections && !isFlattenedPage(page)) return;

      const pageKey = isFlattenedPage(page) ? resolvePageKey(page) : page.key;
      setActivePage(pageKey);
    }
  }, [focusedIndex, setActivePage]);

  const keyToIndex = useMemo(() => {
    const map = new Map<string, number>();
    flatItems.forEach((item, i) => map.set(item.page.key, i));
    return map;
  }, [flatItems]);

  const focusedIndexRef = useRef(focusedIndex);
  focusedIndexRef.current = focusedIndex;
  const flatItemsRef = useRef(flatItems);
  flatItemsRef.current = flatItems;
  const onKeyDownRef = useRef(onKeyDown);
  onKeyDownRef.current = onKeyDown;

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
          e.preventDefault();
          toggleGroup(page.key);
        } else if (hasChildren && isExpanded) {
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
          e.preventDefault();
          toggleGroup(page.key);
        } else if (parentKey) {
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
        const isExpandOnly =
          hasChildren &&
          !(page.sections && page.sections.length > 0) &&
          !isFlattenedPage(page);
        if (isExpandOnly) {
          toggleGroup(page.key);
        } else {
          requestFocusContent();
        }
        return;
      }

      onKeyDownRef.current(e);
    },
    [toggleGroup, keyToIndex, setFocusedIndex, requestFocusContent],
  );

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
      className="w-[280px] border-r bg-muted/30 text-sm p-3 overflow-y-auto flex flex-col gap-2.5"
    >
      {backToApp && (
        <div className="mb-0">
          <Button
            variant="ghost"
            size="sm"
            onClick={backToApp.onClick}
            asChild={!backToApp.onClick && backToApp.href ? true : undefined}
            className="-ml-2"
          >
            {!backToApp.onClick && backToApp.href ? (
              <a href={backToApp.href}>
                <svg
                  width="16"
                  height="16"
                  viewBox="0 0 16 16"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="mr-1"
                >
                  <path d="M10 12L6 8l4-4" />
                </svg>
                {backToApp.label ?? "Back to app"}
              </a>
            ) : (
              <>
                <svg
                  width="16"
                  height="16"
                  viewBox="0 0 16 16"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="mr-1"
                >
                  <path d="M10 12L6 8l4-4" />
                </svg>
                {backToApp.label ?? "Back to app"}
              </>
            )}
          </Button>
        </div>
      )}

      <SetteraSearch />

      <div
        aria-hidden="true"
        className="text-[11px] tracking-wider uppercase text-muted-foreground font-semibold px-2"
      >
        Navigation
      </div>

      <div className="flex flex-col gap-0.5">
        {visiblePages.map((page) => (
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
            keyToIndex={keyToIndex}
            getTabIndex={getTabIndex}
            setButtonRef={setButtonRef}
          />
        ))}
      </div>

      {!hideFooterHints && (
        <div
          aria-hidden="true"
          className="mt-auto flex items-center gap-3 px-2 pt-2 text-[11px] text-muted-foreground"
        >
          <span className="inline-flex items-center gap-1">
            <kbd className="inline-flex items-center justify-center min-w-[16px] rounded bg-muted border border-border px-1 text-[11px] leading-none">/</kbd>
            Search
          </span>
          <span className="inline-flex items-center gap-1">
            <kbd className="inline-flex items-center justify-center min-w-[16px] rounded bg-muted border border-border px-1 text-[11px] leading-none">↑↓</kbd>
            Navigate
          </span>
          <span className="inline-flex items-center gap-1">
            <kbd className="inline-flex items-center justify-center min-w-[16px] rounded bg-muted border border-border px-1 text-[11px] leading-none">Esc</kbd>
            Back
          </span>
        </div>
      )}
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
  const isExpanded = isSearching
    ? hasChildren &&
      page.pages!.some((child) => matchingPageKeys.has(child.key))
    : expandedGroups.has(page.key);

  const visibleChildren = hasChildren
    ? isSearching
      ? page.pages!.filter((child) => matchingPageKeys.has(child.key))
      : page.pages!
    : [];

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
        className={cn(
          "flex items-center gap-2 w-full min-h-[34px] px-2 py-1.5 border-none rounded-lg text-sm font-medium text-left cursor-pointer transition-colors",
          isActive
            ? "bg-accent text-accent-foreground"
            : "hover:bg-accent/50 text-foreground/80",
        )}
      >
        {depth === 0 && page.icon && renderIcon && (
          <span
            aria-hidden="true"
            className="w-4 h-4 inline-flex items-center justify-center text-muted-foreground shrink-0"
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
            className={cn(
              "ml-auto shrink-0 text-muted-foreground transition-transform duration-150",
              isExpanded && "rotate-90",
            )}
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
          className="ml-4 pl-2 border-l flex flex-col gap-px py-0.5"
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
