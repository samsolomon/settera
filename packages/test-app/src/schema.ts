import type { SetteraSchema } from "@settera/schema";

export const demoSchema: SetteraSchema = {
  version: "1.0",
  meta: {
    title: "Demo Settings",
    description: "A demo showcasing all core setting controls with Settera.",
  },
  pages: [
    {
      key: "general",
      title: "General",
      description:
        "Core application settings. See our [documentation](https://example.com/docs) for details.",
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
              helpText: "Changes are saved to local storage automatically.",
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
            {
              key: "general.channels",
              title: "Notification Channels",
              description: "Choose how you want to receive notifications.",
              type: "multiselect",
              options: [
                { value: "email", label: "Email" },
                { value: "sms", label: "SMS" },
                { value: "push", label: "Push Notifications" },
                { value: "in-app", label: "In-App" },
              ],
              default: ["email", "in-app"],
              visibleWhen: {
                setting: "general.notifications",
                equals: true,
              },
              validation: {
                required: true,
              },
            },
          ],
        },
        {
          key: "profile",
          title: "Profile",
          settings: [
            {
              key: "profile.displayName",
              title: "Display Name",
              description: "Your name as shown to other users.",
              type: "text",
              placeholder: "Enter your name",
              validation: {
                required: true,
                minLength: 2,
                maxLength: 50,
              },
            },
            {
              key: "profile.email",
              title: "Email Address",
              description: "Used for account recovery and notifications.",
              type: "text",
              inputType: "email",
              placeholder: "you@example.com",
              validation: {
                required: true,
                pattern: "^[^@]+@[^@]+\\.[^@]+$",
                message: "Please enter a valid email address",
              },
            },
            {
              key: "profile.bio",
              title: "Bio",
              description: "A short description about yourself.",
              type: "text",
              placeholder: "Tell us about yourself…",
              validation: {
                maxLength: 200,
              },
            },
            {
              key: "profile.birthday",
              title: "Birthday",
              description: "Your date of birth (used for age verification).",
              type: "date",
              validation: {
                maxDate: "2010-01-01",
              },
            },
            {
              key: "profile.preferences",
              title: "Profile Preferences (Compound Inline)",
              description:
                "Demo compound object that edits multiple profile fields together.",
              type: "compound",
              displayStyle: "inline",
              fields: [
                {
                  key: "pronouns",
                  title: "Pronouns",
                  type: "text",
                  default: "",
                },
                {
                  key: "profileVisibility",
                  title: "Public Profile",
                  type: "boolean",
                  default: false,
                },
                {
                  key: "timezone",
                  title: "Timezone",
                  type: "select",
                  options: [
                    { value: "utc", label: "UTC" },
                    { value: "pst", label: "Pacific" },
                    { value: "est", label: "Eastern" },
                  ],
                  default: "utc",
                },
              ],
            },
            {
              key: "profile.contactCard",
              title: "Emergency Contact (Compound Modal)",
              description:
                "Second compound example using modal display style in schema.",
              type: "compound",
              displayStyle: "modal",
              fields: [
                {
                  key: "name",
                  title: "Contact Name",
                  type: "text",
                },
                {
                  key: "phone",
                  title: "Phone Number",
                  type: "text",
                  inputType: "text",
                },
                {
                  key: "methods",
                  title: "Preferred Contact Methods",
                  type: "multiselect",
                  options: [
                    { value: "call", label: "Call" },
                    { value: "sms", label: "SMS" },
                    { value: "email", label: "Email" },
                  ],
                  default: ["call"],
                },
              ],
            },
            {
              key: "profile.publicCard",
              title: "Public Card (Compound Page)",
              description:
                "Compound editor rendered as an expandable page-style panel.",
              type: "compound",
              displayStyle: "page",
              fields: [
                {
                  key: "headline",
                  title: "Headline",
                  type: "text",
                  default: "",
                },
                {
                  key: "tagline",
                  title: "Tagline",
                  type: "text",
                  default: "",
                },
                {
                  key: "showLocation",
                  title: "Show Location",
                  type: "boolean",
                  default: true,
                },
              ],
            },
            {
              key: "profile.aliases",
              title: "Aliases (List)",
              description: "A text list example for list setting behavior.",
              type: "repeatable",
              itemType: "text",
              default: ["Sam"],
              validation: {
                minItems: 1,
                maxItems: 4,
              },
            },
            {
              key: "profile.socialLinks",
              title: "Social Links (Repeatable Compound)",
              description:
                "Repeatable compound items with per-row text/select/boolean fields.",
              type: "repeatable",
              itemType: "compound",
              itemFields: [
                {
                  key: "label",
                  title: "Label",
                  type: "text",
                  default: "",
                },
                {
                  key: "url",
                  title: "URL",
                  type: "text",
                  inputType: "url",
                  default: "",
                },
                {
                  key: "visibility",
                  title: "Visibility",
                  type: "select",
                  options: [
                    { value: "public", label: "Public" },
                    { value: "private", label: "Private" },
                  ],
                  default: "public",
                },
                {
                  key: "featured",
                  title: "Featured",
                  type: "boolean",
                  default: false,
                },
              ],
              default: [],
              validation: {
                maxItems: 5,
              },
            },
            {
              key: "profile.signatureCard",
              title: "Signature Card (Custom)",
              description:
                "Custom-rendered setting surface for app-specific UI.",
              type: "custom",
              renderer: "signatureCard",
              config: {
                label: "Public signature",
              },
            },
          ],
        },
        {
          key: "appearance",
          title: "Appearance",
          settings: [
            {
              key: "appearance.theme",
              title: "Theme",
              description: "Choose the visual theme for the application.",
              type: "select",
              options: [
                { value: "light", label: "Light" },
                { value: "dark", label: "Dark" },
                { value: "system", label: "System" },
              ],
              default: "system",
            },
            {
              key: "appearance.fontSize",
              title: "Font Size",
              description: "Base font size in pixels.",
              type: "number",
              placeholder: "14",
              default: 14,
              validation: {
                required: true,
                min: 10,
                max: 24,
              },
            },
            {
              key: "appearance.language",
              title: "Language",
              description: "Display language for the interface.",
              type: "select",
              options: [
                { value: "en", label: "English" },
                { value: "es", label: "Spanish" },
                { value: "fr", label: "French" },
                { value: "de", label: "German" },
                { value: "ja", label: "Japanese" },
              ],
              default: "en",
              validation: {
                required: true,
              },
            },
          ],
        },
      ],
      pages: [
        {
          key: "privacy",
          title: "Privacy",
          sections: [
            {
              key: "tracking",
              title: "Tracking",
              settings: [
                {
                  key: "privacy.analytics",
                  title: "Usage Analytics",
                  description:
                    "Share anonymous usage data to help improve the app.",
                  type: "boolean",
                  default: true,
                },
                {
                  key: "privacy.crashReports",
                  title: "Crash Reports",
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
      key: "security",
      title: "Security",
      icon: "shield",
      sections: [
        {
          key: "securityMain",
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
            {
              key: "security.sessionTimeout",
              title: "Session Timeout",
              description: "Minutes of inactivity before auto-logout.",
              helpText: "Minimum 5 minutes, maximum 24 hours (1440 minutes).",
              type: "number",
              placeholder: "30",
              default: 30,
              validation: {
                required: true,
                min: 5,
                max: 1440,
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
              helpText:
                "Experimental features are not covered by our SLA and may be removed without notice.",
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
        {
          key: "actions",
          title: "Data Management",
          settings: [
            {
              key: "actions.export",
              title: "Export Data",
              description: "Download all your data as a JSON file.",
              type: "action",
              buttonLabel: "Export",
              actionType: "modal",
              modal: {
                title: "Export data",
                description:
                  "Choose export format and whether to include private notes.",
                submitLabel: "Start export",
                fields: [
                  {
                    key: "format",
                    title: "Format",
                    type: "select",
                    options: [
                      { value: "json", label: "JSON" },
                      { value: "csv", label: "CSV" },
                    ],
                    default: "json",
                  },
                  {
                    key: "includePrivate",
                    title: "Include private notes",
                    type: "boolean",
                    default: false,
                  },
                ],
              },
            },
            {
              key: "actions.inviteTeam",
              title: "Invite Team (Modal Demo)",
              description:
                "Comprehensive modal action example with mixed field types.",
              type: "action",
              buttonLabel: "Invite Team",
              actionType: "modal",
              modal: {
                title: "Invite team members",
                description:
                  "Draft values in this modal are only submitted when you click Send invites.",
                submitLabel: "Send invites",
                fields: [
                  {
                    key: "message",
                    title: "Welcome Message",
                    type: "text",
                    placeholder: "Welcome to the workspace",
                    default: "Welcome aboard!",
                  },
                  {
                    key: "seatCount",
                    title: "Seat Count",
                    type: "number",
                    default: 3,
                  },
                  {
                    key: "sendOn",
                    title: "Send On",
                    type: "date",
                  },
                  {
                    key: "channels",
                    title: "Invite Channels",
                    type: "multiselect",
                    options: [
                      { value: "email", label: "Email" },
                      { value: "slack", label: "Slack" },
                      { value: "sms", label: "SMS" },
                    ],
                    default: ["email"],
                  },
                  {
                    key: "owner",
                    title: "Owner",
                    type: "compound",
                    displayStyle: "inline",
                    fields: [
                      {
                        key: "name",
                        title: "Owner Name",
                        type: "text",
                        default: "",
                      },
                      {
                        key: "notify",
                        title: "Notify Owner",
                        type: "boolean",
                        default: true,
                      },
                    ],
                  },
                  {
                    key: "emails",
                    title: "Invite Emails",
                    type: "repeatable",
                    itemType: "text",
                    default: ["new-user@example.com"],
                  },
                ],
              },
            },
            {
              key: "actions.clearCache",
              title: "Clear Cache",
              description: "Remove cached data to free up space.",
              type: "action",
              buttonLabel: "Clear Cache",
              actionType: "callback",
            },
            {
              key: "actions.deleteAccount",
              title: "Delete Account",
              description:
                "Permanently delete your account and all associated data. This action cannot be undone.",
              type: "action",
              buttonLabel: "Delete Account",
              actionType: "callback",
              dangerous: true,
            },
          ],
        },
      ],
    },
    {
      key: "users",
      title: "Users",
      description: "Manage team members who can access this workspace.",
      icon: "users",
      mode: "custom",
      renderer: "usersPage",
    },
  ],
};
