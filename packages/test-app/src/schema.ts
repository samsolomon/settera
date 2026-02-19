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
              badge: "New",
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
              inputType: "textarea",
              rows: 4,
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
          key: "disabled-readonly",
          title: "Disabled & Readonly",
          description: "Demonstrates disabled and readonly states.",
          collapsible: true,
          defaultCollapsed: true,
          settings: [
            {
              key: "demo.disabledText",
              title: "Disabled Text",
              description: "This text field is disabled and cannot be edited.",
              type: "text",
              default: "Cannot edit this",
              disabled: true,
            },
            {
              key: "demo.readonlyText",
              title: "Readonly Text",
              description:
                "This text field is readonly — you can select and copy but not edit.",
              type: "text",
              default: "You can copy this",
              readonly: true,
            },
            {
              key: "demo.disabledNumber",
              title: "Disabled Number",
              description: "A disabled number input.",
              type: "number",
              default: 42,
              disabled: true,
            },
            {
              key: "demo.readonlyNumber",
              title: "Readonly Number",
              description: "A readonly number input.",
              type: "number",
              default: 99,
              readonly: true,
            },
            {
              key: "demo.disabledDate",
              title: "Disabled Date",
              description: "A disabled date input.",
              type: "date",
              default: "2025-01-01",
              disabled: true,
            },
            {
              key: "demo.readonlyDate",
              title: "Readonly Date",
              description: "A readonly date input.",
              type: "date",
              default: "2025-06-15",
              readonly: true,
            },
            {
              key: "demo.disabledToggle",
              title: "Disabled Toggle",
              description: "A disabled boolean switch.",
              type: "boolean",
              default: true,
              disabled: true,
            },
            {
              key: "demo.disabledSelect",
              title: "Disabled Select",
              description: "A disabled dropdown.",
              type: "select",
              options: [
                { value: "a", label: "Option A" },
                { value: "b", label: "Option B" },
              ],
              default: "a",
              disabled: true,
            },
            {
              key: "demo.disabledMultiselect",
              title: "Disabled Multiselect",
              description: "Disabled checkboxes.",
              type: "multiselect",
              options: [
                { value: "x", label: "Choice X" },
                { value: "y", label: "Choice Y" },
                { value: "z", label: "Choice Z" },
              ],
              default: ["x", "z"],
              disabled: true,
            },
            {
              key: "demo.disabledCompound",
              title: "Disabled Compound (Inline)",
              description:
                "A disabled compound — all child fields are also disabled.",
              type: "compound",
              displayStyle: "inline",
              disabled: true,
              fields: [
                {
                  key: "firstName",
                  title: "First Name",
                  type: "text",
                  default: "Jane",
                },
                {
                  key: "active",
                  title: "Active",
                  type: "boolean",
                  default: true,
                },
              ],
            },
            {
              key: "demo.disabledList",
              title: "Disabled List",
              description:
                "A disabled repeatable — items and buttons are all disabled.",
              type: "repeatable",
              itemType: "text",
              default: ["locked-item-1", "locked-item-2"],
              disabled: true,
            },
            {
              key: "demo.disabledAction",
              title: "Disabled Action",
              description: "A disabled action button.",
              type: "action",
              buttonLabel: "Can't Click",
              actionType: "callback",
              disabled: true,
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
              displayHint: "slider",
              validation: {
                required: true,
                min: 10,
                max: 24,
                step: 1,
              },
            },
            {
              key: "appearance.language",
              title: "Language",
              description: "Display language for the interface.",
              type: "select",
              placeholder: "Choose a language…",
              options: [
                { value: "en", label: "English", group: "Popular", description: "US English" },
                { value: "es", label: "Spanish", group: "Popular", description: "Español" },
                { value: "fr", label: "French", group: "European", description: "Français" },
                { value: "de", label: "German", group: "European", description: "Deutsch" },
                { value: "ja", label: "Japanese", group: "Asian", description: "日本語" },
                { value: "ko", label: "Korean", group: "Asian", description: "한국어" },
                { value: "zh", label: "Chinese", group: "Asian", description: "中文" },
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
              placeholder: "Choose a provider…",
              options: [
                { value: "okta", label: "Okta", description: "Enterprise SSO with SAML 2.0" },
                { value: "auth0", label: "Auth0", description: "Flexible identity platform" },
                { value: "azure", label: "Azure AD", description: "Microsoft Entra ID" },
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
              badge: "Beta",
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
              key: "actions.importData",
              title: "Import Data",
              description:
                "Full-page form for importing data from an external source.",
              type: "action",
              buttonLabel: "Import Data",
              actionType: "page",
              page: {
                title: "Import Data",
                description:
                  "Configure the import source and options, then submit to begin the import.",
                submitLabel: "Start Import",
                cancelLabel: "Cancel",
                fields: [
                  {
                    key: "source",
                    title: "Source",
                    type: "select",
                    options: [
                      { value: "csv", label: "CSV File" },
                      { value: "json", label: "JSON File" },
                      { value: "api", label: "External API" },
                    ],
                    default: "csv",
                  },
                  {
                    key: "url",
                    title: "Source URL",
                    type: "text",
                    inputType: "url",
                    placeholder: "https://example.com/data.csv",
                  },
                  {
                    key: "overwrite",
                    title: "Overwrite existing data",
                    type: "boolean",
                    default: false,
                  },
                  {
                    key: "dryRun",
                    title: "Dry run (preview only)",
                    type: "boolean",
                    default: true,
                  },
                ],
              },
            },
            {
              key: "actions.advancedExport",
              title: "Advanced Export",
              description:
                "Custom full-page export wizard with a custom renderer.",
              type: "action",
              buttonLabel: "Advanced Export",
              actionType: "page",
              page: {
                renderer: "advancedExportPage",
                title: "Advanced Export",
                description: "Custom renderer for advanced export options.",
              },
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
      key: "branding",
      title: "Branding",
      icon: "palette",
      sections: [
        {
          key: "identity",
          title: "Brand Identity",
          collapsible: true,
          settings: [
            {
              key: "branding.name",
              title: "Brand Name",
              description: "Your organization or product name.",
              type: "text",
              placeholder: "Acme Corp",
              validation: {
                required: true,
                maxLength: 60,
              },
            },
            {
              key: "branding.tagline",
              title: "Tagline",
              description: "A short brand statement shown on the login page.",
              type: "text",
              inputType: "textarea",
              rows: 2,
              placeholder: "Building the future, one feature at a time.",
              validation: {
                maxLength: 120,
              },
            },
            {
              key: "branding.legalNotice",
              title: "Legal Notice",
              description: "Footer legal text displayed across the app.",
              type: "text",
              inputType: "textarea",
              rows: 3,
              placeholder: "© 2026 Acme Corp. All rights reserved.",
              badge: "Enterprise",
            },
            {
              key: "branding.logoUrl",
              title: "Logo URL",
              description: "URL to your organization logo (SVG or PNG recommended).",
              type: "text",
              inputType: "url",
              placeholder: "https://example.com/logo.svg",
              validation: {
                pattern: "^https?://",
                message: "Must be a valid URL starting with http:// or https://",
              },
            },
          ],
        },
      ],
    },
    {
      key: "billing",
      title: "Billing",
      icon: "credit-card",
      sections: [
        {
          key: "plan",
          title: "Plan & Usage",
          settings: [
            {
              key: "billing.plan",
              title: "Current Plan",
              description: "Your subscription tier.",
              type: "select",
              placeholder: "Select a plan…",
              options: [
                { value: "free", label: "Free", description: "Up to 3 users, basic features" },
                { value: "starter", label: "Starter", description: "Up to 10 users, core features", group: "Paid" },
                { value: "pro", label: "Pro", description: "Unlimited users, advanced features", group: "Paid" },
                { value: "enterprise", label: "Enterprise", description: "Custom limits, SSO, audit logs", group: "Paid" },
              ],
              default: "free",
            },
            {
              key: "billing.seats",
              title: "Team Seats",
              description: "Number of team member seats on your plan.",
              type: "number",
              default: 3,
              displayHint: "slider",
              validation: {
                required: true,
                min: 1,
                max: 100,
                step: 1,
              },
            },
            {
              key: "billing.annualBilling",
              title: "Annual Billing",
              description: "Save 20% with annual billing.",
              type: "boolean",
              default: false,
              visibleWhen: {
                setting: "billing.plan",
                notEquals: "free",
              },
            },
          ],
        },
        {
          key: "paid-features",
          title: "Paid Features",
          description: "These settings require a paid plan.",
          collapsible: true,
          visibleWhen: {
            or: [
              { setting: "billing.plan", equals: "starter" },
              { setting: "billing.plan", equals: "pro" },
              { setting: "billing.plan", equals: "enterprise" },
            ],
          },
          settings: [
            {
              key: "billing.customDomain",
              title: "Custom Domain",
              description: "Use your own domain for the app.",
              type: "text",
              inputType: "url",
              placeholder: "app.yourcompany.com",
              badge: "Pro",
              visibleWhen: {
                or: [
                  { setting: "billing.plan", equals: "pro" },
                  { setting: "billing.plan", equals: "enterprise" },
                ],
              },
            },
            {
              key: "billing.auditLog",
              title: "Audit Log Retention",
              description: "How long to keep audit log entries (days).",
              type: "number",
              default: 30,
              badge: "Enterprise",
              validation: {
                min: 7,
                max: 365,
                step: 1,
              },
              visibleWhen: {
                setting: "billing.plan",
                equals: "enterprise",
              },
            },
            {
              key: "billing.apiAccess",
              title: "API Access",
              description: "Enable REST API access for integrations.",
              type: "boolean",
              default: false,
            },
            {
              key: "billing.apiRateLimit",
              title: "API Rate Limit",
              description: "Maximum API requests per minute. Shown when API access is enabled and seats exceed 5.",
              type: "number",
              default: 60,
              validation: {
                min: 10,
                max: 1000,
                step: 10,
              },
              visibleWhen: [
                { setting: "billing.apiAccess", equals: true },
                { setting: "billing.seats", greaterThan: 5 },
              ],
            },
          ],
        },
        {
          key: "notifications-billing",
          title: "Billing Notifications",
          settings: [
            {
              key: "billing.notifyChannels",
              title: "Billing Alert Channels",
              description: "Choose how to receive billing-related alerts.",
              type: "multiselect",
              options: [
                { value: "email", label: "Email" },
                { value: "slack", label: "Slack" },
                { value: "webhook", label: "Webhook" },
              ],
              default: ["email"],
            },
            {
              key: "billing.slackWebhook",
              title: "Slack Webhook URL",
              description: "Webhook URL for Slack billing notifications.",
              type: "text",
              inputType: "url",
              placeholder: "https://hooks.slack.com/services/...",
              visibleWhen: {
                setting: "billing.notifyChannels",
                contains: "slack",
              },
            },
            {
              key: "billing.webhookUrl",
              title: "Custom Webhook URL",
              description: "Your webhook endpoint for billing events.",
              type: "text",
              inputType: "url",
              placeholder: "https://api.yourapp.com/billing-webhook",
              visibleWhen: {
                setting: "billing.notifyChannels",
                contains: "webhook",
              },
            },
            {
              key: "billing.usageThreshold",
              title: "Usage Alert Threshold",
              description: "Get notified when usage exceeds this percentage.",
              type: "number",
              default: 80,
              displayHint: "slider",
              validation: {
                min: 50,
                max: 100,
                step: 5,
              },
            },
          ],
          subsections: [
            {
              key: "billing-overages",
              title: "Overage Settings",
              description: "Configure what happens when you exceed your plan limits.",
              visibleWhen: {
                setting: "billing.usageThreshold",
                lessThan: 100,
              },
              settings: [
                {
                  key: "billing.overageAction",
                  title: "Overage Action",
                  description: "What to do when usage exceeds the threshold.",
                  type: "select",
                  options: [
                    { value: "notify", label: "Notify only" },
                    { value: "throttle", label: "Throttle requests" },
                    { value: "block", label: "Block new requests" },
                  ],
                  default: "notify",
                },
                {
                  key: "billing.overageEmail",
                  title: "Overage Notification Email",
                  description: "Override the billing contact for overage alerts. Leave empty to use the account email.",
                  type: "text",
                  inputType: "email",
                  placeholder: "billing@yourcompany.com",
                  deprecated: "Use Billing Alert Channels instead. This field will be removed in a future version.",
                },
              ],
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
