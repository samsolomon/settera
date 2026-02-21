import React, {
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";
import { useSetteraSetting, parseDescriptionLinks } from "@settera/react";
import { token } from "@settera/schema";
import { SetteraNavigationContext } from "../contexts/SetteraNavigationContext.js";
import { SetteraDeepLinkContext } from "../contexts/SetteraDeepLinkContext.js";
import { PrimitiveButton } from "./SetteraPrimitives.js";
import { descriptionTextStyle } from "./SetteraFieldPrimitives.js";

export interface SettingRowProps {
  settingKey: string;
  /** When true, suppresses the bottom border (last item in a card). */
  isLast?: boolean;
  children: React.ReactNode;
}

/**
 * Wraps a setting control with title, description, error display, and visibility logic.
 * Hides itself when `isVisible` is false.
 */
export function SettingRow({ settingKey, isLast, children }: SettingRowProps) {
  const { isVisible, definition, error, saveStatus } =
    useSetteraSetting(settingKey);
  const navigationCtx = useContext(SetteraNavigationContext);
  const highlightedSettingKey = navigationCtx?.highlightedSettingKey ?? null;
  const deepLinkCtx = useContext(SetteraDeepLinkContext);
  const [isFocusVisible, setIsFocusVisible] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const [isCopyHovered, setIsCopyHovered] = useState(false);
  const [copyFeedback, setCopyFeedback] = useState(false);
  const pointerDownRef = useRef(false);
  const copyTimeoutRef = useRef<ReturnType<typeof setTimeout>>();

  const isHighlighted = highlightedSettingKey === settingKey;

  const handlePointerDown = useCallback(() => {
    pointerDownRef.current = true;
  }, []);

  const handleFocus = useCallback((e: React.FocusEvent<HTMLDivElement>) => {
    // Only show focus ring when the card itself is focused, not a child
    if (e.target === e.currentTarget) {
      setIsFocusVisible(!pointerDownRef.current);
    }
    pointerDownRef.current = false;
  }, []);

  const handleBlur = useCallback((e: React.FocusEvent<HTMLDivElement>) => {
    // Don't clear focus ring when focus moves to a child within the card
    if (e.currentTarget.contains(e.relatedTarget as Node)) return;
    setIsFocusVisible(false);
  }, []);

  const handleMouseEnter = useCallback(() => setIsHovered(true), []);
  const handleMouseLeave = useCallback(() => setIsHovered(false), []);

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
      // Clipboard write failed (permissions denied, insecure context, etc.).
    }
  }, [deepLinkCtx, settingKey]);

  // Clean up copy feedback timer on unmount.
  useEffect(() => {
    return () => clearTimeout(copyTimeoutRef.current);
  }, []);

  if (!isVisible) return null;

  const isDangerous = "dangerous" in definition && definition.dangerous;
  const isDisabled = "disabled" in definition && definition.disabled;
  const showCopyButton = deepLinkCtx && (isHovered || isFocusVisible);

  const boxShadow = isHighlighted
    ? `0 0 0 2px ${token("highlight-color")}`
    : isFocusVisible
      ? `0 0 0 2px ${token("focus-ring-color")}`
      : "none";

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
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      style={{
        padding: token("row-padding-inline"),
        opacity: isDisabled ? token("disabled-opacity") : token("row-opacity"),
        outline: "none",
        boxShadow,
        borderRadius: token("row-focus-radius"),
        transition: isHighlighted ? "box-shadow 300ms ease" : undefined,
      }}
    >
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "flex-start",
          padding: token("row-padding-block"),
          borderBottom: isLast
            ? "none"
            : token("row-border"),
        }}
      >
        <div style={{ flex: 1, marginRight: "16px" }}>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "6px",
              minHeight: "24px",
              fontSize: token("title-font-size"),
              fontWeight: token("title-font-weight"),
              color: isDangerous
                ? token("dangerous-color")
                : token("title-color"),
            }}
          >
            {definition.title}
            {showCopyButton && (
              <PrimitiveButton
                type="button"
                tabIndex={-1}
                data-settera-copy-link
                aria-label="Copy link to setting"
                onClick={handleCopyLink}
                onMouseEnter={() => setIsCopyHovered(true)}
                onMouseLeave={() => setIsCopyHovered(false)}
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  justifyContent: "center",
                  border: "none",
                  background: isCopyHovered
                    ? token("ghost-hover-bg")
                    : "transparent",
                  color: isCopyHovered
                    ? token("ghost-hover-color")
                    : token("copy-link-color"),
                  cursor: "pointer",
                  width: "24px",
                  height: "24px",
                  borderRadius: token("button-border-radius"),
                  padding: 0,
                  flexShrink: 0,
                }}
              >
                {copyFeedback ? (
                  <svg
                    width="14"
                    height="14"
                    viewBox="0 0 16 16"
                    fill="none"
                    stroke={token("save-saved-color")}
                    strokeWidth="1.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    aria-hidden="true"
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
                    aria-hidden="true"
                  >
                    <path d="M6.5 8.5a3 3 0 0 0 4.243 0l2-2a3 3 0 0 0-4.243-4.243l-1 1" />
                    <path d="M9.5 7.5a3 3 0 0 0-4.243 0l-2 2a3 3 0 0 0 4.243 4.243l1-1" />
                  </svg>
                )}
              </PrimitiveButton>
            )}
            {saveStatus === "saving" && (
              <span
                aria-label="Saving"
                style={{
                  fontSize: token("save-indicator-font-size"),
                  color: token("save-saving-color"),
                  fontWeight: 400,
                }}
              >
                Saving...
              </span>
            )}
            {saveStatus === "saved" && (
              <span
                aria-label="Saved"
                style={{
                  fontSize: token("save-indicator-font-size"),
                  color: token("save-saved-color"),
                  fontWeight: 400,
                }}
              >
                Saved
              </span>
            )}
            {saveStatus === "error" && (
              <span
                aria-label="Save failed"
                style={{
                  fontSize: token("save-indicator-font-size"),
                  color: token("save-error-color"),
                  fontWeight: 400,
                }}
              >
                Save failed
              </span>
            )}
          </div>
          {"description" in definition && definition.description && (
            <div
              style={{
                ...descriptionTextStyle,
                marginTop: "2px",
              }}
            >
              {parseDescriptionLinks(definition.description)}
            </div>
          )}

          {error && (
            <div
              role="alert"
              id={`settera-error-${settingKey}`}
              style={{
                fontSize: token("error-font-size"),
                color: token("error-color"),
                marginTop: "4px",
              }}
            >
              {error}
            </div>
          )}
        </div>
        <div style={{ paddingTop: "2px" }}>{children}</div>
      </div>
    </div>
  );
}
