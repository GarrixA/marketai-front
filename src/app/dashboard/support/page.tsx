"use client";

import { RolePage } from "@/components/dashboard/RolePage";
import { SupportTicketsPanel } from "@/components/support/SupportTicketsPanel";

export default function DashboardSupportPage() {
  return <RolePage section="Support">{() => <SupportTicketsPanel />}</RolePage>;
}
