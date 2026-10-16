"use client";

import { LogisticsIncome } from "@/components/dashboard/LogisticsIncome";
import { RolePage } from "@/components/dashboard/RolePage";

export default function DashboardIncomePage() {
  return <RolePage section="Income">{() => <LogisticsIncome />}</RolePage>;
}
