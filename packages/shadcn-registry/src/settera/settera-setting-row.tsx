"use client";

import React, {
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";
import { useSetteraSetting, parseDescriptionLinks } from "@settera/react";
import { SetteraNavigationContext } from "./settera-navigation-provider";
import type { SetteraDeepLinkContextValue } from "./use-settera-layout-url-sync";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

// Deep link context is provided by SetteraLayout — optional
import { createContext } from "react";
export const SetteraDeepLinkContext =
  createContext<SetteraDeepLinkContextValue | null>(null);

export interface SetteraSettingRowProps {
  settingKey: string;
  isLast?: boolean;
  children: React.ReactNode;
}

export function SetteraSettingRow({ settingKey, isLast, children }: SetteraSettingRowProps) {
  const { isVisible, definition, error, saveStatus } =
    useSetteraSetting(settingKey);
  const navigationCtx = useContext(SetteraNavigationContext);
  const highlightedSettingKey = navigationCtx?.highlightedSettingKey ?? null;
  const deepLinkCtx = useContext(SetteraDeepLinkContext);
  const [isFocusVisible, setIsFocusVisible] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const [copyFeedback, setCopyFeedback] = useState(false);
  const pointerDownRef = useRef(false);
  const copyTimeoutRef = useRef<ReturnType<typeof setTimeout>>();

  const isHighlighted = highlightedSettingKey === settingKey;

  const handlePointerDown = useCallback(() => {
    pointerDownRef.current = true;
  }, []);

  const handleFocus = useCallback((e: React.FocusEvent<HTMLDivElement>) => {
    if (e.target === e.currentTarget) {
      setIsFocusVisible(!pointerDownRef.current);
    }
    pointerDownRef.current = false;
  }, []);

  const handleBlur = useCallback((e: React.FocusEvent<HTMLDivElement>) => {
    if (e.currentTarget.contains(e.relatedTarget as Node)) return;
    setIsFocusVisible(false);
  }, []);

  const handleCopyLink = useCallback(async () => {
    if (!deepLinkCtx) return;
    if (!navigator.clipboard?.writeText) return;

    const url = deepLinkCtx.getSettingUrl(settingKey);
    try {
      await navigator.clipboard.writeText(url);
      setCopyFeedback(true);
      clearTimeout(copyTimeoutRef.current);
      copyTimeoutRef.current = setTimeout(() => setCopyFeedback(false), 2000);
    } catch {
      // Clipboard write failed
    }
  }, [deepLinkCtx, settingKey]);

  useEffect(() => {
    return () => clearTimeout(copyTimeoutRef.current);
  }, []);

  if (!isVisible) return null;

  const isDangerous = "dangerous" in definition && definition.dangerous;
  const isDisabled = "disabled" in definition && definition.disabled;
  const showCopyButton = !!(deepLinkCtx && (isHovered || isFocusVisible || copyFeedback));

  return (
    <div
      id={`settera-setting-${settingKey}`}
      role="group"
      aria-label={definition.title}
      aria-disabled={isDisabled || undefined}
      tabIndex={-1}
      data-setting-key={settingKey}
      onPointerDown={handlePointerDown}
      onFocus={handleFocus}
      onBlur={handleBlur}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      className={cn(
        "outline-none rounded-lg px-4",
        isDisabled && "opacity-50",
        isHighlighted && "ring-2 ring-amber-400",
        isFocusVisible && !isHighlighted && "ring-2 ring-ring",
      )}
    >
      <div
        className={cn(
          "flex flex-col gap-2 py-3 md:flex-row md:justify-between md:items-start md:gap-0",
          !isLast && "border-b",
        )}
      >
        <div className="flex-1 md:mr-4">
          <div className="flex items-center gap-1.5 min-h-[24px]">
            <span
              className={cn(
                "text-sm font-medium leading-6",
                isDangerous && "text-destructive",
              )}
            >
              {definition.title}
            </span>
            {deepLinkCtx && (
              <span className="inline-flex w-6 h-6 shrink-0">
                {showCopyButton && (
                  <Button
                    type="button"
                    variant="outline"
                    size="icon-xs"
                    tabIndex={-1}
                    data-settera-copy-link="true"
                    aria-label="Copy link to setting"
                    onClick={handleCopyLink}
                  >
                {copyFeedback ? (
                  <svg
                    width="14"
                    height="14"
                    viewBox="0 0 16 16"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className="text-green-600"
                  >
                    <path d="M3 8.5l3.5 3.5L13 4" />
                  </svg>
                ) : (
                  <svg
                    width="14"
                    height="14"
                    viewBox="0 0 16 16"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d="M6.5 8.5a3 3 0 0 0 4.243 0l2-2a3 3 0 0 0-4.243-4.243l-1 1" />
                    <path d="M9.5 7.5a3 3 0 0 0-4.243 0l-2 2a3 3 0 0 0 4.243 4.243l1-1" />
                  </svg>
                )}
              </Button>
                )}
              </span>
            )}
            {saveStatus === "saving" && (
              <span className="text-xs text-muted-foreground font-normal">
                Saving...
              </span>
            )}
            {saveStatus === "saved" && (
              <span className="text-xs text-green-600 font-normal">Saved</span>
            )}
            {saveStatus === "error" && (
              <span className="text-xs text-destructive font-normal">
                Save failed
              </span>
            )}
          </div>
          {"description" in definition && definition.description && (
            <div className="mt-0.5 text-sm text-muted-foreground">
              {parseDescriptionLinks(definition.description)}
            </div>
          )}

          {error && (
            <div
              role="alert"
              id={`settera-error-${settingKey}`}
              className="mt-1 text-sm text-destructive"
            >
              {error}
            </div>
          )}
        </div>
        <div className="md:pt-0.5">{children}</div>
      </div>
    </div>
  );
}
