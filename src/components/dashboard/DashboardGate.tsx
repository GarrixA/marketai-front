"use client";

import { useEffect, useState, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import { DashboardShell } from "@/components/dashboard/DashboardShell";
import { getSession, type DashboardRole } from "@/lib/session";

export function DashboardGate({ children }: { children: ReactNode }) {
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

  if (!role) return null;

  return <DashboardShell role={role}>{children}</DashboardShell>;
}
