import type { SetteraSchema } from "@settera/schema";

export const demoSchema: SetteraSchema = {
  version: "1.0",
  meta: {
    title: "Demo Settings",
    description: "A demo showcasing all core setting controls with Settera.",
  },
  pages: [
    {
      label: "Account",
      pages: [
    {
      key: "profile",
      title: "Profile",
      description: "Manage your personal details.",
      icon: "user",
      sections: [
        {
          key: "details",
          title: "Personal information",
          description:
            "Changes to your profile will apply to all of your workspaces.",
          settings: [
            {
              key: "profile.avatar",
              title: "Profile picture",
              description:
                "We only support PNGs, JPEGs and GIFs under 10MB.",
              type: "custom",
              renderer: "profilePicture",
            },
            {
              key: "profile.firstName",
              title: "First name",
              type: "text",
              placeholder: "Enter your first name",
              validation: {
                required: true,
                maxLength: 50,
              },
            },
            {
              key: "profile.lastName",
              title: "Last name",
              type: "text",
              placeholder: "Enter your last name",
              validation: {
                required: true,
                maxLength: 50,
              },
            },
            {
              key: "profile.email",
              title: "Email address",
              type: "compound",
              displayStyle: "modal",
              buttonLabel: "Edit",
              fields: [
                {
                  key: "address",
                  title: "Email address",
                  type: "text",
                  inputType: "email",
                  placeholder: "you@example.com",
                  validation: { required: true },
                },
              ],
            },
          ],
        },
        {
          key: "password",
          title: "Password",
          description: "Update your login credentials",
          settings: [
            {
              key: "profile.password",
              title: "Password",
              description: "Must be at least 8 characters.",
              type: "compound",
              displayStyle: "modal",
              buttonLabel: "Change password",
              fields: [
                {
                  key: "currentPassword",
                  title: "Current password",
                  type: "text",
                  inputType: "password",
                  validation: { required: true },
                },
                {
                  key: "newPassword",
                  title: "New password",
                  type: "text",
                  inputType: "password",
                  validation: { required: true, minLength: 8 },
                },
                {
                  key: "confirmPassword",
                  title: "Confirm new password",
                  type: "text",
                  inputType: "password",
                  validation: { required: true, minLength: 8 },
                },
              ],
            },
          ],
        },
        {
          key: "locale",
          title: "Locale",
          settings: [
            {
              key: "profile.language",
              title: "Language",
              description: "Choose the display language for the settings UI.",
              type: "select",
              options: [
                { value: "en", label: "English" },
                { value: "es", label: "Español" },
                { value: "fr", label: "Français" },
                { value: "de", label: "Deutsch" },
                { value: "ja", label: "日本語" },
              ],
              default: "en",
            },
          ],
        },
        {
          key: "time",
          title: "Time preferences",
          description: "Manage your time preferences.",
          settings: [
            {
              key: "profile.timezone",
              title: "Timezone",
              type: "select",
              searchable: true,
              options: [
                { value: "America/New_York", label: "Eastern Time (New York)", group: "Americas" },
                { value: "America/Chicago", label: "Central Time (Chicago)", group: "Americas" },
                { value: "America/Denver", label: "Mountain Time (Denver)", group: "Americas" },
                { value: "America/Los_Angeles", label: "Pacific Time (Los Angeles)", group: "Americas" },
                { value: "America/Anchorage", label: "Alaska Time (Anchorage)", group: "Americas" },
                { value: "Pacific/Honolulu", label: "Hawaii Time (Honolulu)", group: "Americas" },
                { value: "America/Phoenix", label: "Arizona Time (Phoenix)", group: "Americas" },
                { value: "America/Toronto", label: "Eastern Time (Toronto)", group: "Americas" },
                { value: "America/Vancouver", label: "Pacific Time (Vancouver)", group: "Americas" },
                { value: "America/Sao_Paulo", label: "Brasilia Time (São Paulo)", group: "Americas" },
                { value: "America/Mexico_City", label: "Central Time (Mexico City)", group: "Americas" },
                { value: "America/Buenos_Aires", label: "Argentina Time (Buenos Aires)", group: "Americas" },
                { value: "Europe/London", label: "GMT (London)", group: "Europe" },
                { value: "Europe/Berlin", label: "CET (Berlin)", group: "Europe" },
                { value: "Europe/Paris", label: "CET (Paris)", group: "Europe" },
                { value: "Europe/Amsterdam", label: "CET (Amsterdam)", group: "Europe" },
                { value: "Europe/Madrid", label: "CET (Madrid)", group: "Europe" },
                { value: "Europe/Rome", label: "CET (Rome)", group: "Europe" },
                { value: "Europe/Moscow", label: "MSK (Moscow)", group: "Europe" },
                { value: "Europe/Istanbul", label: "TRT (Istanbul)", group: "Europe" },
                { value: "Asia/Tokyo", label: "JST (Tokyo)", group: "Asia & Pacific" },
                { value: "Asia/Shanghai", label: "CST (Shanghai)", group: "Asia & Pacific" },
                { value: "Asia/Kolkata", label: "IST (Kolkata)", group: "Asia & Pacific" },
                { value: "Asia/Dubai", label: "GST (Dubai)", group: "Asia & Pacific" },
                { value: "Asia/Singapore", label: "SGT (Singapore)", group: "Asia & Pacific" },
                { value: "Asia/Seoul", label: "KST (Seoul)", group: "Asia & Pacific" },
                { value: "Asia/Hong_Kong", label: "HKT (Hong Kong)", group: "Asia & Pacific" },
                { value: "Australia/Sydney", label: "AEST (Sydney)", group: "Asia & Pacific" },
                { value: "Australia/Melbourne", label: "AEST (Melbourne)", group: "Asia & Pacific" },
                { value: "Pacific/Auckland", label: "NZST (Auckland)", group: "Asia & Pacific" },
                { value: "UTC", label: "UTC" },
              ],
              default: "America/New_York",
            },
            {
              key: "profile.startWeekOn",
              title: "Start week on",
              type: "select",
              options: [
                { value: "sunday", label: "Sunday" },
                { value: "monday", label: "Monday" },
                { value: "saturday", label: "Saturday" },
              ],
              default: "monday",
            },
          ],
        },
      ],
    },
    {
      key: "appearance",
      title: "Appearance",
      description: "Customize the look and feel of the app.",
      icon: "paintbrush",
      sections: [
        {
          key: "theme",
          title: "Theme",
          settings: [
            {
              key: "appearance.colorMode",
              title: "Color mode",
              description:
                "Choose between light and dark mode, or follow your system preference.",
              type: "select",
              options: [
                { value: "light", label: "Light" },
                { value: "dark", label: "Dark" },
                { value: "system", label: "System" },
              ],
              default: "system",
              validation: { required: true },
            },
            {
              key: "appearance.theme",
              title: "Theme",
              description:
                "The primary color used for buttons, links, and highlights.",
              type: "custom",
              renderer: "themePicker",
              default: "blue",
              validation: { required: true },
              config: {
                options: [
                  { value: "blue", label: "Blue", color: "#3b82f6" },
                  { value: "purple", label: "Purple", color: "#a855f7" },
                  { value: "green", label: "Green", color: "#22c55e" },
                  { value: "rose", label: "Rose", color: "#f43f5e" },
                  { value: "orange", label: "Orange", color: "#f97316" },
                  { value: "neutral", label: "Neutral", color: "#737373" },
                ],
              },
            },
          ],
        },
      ],
    },
      ],
    },
    {
      label: "Organization",
      pages: [
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
                  title: "SSO provider",
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
                  title: "Session timeout",
                  description: "Minutes of inactivity before auto-logout.",
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
                  title: "Enable experimental features",
                  description: "Turn on features that are still in development.",
                  type: "boolean",
                  default: false,
                  dangerous: true,
                  confirm: {
                    title: "Enable experimental features?",
                    message:
                      "Experimental features may cause instability. Proceed?",
                  },
                },
                {
                  key: "advanced.debug",
                  title: "Debug mode",
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
                  title: "Beta updates",
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
              title: "Data management",
              settings: [
                {
                  key: "actions.export",
                  title: "Export data",
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
                  title: "Invite team (modal demo)",
                  description:
                    "Comprehensive modal action example with mixed field types.",
                  type: "action",
                  buttonLabel: "Invite team",
                  actionType: "modal",
                  modal: {
                    title: "Invite team members",
                    description:
                      "Draft values in this modal are only submitted when you click Send invites.",
                    submitLabel: "Send invites",
                    fields: [
                      {
                        key: "message",
                        title: "Welcome message",
                        type: "text",
                        placeholder: "Welcome to the workspace",
                        default: "Welcome aboard!",
                      },
                      {
                        key: "seatCount",
                        title: "Seat count",
                        type: "number",
                        default: 3,
                      },
                      {
                        key: "sendOn",
                        title: "Send on",
                        type: "date",
                      },
                      {
                        key: "channels",
                        title: "Invite channels",
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
                            title: "Owner name",
                            type: "text",
                            default: "",
                          },
                          {
                            key: "notify",
                            title: "Notify owner",
                            type: "boolean",
                            default: true,
                          },
                        ],
                      },
                      {
                        key: "emails",
                        title: "Invite emails",
                        type: "repeatable",
                        itemType: "text",
                        default: ["new-user@example.com"],
                      },
                    ],
                  },
                },
                {
                  key: "actions.clearCache",
                  title: "Clear cache",
                  description: "Remove cached data to free up space.",
                  type: "action",
                  buttonLabel: "Clear cache",
                  actionType: "callback",
                },
                {
                  key: "actions.importData",
                  title: "Import data",
                  description:
                    "Full-page form for importing data from an external source.",
                  type: "action",
                  buttonLabel: "Import data",
                  actionType: "page",
                  page: {
                    title: "Import data",
                    description:
                      "Configure the import source and options, then submit to begin the import.",
                    submitLabel: "Start import",
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
                  title: "Advanced export",
                  description:
                    "Custom full-page export wizard with a custom renderer.",
                  type: "action",
                  buttonLabel: "Advanced export",
                  actionType: "page",
                  page: {
                    renderer: "advancedExportPage",
                    title: "Advanced export",
                    description: "Custom renderer for advanced export options.",
                  },
                },
                {
                  key: "actions.account",
                  title: "Your account",
                  description: "Log in or create a new account.",
                  type: "action",
                  actions: [
                    {
                      key: "actions.account.login",
                      buttonLabel: "Log in",
                      actionType: "modal",
                      modal: {
                        title: "Log in to your account",
                        description: "Enter your credentials to sign in.",
                        submitLabel: "Log in",
                        fields: [
                          {
                            key: "email",
                            title: "Email",
                            type: "text",
                            inputType: "email",
                            placeholder: "you@example.com",
                          },
                          {
                            key: "password",
                            title: "Password",
                            type: "text",
                            inputType: "password",
                          },
                        ],
                      },
                    },
                    {
                      key: "actions.account.signup",
                      buttonLabel: "Sign up",
                      actionType: "callback",
                    },
                  ],
                },
                {
                  key: "actions.deleteAccount",
                  title: "Delete account",
                  description:
                    "Permanently delete your account and all associated data. This action cannot be undone.",
                  type: "action",
                  buttonLabel: "Delete account",
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
              title: "Brand identity",
              collapsible: true,
              settings: [
                {
                  key: "branding.name",
                  title: "Brand name",
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
                  title: "Legal notice",
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
              title: "Plan & usage",
              settings: [
                {
                  key: "billing.plan",
                  title: "Current plan",
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
                  title: "Team seats",
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
                  title: "Annual billing",
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
              title: "Paid features",
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
                  title: "Custom domain",
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
                  title: "Audit log retention",
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
                  title: "API access",
                  description: "Enable REST API access for integrations.",
                  type: "boolean",
                  default: false,
                },
                {
                  key: "billing.apiRateLimit",
                  title: "API rate limit",
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
              title: "Billing notifications",
              settings: [
                {
                  key: "billing.notifyChannels",
                  title: "Billing alert channels",
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
                  title: "Slack webhook URL",
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
                  title: "Custom webhook URL",
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
                  title: "Usage alert threshold",
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
                  title: "Overage settings",
                  description: "Configure what happens when you exceed your plan limits.",
                  visibleWhen: {
                    setting: "billing.usageThreshold",
                    lessThan: 100,
                  },
                  settings: [
                    {
                      key: "billing.overageAction",
                      title: "Overage action",
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
                      title: "Overage notification email",
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
