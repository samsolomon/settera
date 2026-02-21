"use client";

import React, {
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";
import { useSetteraSetting, parseDescriptionLinks } from "@settera/react";
import type { SaveStatus } from "@settera/react";
import { CheckIcon, LinkIcon } from "lucide-react";
import { SetteraNavigationContext } from "./settera-navigation-provider";
import { SetteraDeepLinkContext } from "./settera-deep-link-context";
import { SetteraSaveIndicator } from "./settera-save-indicator";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useSetteraLabels } from "./settera-labels";

export interface SetteraSettingRowProps {
  settingKey: string;
  isLast?: boolean;
  children: React.ReactNode;
}

function useSaveIndicatorAnimation(saveStatus: SaveStatus) {
  const prevActiveRef = useRef(false);
  const [displayedStatus, setDisplayedStatus] = useState<SaveStatus>("idle");
  const [animClass, setAnimClass] = useState("");
  const fadeTimerRef = useRef<ReturnType<typeof setTimeout>>();

  useEffect(() => {
    clearTimeout(fadeTimerRef.current);

    const isActive = saveStatus === "saving" || saveStatus === "saved";
    const wasActive = prevActiveRef.current;
    prevActiveRef.current = isActive;

    if (isActive) {
      setDisplayedStatus(saveStatus);
      if (!wasActive) {
        // idle → active: fade in
        setAnimClass("animate-in fade-in-0 duration-150");
      } else {
        // saving → saved: no animation, just swap content
        setAnimClass("");
      }
    } else if (wasActive) {
      // active → idle: fade out, then unmount
      setAnimClass("animate-out fade-out-0 duration-150");
      fadeTimerRef.current = setTimeout(() => {
        setDisplayedStatus("idle");
        setAnimClass("");
      }, 150);
    }
  }, [saveStatus]);

  useEffect(() => {
    return () => clearTimeout(fadeTimerRef.current);
  }, []);

  return { displayedStatus, animClass };
}

export function SetteraSettingRow({ settingKey, isLast, children }: SetteraSettingRowProps) {
  const { isVisible, definition, error, saveStatus } =
    useSetteraSetting(settingKey);
  const labels = useSetteraLabels();
  const navigationCtx = useContext(SetteraNavigationContext);
  const highlightedSettingKey = navigationCtx?.highlightedSettingKey ?? null;
  const deepLinkCtx = useContext(SetteraDeepLinkContext);
  const [isFocusVisible, setIsFocusVisible] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const [copyFeedback, setCopyFeedback] = useState(false);
  const pointerDownRef = useRef(false);
  const copyTimeoutRef = useRef<ReturnType<typeof setTimeout>>();

  const isHighlighted = highlightedSettingKey === settingKey;
  const { displayedStatus, animClass } = useSaveIndicatorAnimation(saveStatus);
  const isBadgeShown = displayedStatus !== "idle";

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
  const showCopyButton = !!(deepLinkCtx && !isBadgeShown && (isHovered || isFocusVisible || copyFeedback));

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
          "flex flex-col gap-2 py-3 md:flex-row md:justify-between md:items-center md:gap-0",
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
            {isBadgeShown && (
              <span className={animClass}>
                <SetteraSaveIndicator saveStatus={displayedStatus} />
              </span>
            )}
            {deepLinkCtx && !isBadgeShown && (
              <span className="inline-flex w-6 h-6 shrink-0">
                {showCopyButton && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon-xs"
                    tabIndex={-1}
                    data-settera-copy-link="true"
                    aria-label={labels.copyLink}
                    onClick={handleCopyLink}
                  >
                {copyFeedback ? (
                  <CheckIcon className="size-4" style={{ color: "var(--settera-success-color, #16a34a)" }} />
                ) : (
                  <LinkIcon className="size-4" />
                )}
              </Button>
                )}
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
        <div>{children}</div>
      </div>
      <span aria-live="polite" role="status" className="sr-only">
        {saveStatus === "saving" && labels.saving}
        {saveStatus === "saved" && labels.saved}
        {saveStatus === "error" && labels.saveFailed}
      </span>
    </div>
  );
}
