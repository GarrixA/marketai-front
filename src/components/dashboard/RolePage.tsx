"use client";

import { useEffect, useState, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import { getSession, type DashboardRole } from "@/lib/session";
import {
  roleCanAccess,
  SECTION_PATH,
  type DashboardSection,
} from "@/lib/dashboardNav";

export function useDashboardRole() {
  const router = useRouter();
  const [role, setRole] = useState<DashboardRole | null>(null);

  useEffect(() => {
    const session = getSession();
    if (!session) {
      router.replace("/");
      return;
    }
    setRole(session.role);
  }, [router]);

  return role;
}

export function RolePage({
  section,
  children,
}: {
  section: DashboardSection;
  children: (role: DashboardRole) => ReactNode;
}) {
  const role = useDashboardRole();
  const router = useRouter();

  useEffect(() => {
    if (!role) return;
    if (!roleCanAccess(role, section)) {
      router.replace(SECTION_PATH.Overview);
    }
  }, [role, section, router]);

  if (!role || !roleCanAccess(role, section)) return null;
  return <>{children(role)}</>;
}
