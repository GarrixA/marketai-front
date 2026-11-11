"use client";

import { useEffect, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import { DashboardShell } from "@/components/dashboard/DashboardShell";
import { useIsClient, useSession } from "@/lib/session";

export function DashboardGate({ children }: { children: ReactNode }) {
  const router = useRouter();
  const isClient = useIsClient();
  const session = useSession();

  useEffect(() => {
    // Wait until after hydration so localStorage session is available.
    if (!isClient) return;
    if (!session) router.replace("/");
  }, [isClient, session, router]);

  if (!isClient || !session) return null;

  return <DashboardShell role={session.role}>{children}</DashboardShell>;
}
