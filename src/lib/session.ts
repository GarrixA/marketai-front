import type { PublicUser } from "@/types/auth";
import { displayNameFromUser, resolveDashboardRole } from "@/lib/authRoles";
import { clearMarketplaceStorage } from "@/lib/marketplaceStore";

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
/** Legacy localStorage key. New sessions keep the JWT in the httpOnly access_token cookie. */
const LEGACY_TOKEN_KEY = "soko_access_token";

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
    if (!parsed?.role || !parsed?.userId) return null;
    const token = getStoredToken() || parsed.token || "";
    return { ...parsed, token };
  } catch {
    return null;
  }
}

/** Readable token copy. The durable token is the httpOnly cookie, which JS cannot read. */
export function getStoredToken(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem(LEGACY_TOKEN_KEY);
}

export function setSession(session: UserSession): void {
  const profile = { ...session, token: undefined };
  localStorage.setItem(STORAGE_KEY, JSON.stringify(profile));
  localStorage.removeItem(LEGACY_TOKEN_KEY);
  if (typeof window !== "undefined") {
    window.dispatchEvent(new Event("soko-session"));
  }
}

export function clearSession(): void {
  localStorage.removeItem(STORAGE_KEY);
  localStorage.removeItem(LEGACY_TOKEN_KEY);
  clearMarketplaceStorage();
  if (typeof window !== "undefined") {
    window.dispatchEvent(new Event("soko-session"));
  }
}
