"use client";

import React, {
  useContext,
  useEffect,
  useCallback,
  useRef,
  useMemo,
} from "react";
import { SetteraSchemaContext } from "@settera/react";
import { useSetteraNavigation } from "./use-settera-navigation";
import { useSetteraSearch } from "./use-settera-search";
import { useRovingTabIndex } from "@settera/react";
import type { PageDefinition, PageItem } from "@settera/schema";
import { isFlattenedPage, resolvePageKey, isPageGroup, flattenPageItems } from "@settera/schema";
import { ChevronDownIcon, ChevronLeftIcon } from "lucide-react";
import { SetteraSearch } from "./settera-search";
import { Button } from "@/components/ui/button";
import { Kbd } from "@/components/ui/kbd";
import {
  Collapsible,
  CollapsibleContent,
} from "@/components/ui/collapsible";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
  useSidebar,
} from "@/components/ui/sidebar";
import { useSetteraLabels } from "./settera-labels";

export interface SetteraSidebarProps {
  renderIcon?: (iconName: string) => React.ReactNode;
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
  backToApp,
  hideFooterHints,
}: SetteraSidebarProps) {
  const labels = useSetteraLabels();
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
  const { isSearching, matchingPageKeys, matchingSectionsByPage } = useSetteraSearch();
  const { setOpenMobile } = useSidebar();

  if (!schemaCtx) {
    throw new Error("SetteraSidebar must be used within a Settera component.");
  }

  const { schema } = schemaCtx;

  const expandedGroupsRef = useRef(expandedGroups);
  expandedGroupsRef.current = expandedGroups;

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
        const pageKey = resolvePageKey(page);
        setActivePage(pageKey);
        setOpenMobile(false);
      } else if (hasChildren && !hasSections) {
        toggleGroup(page.key);
      } else if (hasChildren && hasSections) {
        setActivePage(page.key);
        toggleGroup(page.key);
        setOpenMobile(false);
      } else {
        setActivePage(page.key);
        setOpenMobile(false);
      }
    },
    [setActivePage, toggleGroup, setOpenMobile],
  );

  const handleChildClick = useCallback(
    (key: string) => {
      setActivePage(key);
      setOpenMobile(false);
    },
    [setActivePage, setOpenMobile],
  );

  const handleChildItemClick = useCallback(
    (e: React.MouseEvent<HTMLElement>) => {
      const isAnchor = e.currentTarget.tagName === "A";
      if (isAnchor && (e.metaKey || e.ctrlKey)) return;
      if (isAnchor) e.preventDefault();
      const childKey = e.currentTarget.dataset.pageKey;
      if (childKey) handleChildClick(childKey);
    },
    [handleChildClick],
  );

  const handleSectionClick = useCallback(
    (pageKey: string, sectionKey: string) => {
      setActivePage(pageKey);
      setActiveSection(sectionKey);
      setOpenMobile(false);
    },
    [setActivePage, setActiveSection, setOpenMobile],
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

    // Unwrap groups to get flat page list for keyboard nav
    const topLevelPages = flattenPageItems(
      isSearching ? visiblePageItems : schema.pages,
    );
    walk(topLevelPages, 0, null);
    return items;
  }, [schema.pages, visiblePageItems, expandedGroups, isSearching, matchingPageKeys]);

  const { focusedIndex, setFocusedIndex, getTabIndex, onKeyDown } =
    useRovingTabIndex({
      itemCount: flatItems.length,
    });

  const buttonRefs = useRef<Map<number, HTMLElement>>(new Map());
  const menuRef = useRef<HTMLUListElement>(null);

  useEffect(() => {
    const menu = menuRef.current;
    if (!menu) return;
    if (!menu.contains(document.activeElement)) return;
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
    (index: number, el: HTMLElement | null) => {
      if (el) {
        buttonRefs.current.set(index, el);
      } else {
        buttonRefs.current.delete(index);
      }
    },
    [],
  );

  function renderPageItems(pages: PageDefinition[]) {
    return pages.map((page) => {
      const flattened = isFlattenedPage(page);
      const hasChildren =
        !flattened && page.pages && page.pages.length > 0;
      const hasSections = page.sections && page.sections.length > 0;
      const isExpanded = isSearching
        ? hasChildren &&
          page.pages!.some((child) =>
            matchingPageKeys.has(child.key),
          )
        : expandedGroups.has(page.key);

      const visibleChildren = hasChildren
        ? isSearching
          ? page.pages!.filter((child) =>
              matchingPageKeys.has(child.key),
            )
          : page.pages!
        : [];

      const isActive = flattened
        ? activePage === resolvePageKey(page)
        : activePage === page.key;
      const searchableSections =
        (page.sections ?? []).filter(
          (section) => section.key && section.title && section.title.trim().length > 0,
        ) ?? [];
      const matchingSections = matchingSectionsByPage.get(page.key);
      const visibleSectionItems =
        isSearching && searchableSections.length > 1 && matchingSections
          ? searchableSections.filter((section) => matchingSections.has(section.key))
          : [];

      const flatIndex = keyToIndex.get(page.key) ?? -1;

      // Compute href for navigable pages (not expand-only parents)
      const isExpandOnly = hasChildren && !hasSections && !flattened;
      const resolvedPageKey = flattened ? resolvePageKey(page) : page.key;
      const href = getPageUrl && !isExpandOnly ? getPageUrl(resolvedPageKey) : undefined;

      const handleItemClick = (e: React.MouseEvent) => {
        // Modifier click on <a> — let browser handle (new tab)
        if (href && (e.metaKey || e.ctrlKey)) return;
        if (href) e.preventDefault();
        handlePageClick(page);
      };

      if (hasChildren) {
        const parentContent = (
          <>
            {page.icon && renderIcon && (
              <span
                aria-hidden="true"
                className="size-4 inline-flex items-center justify-center shrink-0"
              >
                {renderIcon(page.icon)}
              </span>
            )}
            <span className="flex-1 truncate">{page.title}</span>
            <ChevronDownIcon
              aria-hidden="true"
              className="size-4 shrink-0 text-sidebar-accent-foreground/70 transition-transform duration-200"
              style={{ rotate: isExpanded ? "0deg" : "-90deg" }}
            />
          </>
        );

        return (
          <Collapsible
            key={page.key}
            open={isExpanded}
            asChild
          >
            <SidebarMenuItem role="treeitem" aria-expanded={isExpanded}>
              <SidebarMenuButton
                asChild
                isActive={isActive}
              >
                {href ? (
                  <a
                    href={href}
                    ref={(el) => setButtonRef(flatIndex, el)}
                    onClick={handleItemClick}
                    aria-current={isActive ? "page" : undefined}
                    tabIndex={getTabIndex(flatIndex)}
                  >
                    {parentContent}
                  </a>
                ) : (
                  <button
                    ref={(el) => setButtonRef(flatIndex, el)}
                    onClick={handleItemClick}
                    aria-current={isActive ? "page" : undefined}
                    tabIndex={getTabIndex(flatIndex)}
                  >
                    {parentContent}
                  </button>
                )}
              </SidebarMenuButton>
              <CollapsibleContent className="overflow-hidden data-[state=closed]:animate-collapsible-up data-[state=open]:animate-collapsible-down">
                <SidebarMenuSub role="group">
                  {visibleChildren.map((child) => {
                    const childFlattened = isFlattenedPage(child);
                    const childKey = childFlattened
                      ? resolvePageKey(child)
                      : child.key;
                    const childIsActive = activePage === childKey;
                    const childFlatIndex =
                      keyToIndex.get(child.key) ?? -1;
                    const childHref = getPageUrl ? getPageUrl(childKey) : undefined;

                    return (
                      <SidebarMenuSubItem
                        key={child.key}
                        role="treeitem"
                      >
                        <SidebarMenuSubButton
                          asChild
                          isActive={childIsActive}
                        >
                          {childHref ? (
                            <a
                              href={childHref}
                              className="w-full text-left"
                              data-page-key={childKey}
                              ref={(el) =>
                                setButtonRef(childFlatIndex, el)
                              }
                              onClick={handleChildItemClick}
                              aria-current={
                                childIsActive ? "page" : undefined
                              }
                              tabIndex={getTabIndex(childFlatIndex)}
                            >
                              {child.title}
                            </a>
                          ) : (
                            <button
                              className="w-full text-left"
                              data-page-key={childKey}
                              ref={(el) =>
                                setButtonRef(childFlatIndex, el)
                              }
                              onClick={handleChildItemClick}
                              aria-current={
                                childIsActive ? "page" : undefined
                              }
                              tabIndex={getTabIndex(childFlatIndex)}
                            >
                              {child.title}
                            </button>
                          )}
                        </SidebarMenuSubButton>
                      </SidebarMenuSubItem>
                    );
                  })}
                  {visibleSectionItems.map((section) => {
                    const sectionIsActive = isActive && activeSection === section.key;
                    return (
                      <SidebarMenuSubItem
                        key={`${page.key}:${section.key}`}
                        role="treeitem"
                      >
                        <SidebarMenuSubButton
                          asChild
                          isActive={sectionIsActive}
                        >
                          <button
                            className="w-full text-left"
                            onClick={() => handleSectionClick(page.key, section.key)}
                          >
                            {section.title}
                          </button>
                        </SidebarMenuSubButton>
                      </SidebarMenuSubItem>
                    );
                  })}
                </SidebarMenuSub>
              </CollapsibleContent>
            </SidebarMenuItem>
          </Collapsible>
        );
      }

      const leafContent = (
        <>
          {page.icon && renderIcon && (
            <span
              aria-hidden="true"
              className="size-4 inline-flex items-center justify-center shrink-0"
            >
              {renderIcon(page.icon)}
            </span>
          )}
          {page.title}
        </>
      );

      return (
        <SidebarMenuItem key={page.key} role="treeitem">
          <SidebarMenuButton asChild isActive={isActive}>
            {href ? (
              <a
                href={href}
                ref={(el) => setButtonRef(flatIndex, el)}
                onClick={handleItemClick}
                aria-current={isActive ? "page" : undefined}
                tabIndex={getTabIndex(flatIndex)}
              >
                {leafContent}
              </a>
            ) : (
              <button
                ref={(el) => setButtonRef(flatIndex, el)}
                onClick={handleItemClick}
                aria-current={isActive ? "page" : undefined}
                tabIndex={getTabIndex(flatIndex)}
              >
                {leafContent}
              </button>
            )}
          </SidebarMenuButton>
          {visibleSectionItems.length > 0 && (
            <SidebarMenuSub role="group">
              {visibleSectionItems.map((section) => {
                const sectionIsActive = isActive && activeSection === section.key;
                return (
                  <SidebarMenuSubItem
                    key={`${page.key}:${section.key}`}
                    role="treeitem"
                  >
                    <SidebarMenuSubButton
                      asChild
                      isActive={sectionIsActive}
                    >
                      <button
                        className="w-full text-left"
                        onClick={() => handleSectionClick(page.key, section.key)}
                      >
                        {section.title}
                      </button>
                    </SidebarMenuSubButton>
                  </SidebarMenuSubItem>
                );
              })}
            </SidebarMenuSub>
          )}
        </SidebarMenuItem>
      );
    });
  }

  return (
    <Sidebar>
      <SidebarHeader>
        {backToApp && (
          <Button
            variant="ghost"
            size="sm"
            onClick={backToApp.onClick}
            asChild={!backToApp.onClick && backToApp.href ? true : undefined}
            className="-ml-1 justify-start"
          >
            {!backToApp.onClick && backToApp.href ? (
              <a href={backToApp.href}>
                <ChevronLeftIcon className="size-4 mr-1" />
                {backToApp.label ?? labels.backToApp}
              </a>
            ) : (
              <>
                <ChevronLeftIcon className="size-4 mr-1" />
                {backToApp.label ?? labels.backToApp}
              </>
            )}
          </Button>
        )}
        <SetteraSearch />
      </SidebarHeader>

      <SidebarContent>
        <SidebarMenu
          ref={menuRef}
          role="tree"
          aria-label="Settings navigation"
          onKeyDown={handleNavKeyDown}
        >
          {visiblePageItems.map((item) => {
            if (isPageGroup(item)) {
              return (
                <SidebarGroup key={`group-${item.label}`}>
                  <SidebarGroupLabel>{item.label}</SidebarGroupLabel>
                  <SidebarGroupContent>
                    {renderPageItems(item.pages)}
                  </SidebarGroupContent>
                </SidebarGroup>
              );
            }

            return (
              <SidebarGroup key={item.key}>
                <SidebarGroupContent>
                  {renderPageItems([item])}
                </SidebarGroupContent>
              </SidebarGroup>
            );
          })}
        </SidebarMenu>
      </SidebarContent>

      {!hideFooterHints && (
        <SidebarFooter>
          <div
            aria-hidden="true"
            className="hidden md:flex items-center gap-3 px-2 text-[11px] text-muted-foreground"
          >
            <span className="inline-flex items-center gap-1">
              <Kbd>/</Kbd>
              Search
            </span>
            <span className="inline-flex items-center gap-1">
              <Kbd>↑↓</Kbd>
              Navigate
            </span>
            <span className="inline-flex items-center gap-1">
              <Kbd>Esc</Kbd>
              {labels.back}
            </span>
          </div>
        </SidebarFooter>
      )}
    </Sidebar>
  );
}
