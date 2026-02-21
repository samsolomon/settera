import { useState, useCallback, useEffect, useMemo } from "react";
import { SCHEMA_VERSION } from "@settera/schema";
import { Settera, SetteraNavigation } from "@settera/react";
import { SetteraLayout as ShadcnSetteraLayout } from "@/components/settera/settera-layout";
import { SetteraLayout as UiSetteraLayout } from "@settera/ui";
import { demoSchema } from "../../test-app/src/schema.js";
import {
  UsersPage,
  ProfilePictureSetting,
  AdvancedExportPage,
} from "./custom-renderers.js";
import { HeadlessView } from "./headless-view.js";
import { getSetteraThemeVars } from "./ui-theme.js";
import {
  CreditCardIcon,
  PaletteIcon,
  ShieldIcon,
  UserIcon,
  UsersIcon,
  ZapIcon,
} from "lucide-react";
import type { ReactNode } from "react";

const ICON_MAP: Record<string, ReactNode> = {
  user: <UserIcon className="size-4" />,
  users: <UsersIcon className="size-4" />,
  shield: <ShieldIcon className="size-4" />,
  zap: <ZapIcon className="size-4" />,
  palette: <PaletteIcon className="size-4" />,
  "credit-card": <CreditCardIcon className="size-4" />,
};

function renderIcon(name: string): ReactNode {
  return ICON_MAP[name] ?? null;
}

type DemoMode = "schema" | "headless" | "ui" | "shadcn";

const MODE_QUERY_PARAM = "mode";

const MODES: Array<{ key: DemoMode; label: string }> = [
  { key: "schema", label: "Schema" },
  { key: "headless", label: "Headless" },
  { key: "ui", label: "UI" },
  { key: "shadcn", label: "shadcn" },
];

function readModeFromUrl(): DemoMode {
  if (typeof window === "undefined") return "shadcn";
  const mode = new URL(window.location.href).searchParams.get(MODE_QUERY_PARAM);
  if (mode === "schema" || mode === "headless" || mode === "ui" || mode === "shadcn") return mode;
  return "shadcn";
}

export function App() {
  const [mode, setMode] = useState<DemoMode>(readModeFromUrl);
  const [isDark, setIsDark] = useState(false);
  const [values, setValues] = useState<Record<string, unknown>>({
    "profile.email": { address: "bob@example.com" },
  });

  useEffect(() => {
    document.documentElement.classList.toggle("dark", isDark);
  }, [isDark]);

  // Sync mode to URL
  useEffect(() => {
    const url = new URL(window.location.href);
    if (mode === "shadcn") {
      url.searchParams.delete(MODE_QUERY_PARAM);
    } else {
      url.searchParams.set(MODE_QUERY_PARAM, mode);
    }
    window.history.replaceState({}, "", url.toString());
  }, [mode]);

  const uiThemeVars = useMemo(() => getSetteraThemeVars(isDark), [isDark]);

  const handleChange = useCallback((key: string, value: unknown) => {
    setValues((prev) => ({ ...prev, [key]: value }));
    return new Promise<void>((resolve) => setTimeout(resolve, 800));
  }, []);

  const handleAction = useCallback((key: string, payload?: unknown) => {
    switch (key) {
      case "actions.export": {
        const config =
          typeof payload === "object" && payload !== null
            ? (payload as Record<string, unknown>)
            : {};
        return new Promise<void>((r) => setTimeout(r, 1500)).then(() => {
          console.info(
            `[shadcn-test-app] Data export started (${String(config.format ?? "json")}, include private: ${String(config.includePrivate ?? false)}).`,
          );
        });
      }
      case "actions.clearCache":
        console.info("[shadcn-test-app] Cache cleared!");
        return;
      case "actions.inviteTeam": {
        const data =
          typeof payload === "object" && payload !== null
            ? (payload as Record<string, unknown>)
            : {};
        return new Promise<void>((r) => setTimeout(r, 1200)).then(() => {
          console.info(
            `[shadcn-test-app] Invites queued (${String(data.seatCount ?? 0)} seats, ${Array.isArray(data.emails) ? data.emails.length : 0} email targets).`,
          );
        });
      }
      case "actions.account.login": {
        const creds =
          typeof payload === "object" && payload !== null
            ? (payload as Record<string, unknown>)
            : {};
        return new Promise<void>((r) => setTimeout(r, 1000)).then(() => {
          console.info(
            `[shadcn-test-app] Login attempted (email: ${String(creds.email ?? "")}).`,
          );
        });
      }
      case "actions.account.signup":
        return new Promise<void>((r) => setTimeout(r, 800)).then(() => {
          console.info("[shadcn-test-app] Sign up flow started.");
        });
      case "actions.deleteAccount":
        return new Promise<void>((r) => setTimeout(r, 2000)).then(() => {
          console.info("[shadcn-test-app] Account deleted (just kidding).");
        });
      case "actions.importData": {
        const importConfig =
          typeof payload === "object" && payload !== null
            ? (payload as Record<string, unknown>)
            : {};
        return new Promise<void>((r) => setTimeout(r, 1000)).then(() => {
          console.info(
            `[shadcn-test-app] Import started (source: ${String(importConfig.source ?? "csv")}, overwrite: ${String(importConfig.overwrite ?? false)}, dryRun: ${String(importConfig.dryRun ?? true)}).`,
          );
        });
      }
      case "actions.advancedExport": {
        const exportConfig =
          typeof payload === "object" && payload !== null
            ? (payload as Record<string, unknown>)
            : {};
        return new Promise<void>((r) => setTimeout(r, 1500)).then(() => {
          console.info(
            `[shadcn-test-app] Advanced export (format: ${String(exportConfig.format ?? "json")}, attachments: ${String(exportConfig.includeAttachments ?? false)}).`,
          );
        });
      }
    }
  }, []);

  const handleValidate = useCallback((key: string, value: unknown) => {
    switch (key) {
      case "profile.email": {
        const emailObj = typeof value === "object" && value !== null ? (value as Record<string, unknown>) : {};
        return new Promise<string | null>((r) => setTimeout(r, 500)).then(
          () => {
            if (emailObj.address === "taken@example.com") {
              return "This email is already in use";
            }
            return null;
          },
        );
      }
      default:
        return null;
    }
  }, []);

  return (
    <div className="h-screen flex flex-col bg-background text-foreground">
      <div className="flex items-center gap-2 px-3 h-6 border-b bg-muted/50 text-[11px] text-muted-foreground shrink-0 select-none">
        <span>Settera v{SCHEMA_VERSION}</span>
        <span className="text-border">|</span>
        <select
          value={mode}
          onChange={(e) => setMode(e.target.value as DemoMode)}
          className="bg-transparent border-none text-[11px] text-muted-foreground cursor-pointer outline-none"
        >
          {MODES.map((m) => (
            <option key={m.key} value={m.key}>{m.label}</option>
          ))}
        </select>
        <span className="text-border">|</span>
        <button
          type="button"
          aria-label={isDark ? "Switch to light mode" : "Switch to dark mode"}
          onClick={() => setIsDark((d) => !d)}
          className="inline-flex items-center justify-center cursor-pointer bg-transparent border-none p-0 text-muted-foreground hover:text-foreground"
        >
          {isDark ? (
            <svg width="12" height="12" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="8" cy="8" r="3" />
              <path d="M8 1v1M8 14v1M1 8h1M14 8h1M3.05 3.05l.7.7M12.25 12.25l.7.7M3.05 12.95l.7-.7M12.25 3.75l.7-.7" />
            </svg>
          ) : (
            <svg width="12" height="12" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M13.5 8.5a5.5 5.5 0 1 1-6-6 4 4 0 0 0 6 6z" />
            </svg>
          )}
        </button>
      </div>

      <div className="flex-1 overflow-hidden">
        <Settera
          schema={demoSchema}
          values={values}
          onChange={handleChange}
          onAction={handleAction}
          onValidate={handleValidate}
        >
          {mode === "schema" && <SchemaView />}

          {mode === "headless" && (
            <SetteraNavigation>
              <HeadlessView />
            </SetteraNavigation>
          )}

          {mode === "ui" && (
            <div style={uiThemeVars} className="h-full">
              <UiSetteraLayout
                backToApp={{ label: "Back to app", href: "/" }}
              />
            </div>
          )}

          {mode === "shadcn" && (
            <ShadcnSetteraLayout
              backToApp={{
                label: "Back to app",
                href: "/",
              }}
              renderIcon={renderIcon}
              customPages={{ usersPage: UsersPage }}
              customSettings={{ profilePicture: ProfilePictureSetting }}
              customActionPages={{ advancedExportPage: AdvancedExportPage }}
            />
          )}
        </Settera>
      </div>
    </div>
  );
}

function SchemaView() {
  return (
    <div className="h-full overflow-auto p-5 bg-muted/30">
      <pre className="m-0 border rounded-xl bg-background p-4 text-xs leading-relaxed whitespace-pre-wrap font-mono">
        {JSON.stringify(demoSchema, null, 2)}
      </pre>
    </div>
  );
}
