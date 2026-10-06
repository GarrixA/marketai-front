"use client";

import { BuyRequestsPageContent } from "@/components/dashboard/DashboardPages";
import { RolePage } from "@/components/dashboard/RolePage";

export default function DashboardBuyRequestsPage() {
  return (
    <RolePage section="Buy Requests">
      {(role) => <BuyRequestsPageContent role={role} />}
    </RolePage>
  );
}
