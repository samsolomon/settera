import { useState, useCallback } from "react";
import { SCHEMA_VERSION } from "@settara/schema";
import { SettaraProvider, SettaraRenderer } from "@settara/react";
import {
  SettingRow,
  BooleanSwitch,
  TextInput,
  NumberInput,
  Select,
  ActionButton,
} from "@settara/ui";
import { demoSchema } from "./schema.js";

export function App() {
  const [values, setValues] = useState<Record<string, unknown>>({});

  const handleChange = useCallback((key: string, value: unknown) => {
    setValues((prev) => ({ ...prev, [key]: value }));
  }, []);

  const onAction: Record<string, () => void | Promise<void>> = {
    "actions.export": async () => {
      // Simulate async export
      await new Promise((r) => setTimeout(r, 1500));
      alert("Data exported!");
    },
    "actions.clearCache": () => {
      alert("Cache cleared!");
    },
    "actions.deleteAccount": async () => {
      await new Promise((r) => setTimeout(r, 2000));
      alert("Account deleted (just kidding).");
    },
  };

  const onValidate: Record<
    string,
    (value: unknown) => string | null | Promise<string | null>
  > = {
    "profile.email": async (value) => {
      // Simulate async validation (e.g., checking if email is taken)
      await new Promise((r) => setTimeout(r, 500));
      if (value === "taken@example.com") {
        return "This email is already in use";
      }
      return null;
    },
  };

  return (
    <div
      style={{
        maxWidth: 640,
        margin: "0 auto",
        padding: "24px",
        fontFamily:
          '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
      }}
    >
      <h1
        style={{
          fontSize: "24px",
          fontWeight: 600,
          marginBottom: "4px",
        }}
      >
        Settara Demo
      </h1>
      <p
        style={{
          fontSize: "13px",
          color: "#6b7280",
          marginBottom: "32px",
        }}
      >
        Schema v{SCHEMA_VERSION} — All core controls
      </p>

      <SettaraProvider schema={demoSchema}>
        <SettaraRenderer
          values={values}
          onChange={handleChange}
          onAction={onAction}
          onValidate={onValidate}
        >
          {/* General > Behavior */}
          <SectionHeading>Behavior</SectionHeading>
          <SettingRow settingKey="general.autoSave">
            <BooleanSwitch settingKey="general.autoSave" />
          </SettingRow>
          <SettingRow settingKey="general.notifications">
            <BooleanSwitch settingKey="general.notifications" />
          </SettingRow>
          <SettingRow settingKey="general.sounds">
            <BooleanSwitch settingKey="general.sounds" />
          </SettingRow>

          {/* General > Profile */}
          <SectionHeading>Profile</SectionHeading>
          <SettingRow settingKey="profile.displayName">
            <TextInput settingKey="profile.displayName" />
          </SettingRow>
          <SettingRow settingKey="profile.email">
            <TextInput settingKey="profile.email" />
          </SettingRow>
          <SettingRow settingKey="profile.bio">
            <TextInput settingKey="profile.bio" />
          </SettingRow>

          {/* General > Appearance */}
          <SectionHeading>Appearance</SectionHeading>
          <SettingRow settingKey="appearance.theme">
            <Select settingKey="appearance.theme" />
          </SettingRow>
          <SettingRow settingKey="appearance.fontSize">
            <NumberInput settingKey="appearance.fontSize" />
          </SettingRow>
          <SettingRow settingKey="appearance.language">
            <Select settingKey="appearance.language" />
          </SettingRow>

          {/* General > Security */}
          <SectionHeading>Security</SectionHeading>
          <SettingRow settingKey="security.ssoEnabled">
            <BooleanSwitch settingKey="security.ssoEnabled" />
          </SettingRow>
          <SettingRow settingKey="security.ssoProvider">
            <Select settingKey="security.ssoProvider" />
          </SettingRow>
          <SettingRow settingKey="security.mfa">
            <BooleanSwitch settingKey="security.mfa" />
          </SettingRow>
          <SettingRow settingKey="security.sessionTimeout">
            <NumberInput settingKey="security.sessionTimeout" />
          </SettingRow>

          {/* Advanced > Experimental */}
          <SectionHeading>Experimental</SectionHeading>
          <SettingRow settingKey="advanced.experimental">
            <BooleanSwitch settingKey="advanced.experimental" />
          </SettingRow>
          <SettingRow settingKey="advanced.debug">
            <BooleanSwitch settingKey="advanced.debug" />
          </SettingRow>
          <SettingRow settingKey="advanced.betaUpdates">
            <BooleanSwitch settingKey="advanced.betaUpdates" />
          </SettingRow>

          {/* Advanced > Data Management */}
          <SectionHeading>Data Management</SectionHeading>
          <SettingRow settingKey="actions.export">
            <ActionButton settingKey="actions.export" />
          </SettingRow>
          <SettingRow settingKey="actions.clearCache">
            <ActionButton settingKey="actions.clearCache" />
          </SettingRow>
          <SettingRow settingKey="actions.deleteAccount">
            <ActionButton settingKey="actions.deleteAccount" />
          </SettingRow>
        </SettaraRenderer>
      </SettaraProvider>

      {/* Debug: current values */}
      <details style={{ marginTop: "32px" }}>
        <summary
          style={{ cursor: "pointer", fontSize: "13px", color: "#9ca3af" }}
        >
          Debug: Current Values
        </summary>
        <pre
          style={{
            fontSize: "12px",
            backgroundColor: "#f9fafb",
            padding: "12px",
            borderRadius: "6px",
            marginTop: "8px",
            overflow: "auto",
          }}
        >
          {JSON.stringify(values, null, 2)}
        </pre>
      </details>
    </div>
  );
}

function SectionHeading({ children }: { children: React.ReactNode }) {
  return (
    <h2
      style={{
        fontSize: "11px",
        fontWeight: 600,
        textTransform: "uppercase",
        letterSpacing: "0.05em",
        color: "#9ca3af",
        marginTop: "24px",
        marginBottom: "8px",
      }}
    >
      {children}
    </h2>
  );
}
