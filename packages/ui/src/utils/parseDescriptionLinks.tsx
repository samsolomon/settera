import React from "react";

const LINK_RE = /\[([^\]]+)\]\((https?:\/\/[^)]+)\)/g;

/**
 * Parses markdown-style links in a string, returning React nodes.
 * Only matches `[text](https://...)` with http/https URLs.
 * Returns the original string when no links are found.
 */
export function parseDescriptionLinks(text: string): React.ReactNode {
  const parts: React.ReactNode[] = [];
  let lastIndex = 0;
  let match: RegExpExecArray | null;

  while ((match = LINK_RE.exec(text)) !== null) {
    if (match.index > lastIndex) {
      parts.push(text.slice(lastIndex, match.index));
    }
    parts.push(
      <a
        key={match.index}
        href={match[2]}
        target="_blank"
        rel="noopener noreferrer"
      >
        {match[1]}
      </a>,
    );
    lastIndex = match.index + match[0].length;
  }
  LINK_RE.lastIndex = 0;

  if (parts.length === 0) return text;

  if (lastIndex < text.length) {
    parts.push(text.slice(lastIndex));
  }

  return <>{parts}</>;
}
