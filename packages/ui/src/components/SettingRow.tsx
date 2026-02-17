import React, {
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";
import { useSetteraSetting } from "@settera/react";
import { parseDescriptionLinks } from "../utils/parseDescriptionLinks.js";
import { SetteraDeepLinkContext } from "../contexts/SetteraDeepLinkContext.js";

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
  const deepLinkCtx = useContext(SetteraDeepLinkContext);
  const [isFocusVisible, setIsFocusVisible] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const [isCopyHovered, setIsCopyHovered] = useState(false);
  const [copyFeedback, setCopyFeedback] = useState(false);
  const pointerDownRef = useRef(false);
  const copyTimeoutRef = useRef<ReturnType<typeof setTimeout>>();

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
  const showCopyButton = deepLinkCtx && (isHovered || isFocusVisible);

  return (
    <div
      id={`settera-setting-${settingKey}`}
      role="group"
      aria-label={definition.title}
      tabIndex={-1}
      data-setting-key={settingKey}
      onPointerDown={handlePointerDown}
      onFocus={handleFocus}
      onBlur={handleBlur}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      style={{
        padding: "var(--settera-row-padding-x, 0 16px)",
        opacity: "var(--settera-row-opacity, 1)",
        outline: "none",
        boxShadow: isFocusVisible
          ? "0 0 0 2px var(--settera-focus-ring-color, #93c5fd)"
          : "none",
        borderRadius: "var(--settera-row-focus-radius, 6px)",
      }}
    >
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "flex-start",
          padding: "var(--settera-row-padding-y, 12px 0)",
          borderBottom: isLast
            ? "none"
            : "var(--settera-row-border, 1px solid #e5e7eb)",
        }}
      >
        <div style={{ flex: 1, marginRight: "16px" }}>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "6px",
              fontSize: "var(--settera-title-font-size, 14px)",
              fontWeight: "var(--settera-title-font-weight, 500)",
              color: isDangerous
                ? "var(--settera-dangerous-color, #dc2626)"
                : "var(--settera-title-color, #111827)",
            }}
          >
            {definition.title}
            {saveStatus === "saving" && (
              <span
                aria-label="Saving"
                style={{
                  fontSize: "var(--settera-save-indicator-font-size, 12px)",
                  color: "var(--settera-save-saving-color, #6b7280)",
                }}
              >
                Saving...
              </span>
            )}
            {saveStatus === "saved" && (
              <span
                aria-label="Saved"
                style={{
                  fontSize: "var(--settera-save-indicator-font-size, 12px)",
                  color: "var(--settera-save-saved-color, #16a34a)",
                }}
              >
                Saved
              </span>
            )}
            {saveStatus === "error" && (
              <span
                aria-label="Save failed"
                style={{
                  fontSize: "var(--settera-save-indicator-font-size, 12px)",
                  color: "var(--settera-save-error-color, #dc2626)",
                }}
              >
                Save failed
              </span>
            )}
            {showCopyButton && (
              <button
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
                    ? "var(--settera-ghost-hover-bg, #f4f4f5)"
                    : "transparent",
                  color: isCopyHovered
                    ? "var(--settera-ghost-hover-color, #18181b)"
                    : "var(--settera-copy-link-color, #9ca3af)",
                  cursor: "pointer",
                  width: "24px",
                  height: "24px",
                  borderRadius: "6px",
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
                    stroke="var(--settera-save-saved-color, #16a34a)"
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
              </button>
            )}
          </div>
          {"description" in definition && definition.description && (
            <div
              style={{
                fontSize: "var(--settera-description-font-size, 13px)",
                color: "var(--settera-description-color, #6b7280)",
                marginTop: "2px",
              }}
            >
              {parseDescriptionLinks(definition.description)}
            </div>
          )}
          {"helpText" in definition && definition.helpText && (
            <div
              style={{
                fontSize: "var(--settera-help-font-size, 12px)",
                color: "var(--settera-help-color, #9ca3af)",
                marginTop: "4px",
              }}
            >
              {"ⓘ "}
              {parseDescriptionLinks(definition.helpText)}
            </div>
          )}
          {error && (
            <div
              role="alert"
              id={`settera-error-${settingKey}`}
              style={{
                fontSize: "var(--settera-error-font-size, 13px)",
                color: "var(--settera-error-color, #dc2626)",
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
