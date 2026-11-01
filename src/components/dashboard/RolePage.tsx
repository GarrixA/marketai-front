"use client";

import { useEffect, useSyncExternalStore, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import {
  getSessionSnapshot,
  subscribeSession,
  type DashboardRole,
} from "@/lib/session";
import {
  roleCanAccess,
  SECTION_PATH,
  type DashboardSection,
} from "@/lib/dashboardNav";

export function useDashboardRole() {
  const router = useRouter();
  const session = useSyncExternalStore(
    subscribeSession,
    getSessionSnapshot,
    () => null
  );

  useEffect(() => {
    if (!session) router.replace("/");
  }, [session, router]);

  return session?.role ?? null;
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
