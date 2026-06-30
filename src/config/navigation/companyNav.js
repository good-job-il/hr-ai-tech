import {
  LayoutDashboard, Users, Briefcase, Calendar, BarChart3,
  Settings, FileText, Globe, UserCheck, Sparkles,
} from 'lucide-react';

// Company HR Admin Navigation (internal HR department)
export const COMPANY_ADMIN_NAV = [
  { id: 'company-dashboard', labelKey: 'nav.company.dashboard', route: '/company/dashboard', icon: LayoutDashboard },

  {
    id: 'company-jobs', labelKey: 'nav.company.openJobs', route: '/company/jobs', icon: Briefcase,
    children: [
      { id: 'company-jobs-all', labelKey: 'nav.company.allJobs', route: '/company/jobs/all' },
      { id: 'company-jobs-active', labelKey: 'nav.company.activeJobs', route: '/company/jobs/active' },
      { id: 'company-jobs-closed', labelKey: 'nav.company.closedJobs', route: '/company/jobs/closed' },
    ],
  },
  { id: 'company-candidates', labelKey: 'nav.company.candidates', route: '/company/candidates', icon: Users },
  { id: 'company-interviews', labelKey: 'nav.company.interviews', route: '/company/interviews', icon: Calendar },
  { id: 'company-ai-matching', labelKey: 'nav.company.aiMatching', route: '/company/ai-matching', icon: Sparkles },

  {
    id: 'company-hr-team', labelKey: 'nav.company.hrTeam', route: '/company/team', icon: UserCheck,
    children: [
      { id: 'company-team-members', labelKey: 'nav.company.teamMembers', route: '/company/team/members' },
      { id: 'company-internal-recruiters', labelKey: 'nav.company.internalRecruiters', route: '/company/team/recruiters' },
    ],
  },

  {
    id: 'company-analytics', labelKey: 'nav.company.analytics', route: '/company/analytics', icon: BarChart3,
  },

  {
    id: 'company-settings', labelKey: 'nav.company.orgSettings', route: '/company/settings', icon: Settings,
    children: [
      { id: 'company-settings-permissions', labelKey: 'nav.company.permissions', route: '/company/settings/permissions' },
      { id: 'company-settings-integrations', labelKey: 'nav.company.integrations', route: '/company/settings/integrations' },
      { id: 'company-settings-careers', labelKey: 'nav.company.careerPage', route: '/company/settings/careers' },
      { id: 'company-settings-billing', labelKey: 'nav.company.billing', route: '/company/settings/billing' },
    ],
  },
];

// Internal Recruiter (company employee)
export const INTERNAL_RECRUITER_NAV = [
  { id: 'ir-dashboard', labelKey: 'nav.internalRecruiter.dashboard', route: '/company/recruiter/dashboard', icon: LayoutDashboard },
  {
    id: 'ir-jobs', labelKey: 'nav.internalRecruiter.jobs', route: '/company/recruiter/jobs', icon: Briefcase,
  },
  { id: 'ir-candidates', labelKey: 'nav.internalRecruiter.candidates', route: '/company/recruiter/candidates', icon: Users },
  { id: 'ir-interviews', labelKey: 'nav.internalRecruiter.interviews', route: '/company/recruiter/interviews', icon: Calendar },
  { id: 'ir-ai', labelKey: 'nav.internalRecruiter.aiMatching', route: '/company/recruiter/ai-matching', icon: Sparkles },
];
