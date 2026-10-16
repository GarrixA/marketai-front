"use client";

import { OrdersPageContent } from "@/components/dashboard/DashboardPages";
import { RolePage } from "@/components/dashboard/RolePage";

export default function DashboardOrdersPage() {
  return (
    <RolePage section="Orders">
      {(role) => <OrdersPageContent role={role} />}
    </RolePage>
  );
}
