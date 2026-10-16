import type { DashboardRole } from "@/lib/session";

const ROLE_PRIORITY: DashboardRole[] = [
  "admin",
  "logistics",
  "aggregator",
  "supplier",
  "buyer",
];

export function mapApiRoleToDashboard(role: string): DashboardRole | null {
  const normalized = role.trim().toUpperCase();
  switch (normalized) {
    case "ADMIN":
    case "SUPER_ADMIN":
      return "admin";
    case "BUYER":
      return "buyer";
    case "SUPPLIER":
      return "supplier";
    case "AGGREGATOR":
      return "aggregator";
    case "DRIVER":
    case "LOGISTICS":
      return "logistics";
    default:
      return null;
  }
}

/** Pick the highest-privilege dashboard role from API role names. */
export function resolveDashboardRole(roles: string[]): DashboardRole | null {
  const mapped = roles
    .map(mapApiRoleToDashboard)
    .filter((role): role is DashboardRole => role !== null);

  for (const preferred of ROLE_PRIORITY) {
    if (mapped.includes(preferred)) return preferred;
  }
  return null;
}

export function displayNameFromUser(user: {
  firstName: string;
  lastName: string;
}): string {
  return `${user.firstName} ${user.lastName}`.trim();
}
