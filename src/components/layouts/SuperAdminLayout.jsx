import { PLATFORM_NAV } from "@/config/navigation/platformNav"

export default function SuperAdminLayout() {
  return <SidebarLayout navItems={PLATFORM_NAV} roleTitle="Platform Admin" platformStyle />
}
import SidebarLayout from "./SidebarLayout"
