import { PLATFORM_NAV } from '@/config/navigation/platformNav';
import SidebarLayout from './SidebarLayout';

export default function SuperAdminLayout() {
  return <SidebarLayout navItems={PLATFORM_NAV} roleTitle="Platform Admin" sidebarTheme="platform" />;
}