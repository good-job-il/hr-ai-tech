import { useAuth } from '@/lib/AuthContext';
import { useTranslation } from 'react-i18next';
import { AGENCY_ADMIN_NAV, AGENCY_TEAM_MANAGER_NAV } from '@/config/navigation/agencyNav';
import SidebarLayout from './SidebarLayout';
import { usePermissionMatrix } from '@/hooks/usePermissionMatrix';

export default function StaffingAgencyLayout() {
  const { user } = useAuth();
  const { i18n } = useTranslation();
  const isRtl = !i18n.language?.startsWith('en');
  const role = user?.role;
  const { can } = usePermissionMatrix();

  const nav = role === 'team_manager'
    ? AGENCY_TEAM_MANAGER_NAV
    : AGENCY_ADMIN_NAV.filter(item => item.id !== 'agency-settings' || can('manage_settings'));
  const title = role === 'team_manager'
    ? (isRtl ? 'מנהל צוות' : 'Team Manager')
    : (isRtl ? 'מנהל גיוס' : 'Recruitment Manager');

  return <SidebarLayout navItems={nav} roleTitle={title} />;
}
