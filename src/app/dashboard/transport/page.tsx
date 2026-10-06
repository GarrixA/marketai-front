"use client";

import { TransportPageContent } from "@/components/dashboard/DashboardPages";
import { RolePage } from "@/components/dashboard/RolePage";

export default function DashboardTransportPage() {
  return (
    <RolePage section="Transport">
      {() => <TransportPageContent />}
    </RolePage>
  );
}
