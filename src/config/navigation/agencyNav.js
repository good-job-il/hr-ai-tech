import {
  LayoutDashboard,
  Users,
  Briefcase,
  Kanban,
  FileText,
  DollarSign,
  ContactRound,
  Sparkles,
  PieChart,
  Activity,
  Settings,
  Building2,
} from "lucide-react"

// Staffing Agency Admin / Recruitment Manager Navigation
export const AGENCY_ADMIN_NAV = [
  {
    id: "agency-dashboard",
    labelKey: "nav.agency.dashboard",
    route: "/agency/dashboard",
    icon: LayoutDashboard,
  },

  {
    id: "agency-jobs",
    labelKey: "nav.agency.jobs",
    route: "/agency/jobs",
    icon: Briefcase,
    children: [
      { id: "jobs-open", labelKey: "nav.agency.jobsOpen", route: "/agency/jobs/open" },
      { id: "jobs-filled", labelKey: "nav.agency.jobsFilled", route: "/agency/jobs/filled" },
      { id: "jobs-hold", labelKey: "nav.agency.jobsHold", route: "/agency/jobs/hold" },
    ],
  },
  {
    id: "agency-crm",
    labelKey: "nav.agency.crm",
    route: "/agency/crm",
    icon: ContactRound,
    children: [
      { id: "agency-crm-all", labelKey: "nav.recruiter.allCandidates", route: "/agency/crm/all" },
      {
        id: "agency-crm-active",
        labelKey: "nav.recruiter.activeCandidates",
        route: "/agency/crm/active",
      },
      {
        id: "agency-crm-pipeline",
        labelKey: "nav.recruiter.pipelineCandidates",
        route: "/agency/crm/pipeline",
      },
    ],
  },
  {
    id: "agency-pipeline",
    labelKey: "nav.agency.pipeline",
    route: "/agency/pipeline",
    icon: Kanban,
  },
  {
    id: "agency-ai-matching",
    labelKey: "nav.agency.aiMatching",
    route: "/agency/ai-matching",
    icon: Sparkles,
  },

  {
    id: "agency-clients",
    labelKey: "nav.agency.clients",
    route: "/agency/clients",
    icon: Building2,
  },
  { id: "agency-teams", labelKey: "nav.agency.teams", route: "/agency/teams", icon: Users },

  {
    id: "agency-compensation",
    labelKey: "nav.agency.compensation",
    route: "/agency/compensation",
    icon: DollarSign,
  },
  {
    id: "agency-import",
    labelKey: "nav.agency.importCandidates",
    route: "/agency/import",
    icon: FileText,
  },

  {
    id: "agency-reports",
    labelKey: "nav.agency.reportsInsights",
    route: "/agency/reports",
    icon: PieChart,
  },
  {
    id: "agency-activity",
    labelKey: "nav.agency.activityLog",
    route: "/agency/activity",
    icon: Activity,
  },

  {
    id: "agency-settings",
    labelKey: "nav.agency.orgSettings",
    route: "/agency/settings",
    icon: Settings,
    children: [
      {
        id: "agency-settings-permissions",
        labelKey: "nav.agency.permissions",
        route: "/agency/settings/permissions",
      },
      {
        id: "agency-settings-roles",
        labelKey: "nav.agency.roles",
        route: "/agency/settings/roles",
      },
      {
        id: "agency-settings-billing",
        labelKey: "nav.agency.billing",
        route: "/agency/settings/billing",
      },
      {
        id: "agency-settings-integrations",
        labelKey: "nav.agency.integrations",
        route: "/agency/settings/integrations",
      },
    ],
  },
]

// Agency Recruiter (end-user)
export const AGENCY_RECRUITER_NAV = [
  {
    id: "rec-dashboard",
    labelKey: "nav.recruiter.dashboard",
    route: "/agency/recruiter/dashboard",
    icon: LayoutDashboard,
  },
  {
    id: "rec-candidates",
    labelKey: "nav.recruiter.candidates",
    route: "/agency/recruiter/candidates",
    icon: Users,
    children: [
      {
        id: "rec-candidates-all",
        labelKey: "nav.recruiter.allCandidates",
        route: "/agency/recruiter/candidates/all",
      },
      {
        id: "rec-candidates-active",
        labelKey: "nav.recruiter.activeCandidates",
        route: "/agency/recruiter/candidates/active",
      },
      {
        id: "rec-candidates-pipeline",
        labelKey: "nav.recruiter.pipelineCandidates",
        route: "/agency/recruiter/candidates/pipeline",
      },
    ],
  },
  {
    id: "rec-jobs",
    labelKey: "nav.recruiter.jobs",
    route: "/agency/recruiter/jobs",
    icon: Briefcase,
  },
  {
    id: "rec-crm",
    labelKey: "nav.recruiter.crm",
    route: "/agency/recruiter/crm",
    icon: ContactRound,
  },
  {
    id: "rec-pipeline",
    labelKey: "nav.recruiter.pipeline",
    route: "/agency/recruiter/pipeline",
    icon: Kanban,
  },
  {
    id: "rec-ai",
    labelKey: "nav.recruiter.aiMatching",
    route: "/agency/recruiter/ai-matching",
    icon: Sparkles,
  },
]

// Agency Team Manager
export const AGENCY_TEAM_MANAGER_NAV = [
  {
    id: "tm-dashboard",
    labelKey: "nav.teamManager.dashboard",
    route: "/agency/team/dashboard",
    icon: LayoutDashboard,
  },
  { id: "tm-jobs", labelKey: "nav.teamManager.jobs", route: "/agency/team/jobs", icon: Briefcase },
  {
    id: "tm-crm",
    labelKey: "nav.teamManager.crm",
    route: "/agency/team/crm",
    icon: ContactRound,
    children: [
      { id: "tm-crm-all", labelKey: "nav.recruiter.allCandidates", route: "/agency/team/crm/all" },
      {
        id: "tm-crm-active",
        labelKey: "nav.recruiter.activeCandidates",
        route: "/agency/team/crm/active",
      },
      {
        id: "tm-crm-pipeline",
        labelKey: "nav.recruiter.pipelineCandidates",
        route: "/agency/team/crm/pipeline",
      },
    ],
  },
  {
    id: "tm-pipeline",
    labelKey: "nav.teamManager.pipeline",
    route: "/agency/team/pipeline",
    icon: Kanban,
  },
  {
    id: "tm-compensation",
    labelKey: "nav.teamManager.compensation",
    route: "/agency/team/compensation",
    icon: DollarSign,
  },
  {
    id: "tm-ai",
    labelKey: "nav.teamManager.aiMatching",
    route: "/agency/team/ai-matching",
    icon: Sparkles,
  },
  {
    id: "tm-import",
    labelKey: "nav.teamManager.importCandidates",
    route: "/agency/team/import",
    icon: FileText,
  },
  {
    id: "tm-reports",
    labelKey: "nav.teamManager.reports",
    route: "/agency/team/reports",
    icon: PieChart,
  },
]
