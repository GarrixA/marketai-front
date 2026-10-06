"use client";

import { OverviewPageContent } from "@/components/dashboard/DashboardPages";
import { RolePage } from "@/components/dashboard/RolePage";

export default function DashboardOverviewPage() {
  return (
    <RolePage section="Overview">
      {(role) => <OverviewPageContent role={role} />}
    </RolePage>
  );
}
