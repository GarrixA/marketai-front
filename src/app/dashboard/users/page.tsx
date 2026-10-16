"use client";

import { UsersManagement } from "@/components/dashboard/UsersManagement";
import { RolePage } from "@/components/dashboard/RolePage";

export default function DashboardUsersPage() {
  return <RolePage section="Users">{() => <UsersManagement />}</RolePage>;
}
