import type { DashboardRole } from "@/lib/session";

export type MockUser = {
  email: string;
  password: string;
  name: string;
  businessName: string;
  role: DashboardRole;
};

export const MOCK_USERS: MockUser[] = [
  {
    email: "buyer@soko.rw",
    password: "buyer123",
    name: "Aline Kabera",
    businessName: "Kigali Fresh Foods",
    role: "buyer",
  },
  {
    email: "supplier@soko.rw",
    password: "supplier123",
    name: "Musanze Growers",
    businessName: "Musanze Growers Co-op",
    role: "supplier",
  },
  {
    email: "aggregator@soko.rw",
    password: "aggregator123",
    name: "Eric Mugisha",
    businessName: "Northern Egg Hub",
    role: "aggregator",
  },
  {
    email: "logistics@soko.rw",
    password: "logistics123",
    name: "Jean Niyonzima",
    businessName: "SwiftRoute Logistics",
    role: "logistics",
  },
  {
    email: "admin@soko.rw",
    password: "admin123",
    name: "Aline Kabera",
    businessName: "Soko Operations",
    role: "admin",
  },
];

export function authenticateMockUser(
  email: string,
  password: string
): MockUser | null {
  const normalized = email.trim().toLowerCase();
  return (
    MOCK_USERS.find(
      (user) =>
        user.email === normalized && user.password === password
    ) ?? null
  );
}
