import {
  LayoutDashboard,
  Building2,
  CreditCard,
  ShoppingCart,
  BarChart3,
  ShieldCheck,
  Settings,
  Users,
  Zap,
  Activity,
  FileText,
  Globe,
  AlertTriangle,
  Cpu,
  Eye,
} from "lucide-react"

export const PLATFORM_NAV = [
  {
    id: "platform-dashboard",
    labelKey: "nav.platform.controlPanel",
    route: "/platform/dashboard",
    icon: LayoutDashboard,
  },

  {
    id: "platform-orgs",
    labelKey: "nav.platform.organizations",
    route: "/platform/organizations",
    icon: Building2,
  },

  {
    id: "platform-billing",
    labelKey: "nav.platform.billingSubscriptions",
    route: "/platform/billing",
    icon: CreditCard,
    children: [
      {
        id: "billing-subs",
        labelKey: "nav.platform.subscriptions",
        route: "/platform/billing/subscriptions",
      },
      {
        id: "billing-invoices",
        labelKey: "nav.platform.invoices",
        route: "/platform/billing/invoices",
      },
      { id: "billing-flags", labelKey: "nav.platform.flags", route: "/platform/billing/flags" },
    ],
  },
  {
    id: "platform-marketplace",
    labelKey: "nav.platform.candidatePool",
    route: "/platform/marketplace",
    icon: ShoppingCart,
    children: [
      {
        id: "market-candidates",
        labelKey: "nav.platform.availableCandidates",
        route: "/platform/marketplace/candidates",
      },
      {
        id: "market-exposure",
        labelKey: "nav.platform.poolExposure",
        route: "/platform/marketplace/exposure",
      },
    ],
  },

  {
    id: "platform-analytics",
    labelKey: "nav.platform.systemAnalytics",
    route: "/platform/analytics",
    icon: BarChart3,
    children: [
      {
        id: "analytics-users",
        labelKey: "nav.platform.activeUsers",
        route: "/platform/analytics/users",
      },
      { id: "analytics-ai", labelKey: "nav.platform.aiUsage", route: "/platform/analytics/ai" },
      {
        id: "analytics-parsing",
        labelKey: "nav.platform.parsingImports",
        route: "/platform/analytics/parsing",
      },
      {
        id: "analytics-integrations",
        labelKey: "nav.platform.integrationsHealth",
        route: "/platform/analytics/integrations",
      },
    ],
  },

  {
    id: "platform-security",
    labelKey: "nav.platform.security",
    route: "/platform/security",
    icon: ShieldCheck,
    children: [
      {
        id: "security-audit",
        labelKey: "nav.platform.activityLog",
        route: "/platform/security/audit",
      },
      {
        id: "security-permissions",
        labelKey: "nav.platform.permissionChanges",
        route: "/platform/security/permissions",
      },
      {
        id: "security-deleted",
        labelKey: "nav.platform.deletedRecords",
        route: "/platform/security/deleted",
      },
      {
        id: "security-impersonation",
        labelKey: "nav.platform.impersonationLog",
        route: "/platform/security/impersonation",
      },
      {
        id: "security-suspicious",
        labelKey: "nav.platform.suspiciousActivity",
        route: "/platform/security/suspicious",
      },
    ],
  },

  {
    id: "platform-settings",
    labelKey: "nav.platform.platformSettings",
    route: "/platform/settings",
    icon: Settings,
    children: [
      {
        id: "settings-templates",
        labelKey: "nav.platform.globalTemplates",
        route: "/platform/settings/templates",
      },
      {
        id: "settings-permissions",
        labelKey: "nav.platform.globalPermissions",
        route: "/platform/settings/permissions",
      },
      { id: "settings-ai", labelKey: "nav.platform.aiSettings", route: "/platform/settings/ai" },
      {
        id: "settings-parsing",
        labelKey: "nav.platform.parsingRules",
        route: "/platform/settings/parsing",
      },
      {
        id: "settings-roles",
        labelKey: "nav.platform.roleTemplates",
        route: "/platform/settings/roles",
      },
    ],
  },
  {
    id: "platform-impersonation",
    labelKey: "nav.platform.impersonation",
    route: "/platform/impersonation",
    icon: Eye,
    children: [
      { id: "imp-org", labelKey: "nav.platform.loginAsOrg", route: "/platform/impersonation/org" },
      {
        id: "imp-recruiter",
        labelKey: "nav.platform.loginAsRecruiter",
        route: "/platform/impersonation/recruiter",
      },
      {
        id: "imp-support",
        labelKey: "nav.platform.supportMode",
        route: "/platform/impersonation/support",
      },
    ],
  },
]
