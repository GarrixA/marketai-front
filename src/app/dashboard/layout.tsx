import { DashboardGate } from "@/components/dashboard/DashboardGate";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <DashboardGate>{children}</DashboardGate>;
}
