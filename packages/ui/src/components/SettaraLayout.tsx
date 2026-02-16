import React from "react";
import { SettaraSidebar } from "./SettaraSidebar.js";
import { SettaraPage } from "./SettaraPage.js";

export interface SettaraLayoutProps {
  renderIcon?: (iconName: string) => React.ReactNode;
  children?: React.ReactNode;
}

/**
 * Two-column layout shell: sidebar navigation + content area.
 * When children are provided, they replace the auto-rendered SettaraPage.
 */
export function SettaraLayout({ renderIcon, children }: SettaraLayoutProps) {
  return (
    <div
      style={{
        display: "flex",
        height: "100%",
        fontFamily:
          '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
      }}
    >
      <SettaraSidebar renderIcon={renderIcon} />
      <main
        style={{
          flex: 1,
          padding: "var(--settara-page-padding, 24px 32px)",
          overflowY: "auto",
        }}
      >
        <div
          style={{
            maxWidth: "var(--settara-content-max-width, 640px)",
          }}
        >
          {children ?? <SettaraPage />}
        </div>
      </main>
    </div>
  );
}
