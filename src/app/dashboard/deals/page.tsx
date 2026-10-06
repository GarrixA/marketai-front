"use client";

import { DealsPageContent } from "@/components/dashboard/DashboardPages";
import { RolePage } from "@/components/dashboard/RolePage";

export default function DashboardDealsPage() {
  return (
    <RolePage section="Deals">
      {(role) => <DealsPageContent role={role} />}
    </RolePage>
  );
}
