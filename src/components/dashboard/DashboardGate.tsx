"use client";

import { useEffect, useSyncExternalStore, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import { DashboardShell } from "@/components/dashboard/DashboardShell";
import { getSessionSnapshot, subscribeSession } from "@/lib/session";

export function DashboardGate({ children }: { children: ReactNode }) {
  const router = useRouter();
  const session = useSyncExternalStore(
    subscribeSession,
    getSessionSnapshot,
    () => null
  );

  useEffect(() => {
    if (!session) router.replace("/");
  }, [session, router]);

  if (!session) return null;

  return <DashboardShell role={session.role}>{children}</DashboardShell>;
}
