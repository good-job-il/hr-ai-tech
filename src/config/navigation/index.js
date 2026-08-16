// Navigation barrel export — all nav configs in one place
export * from './platformNav';
export * from './agencyNav';
export * from './companyNav';

// Legacy exports kept for any remaining imports
import {
  LayoutDashboard, Users, Briefcase, FileText, MessageSquare, BarChart3,
  Settings, Brain, Zap, TrendingUp, Target, Clock, Award, Sparkles,
  Eye, Filter, Search, Kanban, ContactRound, PieChart, Activity, DollarSign, Bell,
} from 'lucide-react';

// Kept for CandidateLayout (unchanged)
export const CANDIDATE_NAV = [
  { id: 'candidate-dashboard', labelKey: 'nav.candidate.dashboard', route: '/candidate/dashboard', icon: LayoutDashboard },
  { id: 'candidate-profile', labelKey: 'nav.candidate.profile', route: '/candidate/profile', icon: Users },
  {
    id: 'candidate-jobs', labelKey: 'nav.candidate.jobs', route: '/candidate/jobs', icon: Briefcase,
    children: [
      { id: 'all-jobs', labelKey: 'common.all', route: '/candidate/jobs/all' },
      { id: 'recommended', label: 'AI Recommended', route: '/candidate/jobs/recommended' },
      { id: 'saved', labelKey: 'candidate.savedJobs.title', route: '/candidate/jobs/saved', badge: 5 },
    ],
  },
  { id: 'candidate-applications', labelKey: 'nav.candidate.applications', route: '/candidate/applications', icon: FileText, badge: 2 },
  { id: 'candidate-interviews', labelKey: 'nav.candidate.interviews', route: '/candidate/interviews', icon: Eye },
  { id: 'candidate-messages', labelKey: 'nav.candidate.messages', route: '/candidate/messages', icon: MessageSquare },
  { id: 'candidate-notifications', label: 'Notifications', route: '/candidate/notifications', icon: Bell },
];

// Kept for EmployerLayout (legacy)
export const EMPLOYER_NAV = [
  { id: 'employer-dashboard', labelKey: 'common.dashboard', route: '/employer/dashboard', icon: LayoutDashboard },
  { id: 'employer-jobs', labelKey: 'common.jobs', route: '/employer/jobs', icon: Briefcase },
  { id: 'employer-candidates', labelKey: 'common.candidates', route: '/employer/candidates', icon: Users },
  { id: 'employer-pipeline', labelKey: 'pipeline.title', route: '/employer/pipeline', icon: Kanban },
  { id: 'employer-analytics', labelKey: 'common.analytics', route: '/employer/analytics', icon: BarChart3 },
  { id: 'employer-settings', labelKey: 'common.settings', route: '/employer/settings', icon: Settings },
];

// Legacy — kept only to prevent import errors in old files
export const ADMIN_NAV = [];
export const RECRUITER_NAV = [];
export const RECRUITMENT_MANAGER_NAV = [];
export const AI_WORKSPACE_NAV = [];

export default { CANDIDATE_NAV, EMPLOYER_NAV, ADMIN_NAV, RECRUITER_NAV, RECRUITMENT_MANAGER_NAV, AI_WORKSPACE_NAV };
