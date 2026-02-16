import type { SettaraSchema } from "../../types.js";

/**
 * Reference schema fixture with ~20 settings across 3 pages.
 * Exercises: booleans, selects, text, numbers, visibility conditions,
 * dangerous settings, nested pages, compound settings, actions.
 */
export const referenceSchema: SettaraSchema = {
  version: "1.0",
  meta: {
    title: "Application Settings",
    description: "Configure your application preferences.",
  },
  pages: [
    {
      key: "general",
      title: "General",
      icon: "settings",
      sections: [
        {
          key: "behavior",
          title: "General Settings",
          settings: [
            {
              key: "general.autoSave",
              title: "Auto Save",
              description: "Automatically save changes.",
              type: "boolean",
              default: true,
            },
            {
              key: "general.closingBehavior",
              title: "When Closing With No Tabs",
              description:
                "What to do when using the close action with no tabs.",
              type: "select",
              options: [
                { value: "platform_default", label: "Platform Default" },
                { value: "close_window", label: "Close Window" },
                { value: "keep_open", label: "Keep Open" },
              ],
              default: "platform_default",
            },
            {
              key: "general.language",
              title: "Language",
              description: "Display language for the application.",
              type: "select",
              options: [
                { value: "en", label: "English" },
                { value: "es", label: "Spanish" },
                { value: "fr", label: "French" },
                { value: "de", label: "German" },
              ],
              default: "en",
            },
          ],
        },
        {
          key: "security",
          title: "Security",
          settings: [
            {
              key: "security.ssoEnabled",
              title: "Enable SSO",
              description: "Enable single sign-on authentication.",
              type: "boolean",
              default: false,
            },
            {
              key: "security.ssoProvider",
              title: "SSO Provider",
              description: "Select your SSO provider.",
              type: "select",
              options: [
                { value: "okta", label: "Okta" },
                { value: "auth0", label: "Auth0" },
                { value: "azure", label: "Azure AD" },
              ],
              visibleWhen: {
                setting: "security.ssoEnabled",
                equals: true,
              },
            },
            {
              key: "security.ssoDomain",
              title: "SSO Domain",
              description: "Your SSO domain.",
              type: "text",
              placeholder: "yourcompany.okta.com",
              visibleWhen: [
                { setting: "security.ssoEnabled", equals: true },
                { setting: "security.ssoProvider", equals: "okta" },
              ],
              validation: {
                required: true,
                message: "SSO domain is required when using Okta.",
              },
            },
            {
              key: "security.trustAllProjects",
              title: "Trust All Projects By Default",
              description:
                "Avoid Restricted Mode by auto-trusting all projects.",
              type: "boolean",
              default: false,
              dangerous: true,
              confirm: {
                message:
                  "This will trust all projects without prompting. Are you sure?",
                confirmLabel: "Trust All",
              },
            },
          ],
        },
      ],
      pages: [
        {
          key: "general.privacy",
          title: "Privacy",
          sections: [
            {
              key: "dataCollection",
              title: "Data Collection",
              settings: [
                {
                  key: "privacy.telemetry",
                  title: "Send Telemetry",
                  description:
                    "Help improve the product by sending anonymous usage data.",
                  type: "boolean",
                  default: true,
                },
                {
                  key: "privacy.crashReports",
                  title: "Send Crash Reports",
                  description: "Automatically send crash reports.",
                  type: "boolean",
                  default: true,
                },
              ],
            },
          ],
        },
      ],
    },
    {
      key: "appearance",
      title: "Appearance",
      icon: "palette",
      sections: [
        {
          key: "theme",
          title: "Theme",
          settings: [
            {
              key: "appearance.theme",
              title: "Theme",
              description: "Select the color theme.",
              type: "select",
              options: [
                { value: "system", label: "System" },
                { value: "light", label: "Light" },
                { value: "dark", label: "Dark" },
              ],
              default: "system",
            },
          ],
        },
        {
          key: "editor",
          title: "Editor",
          settings: [
            {
              key: "editor.fontSize",
              title: "Font Size",
              description: "Base font size in pixels.",
              type: "number",
              default: 14,
              validation: { min: 8, max: 72 },
            },
            {
              key: "editor.fontFamily",
              title: "Font Family",
              type: "select",
              options: [
                { value: "system", label: "System Default" },
                { value: "mono", label: "Monospace" },
                { value: "serif", label: "Serif" },
              ],
              default: "system",
            },
            {
              key: "editor.wordWrap",
              title: "Word Wrap",
              description: "Wrap long lines in the editor.",
              type: "boolean",
              default: true,
            },
          ],
        },
      ],
    },
    {
      key: "advanced",
      title: "Advanced",
      icon: "zap",
      sections: [
        {
          key: "experimental",
          title: "Experimental Features",
          description: "These features may be unstable.",
          settings: [
            {
              key: "advanced.experimentalFeatures",
              title: "Enable Experimental Features",
              description: "Turn on features that are still in development.",
              type: "boolean",
              default: false,
              dangerous: true,
              confirm: {
                title: "Enable Experimental Features?",
                message:
                  "Experimental features may cause instability. Proceed?",
              },
            },
            {
              key: "advanced.debugMode",
              title: "Debug Mode",
              description: "Show debug information in the console.",
              type: "boolean",
              default: false,
              visibleWhen: {
                setting: "advanced.experimentalFeatures",
                equals: true,
              },
            },
          ],
        },
        {
          key: "network",
          title: "Network",
          settings: [
            {
              key: "advanced.proxyUrl",
              title: "Proxy URL",
              description: "HTTP proxy for network requests.",
              type: "text",
              placeholder: "http://proxy.example.com:8080",
              validation: {
                pattern: "^https?://",
                message: "Must be a valid HTTP(S) URL.",
              },
            },
            {
              key: "advanced.timeout",
              title: "Request Timeout",
              description: "Network request timeout in seconds.",
              type: "number",
              default: 30,
              validation: { min: 1, max: 300 },
            },
          ],
        },
        {
          key: "data",
          title: "Data Management",
          settings: [
            {
              key: "advanced.clearCache",
              title: "Clear Cache",
              description: "Remove all cached data.",
              type: "action",
              buttonLabel: "Clear Cache",
              actionType: "callback",
              dangerous: true,
            },
          ],
        },
      ],
    },
  ],
};
