// components
import RoleError from "@/app/_components/layout/zErrors/auth/role";
import AdminSideBar from "@/app/_components/management/admin/header/sidebar";
import ManagerSideBar from "@/app/_components/management/employees/manager/sidebar";
import MarketingSideBar from "@/app/_components/management/employees/marketing/sidebar";
import ServicesSideBar from "@/app/_components/management/employees/services/sidebar";
import CoordinatorSideBar from "@/app/_components/management/employees/coordinator/sidebar";
import CollaboratorSideBar from "@/app/_components/management/employees/collaborator/sidebar";

// prisma types
import { UserRole } from "@/lib/generated/prisma/enums";

export function getSidebarByRole(role: UserRole, name: string) {
  switch (role) {
    case UserRole.ADMIN:
      return <AdminSideBar />;
    case UserRole.MANAGER:
      return <ManagerSideBar name={name} />;
    case UserRole.MARKETER:
      return <MarketingSideBar name={name} />;
    case UserRole.SERVICE:
      return <ServicesSideBar name={name} />;
    case UserRole.COORDINATOR:
      return <CoordinatorSideBar name={name} />;
    case UserRole.COLLABORATOR:
      return <CollaboratorSideBar name={name} />;
    default:
      return <RoleError role={role} />;
  }
}
