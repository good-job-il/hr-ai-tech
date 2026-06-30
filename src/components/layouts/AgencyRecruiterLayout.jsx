import { useTranslation } from 'react-i18next';
import { AGENCY_RECRUITER_NAV } from '@/config/navigation/agencyNav';
import SidebarLayout from './SidebarLayout';

export default function AgencyRecruiterLayout() {
  const { i18n } = useTranslation();
  const isRtl = !i18n.language?.startsWith('en');
  return <SidebarLayout navItems={AGENCY_RECRUITER_NAV} roleTitle={isRtl ? 'רכז גיוס' : 'Recruiter'} />;
}
