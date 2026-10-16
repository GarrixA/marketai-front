import type { PublicUser } from "@/types/auth";
import { displayNameFromUser, resolveDashboardRole } from "@/lib/authRoles";

export type DashboardRole =
  "buyer" | "supplier" | "aggregator" | "logistics" | "admin";

export type UserSession = {
  token: string;
  userId: string;
  role: DashboardRole;
  name: string;
  email: string;
  businessName: string;
  roles: string[];
  phone?: string;
  status?: string;
  avatarUrl?: string | null;
};

const STORAGE_KEY = "soko_user_session";
const TOKEN_KEY = "soko_access_token";

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

export function sessionFromLogin(
  accessToken: string,
  user: PublicUser
): UserSession | null {
  const role = resolveDashboardRole(user.roles);
  if (!role) return null;

  const name = displayNameFromUser(user);
  return {
    token: accessToken,
    userId: user.id,
    role,
    name,
    email: user.email,
    businessName: name,
    roles: user.roles,
    phone: user.phone,
    status: user.status,
    avatarUrl: user.avatarUrl ?? null,
  };
}

export function patchSession(
  patch: Partial<Omit<UserSession, "token" | "userId" | "role">>
): UserSession | null {
  const current = getSession();
  if (!current) return null;
  const next = { ...current, ...patch };
  setSession(next);
  return next;
}

export function getSession(): UserSession | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as UserSession;
    if (!parsed?.role || !parsed?.token) return null;
    return parsed;
  } catch {
    return null;
  }
}

export function getStoredToken(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem(TOKEN_KEY) || getSession()?.token || null;
}

export function setSession(session: UserSession): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(session));
  localStorage.setItem(TOKEN_KEY, session.token);
  if (typeof window !== "undefined") {
    window.dispatchEvent(new Event("soko-session"));
  }
}

export function clearSession(): void {
  localStorage.removeItem(STORAGE_KEY);
  localStorage.removeItem(TOKEN_KEY);
}
