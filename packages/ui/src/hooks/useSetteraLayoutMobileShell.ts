import { useCallback, useEffect, useRef, useState } from "react";
import type { KeyboardEvent } from "react";

/** @internal SetteraLayout implementation detail; not part of public API. */
export function useSetteraLayoutMobileShell(mobileBreakpoint: number) {
  const menuButtonRef = useRef<HTMLButtonElement>(null);
  const mobileDrawerRef = useRef<HTMLDivElement>(null);

  const [isMobile, setIsMobile] = useState(() => {
    if (typeof window === "undefined") return false;
    return window.innerWidth < mobileBreakpoint;
  });
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);
  const [isMobileNavOpen, setIsMobileNavOpen] = useState(false);

  const openMobileNav = useCallback(() => setIsMobileNavOpen(true), []);
  const closeMobileNav = useCallback(() => setIsMobileNavOpen(false), []);

  // Keep isMobile in sync with viewport width.
  useEffect(() => {
    if (typeof window === "undefined") return;

    const current = window.innerWidth < mobileBreakpoint;
    if (current !== isMobile) {
      setIsMobile(current);
    }

    const onResize = () => {
      const next = window.innerWidth < mobileBreakpoint;
      setIsMobile((prev) => (prev === next ? prev : next));
    };

    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, [mobileBreakpoint, isMobile]);

  useEffect(() => {
    if (typeof window === "undefined" || !window.matchMedia) return;

    const media = window.matchMedia("(prefers-reduced-motion: reduce)");
    const onChange = () => setPrefersReducedMotion(media.matches);

    onChange();
    if (typeof media.addEventListener === "function") {
      media.addEventListener("change", onChange);
      return () => media.removeEventListener("change", onChange);
    }

    media.addListener(onChange);
    return () => media.removeListener(onChange);
  }, []);

  // Close mobile nav when switching to desktop mode.
  useEffect(() => {
    if (!isMobile && isMobileNavOpen) {
      setIsMobileNavOpen(false);
    }
  }, [isMobile, isMobileNavOpen]);

  // Lock background scrolling while the mobile drawer is open.
  useEffect(() => {
    if (typeof document === "undefined") return;
    if (!isMobile || !isMobileNavOpen) return;

    const previousBodyOverflow = document.body.style.overflow;
    const previousHtmlOverflow = document.documentElement.style.overflow;
    document.body.style.overflow = "hidden";
    document.documentElement.style.overflow = "hidden";

    return () => {
      document.body.style.overflow = previousBodyOverflow;
      document.documentElement.style.overflow = previousHtmlOverflow;
    };
  }, [isMobile, isMobileNavOpen]);

  // Focus drawer search on open and restore trigger focus on close.
  useEffect(() => {
    if (!isMobile) return;

    if (isMobileNavOpen) {
      requestAnimationFrame(() => {
        const drawer = mobileDrawerRef.current;
        if (!drawer) return;
        const searchInput = drawer.querySelector<HTMLInputElement>(
          'input[role="searchbox"]',
        );
        const fallback = drawer.querySelector<HTMLElement>("button, a, input");
        if (searchInput) {
          searchInput.focus();
        } else if (fallback) {
          fallback.focus();
        } else {
          drawer.focus();
        }
      });
      return;
    }

    menuButtonRef.current?.focus();
  }, [isMobile, isMobileNavOpen]);

  const handleDrawerKeyDown = useCallback(
    (e: KeyboardEvent<HTMLDivElement>) => {
      if (!isMobileNavOpen) return;
      if (e.key === "Escape") {
        e.preventDefault();
        closeMobileNav();
        return;
      }

      if (e.key !== "Tab") return;
      const drawer = mobileDrawerRef.current;
      if (!drawer) return;

      const focusable = Array.from(
        drawer.querySelectorAll<HTMLElement>(
          'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])',
        ),
      ).filter((el) => {
        if (el.hasAttribute("hidden")) return false;
        const styles = window.getComputedStyle(el);
        return styles.display !== "none" && styles.visibility !== "hidden";
      });

      if (focusable.length === 0) return;

      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      const active = document.activeElement as HTMLElement | null;

      if (!e.shiftKey && active === last) {
        e.preventDefault();
        first.focus();
      } else if (e.shiftKey && active === first) {
        e.preventDefault();
        last.focus();
      }
    },
    [closeMobileNav, isMobileNavOpen],
  );

  const overlayIsVisible = isMobile && isMobileNavOpen;
  const drawerTransition = prefersReducedMotion
    ? "none"
    : "transform 220ms cubic-bezier(0.2, 0.7, 0.2, 1)";
  const overlayTransition = prefersReducedMotion
    ? "none"
    : "opacity 180ms ease";

  return {
    menuButtonRef,
    mobileDrawerRef,
    isMobile,
    prefersReducedMotion,
    isMobileNavOpen,
    openMobileNav,
    closeMobileNav,
    handleDrawerKeyDown,
    overlayIsVisible,
    drawerTransition,
    overlayTransition,
  };
}
