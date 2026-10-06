export type DashboardRole =
  | "buyer"
  | "supplier"
  | "aggregator"
  | "logistics"
  | "admin";

export type UserSession = {
  role: DashboardRole;
  name: string;
  email: string;
  businessName: string;
};

const STORAGE_KEY = "soko_user_session";

export function dashboardRoleFromRegistrationIndex(
  index: number
): DashboardRole {
  const roles: DashboardRole[] = [
    "buyer",
    "supplier",
    "aggregator",
    "logistics",
  ];
  return roles[index] ?? "buyer";
}

export function getSession(): UserSession | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as UserSession;
    if (!parsed?.role) return null;
    return parsed;
  } catch {
    return null;
  }
}

export function setSession(session: UserSession): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(session));
}

export function clearSession(): void {
  localStorage.removeItem(STORAGE_KEY);
}
