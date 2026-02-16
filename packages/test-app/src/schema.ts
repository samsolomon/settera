import type { SettaraSchema } from "@settara/schema";

export const demoSchema: SettaraSchema = {
  version: "1.0",
  meta: {
    title: "Demo Settings",
    description: "A demo showcasing boolean settings with Settara.",
  },
  pages: [
    {
      key: "general",
      title: "General",
      icon: "settings",
      sections: [
        {
          key: "behavior",
          title: "Behavior",
          settings: [
            {
              key: "general.autoSave",
              title: "Auto Save",
              description: "Automatically save changes when you leave a field.",
              type: "boolean",
              default: true,
            },
            {
              key: "general.notifications",
              title: "Enable Notifications",
              description: "Receive notifications about important updates.",
              type: "boolean",
              default: true,
            },
            {
              key: "general.sounds",
              title: "Notification Sounds",
              description: "Play a sound when a notification arrives.",
              type: "boolean",
              default: false,
              visibleWhen: {
                setting: "general.notifications",
                equals: true,
              },
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
              description: "Select your SSO identity provider.",
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
              key: "security.mfa",
              title: "Require MFA",
              description: "Require multi-factor authentication for all users.",
              type: "boolean",
              default: false,
              visibleWhen: {
                setting: "security.ssoEnabled",
                equals: true,
              },
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
          title: "Experimental",
          description: "These features may be unstable.",
          settings: [
            {
              key: "advanced.experimental",
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
              key: "advanced.debug",
              title: "Debug Mode",
              description: "Show debug information in the console.",
              type: "boolean",
              default: false,
              visibleWhen: {
                setting: "advanced.experimental",
                equals: true,
              },
            },
            {
              key: "advanced.betaUpdates",
              title: "Beta Updates",
              description: "Receive beta updates before general release.",
              type: "boolean",
              default: false,
              dangerous: true,
            },
          ],
        },
      ],
    },
  ],
};
