import { getStoredToken } from "@/lib/session";

const PUBLIC_AUTH_ENDPOINTS = new Set([
  "login",
  "register",
  "verifyEmail",
  "claimRole",
  "forgotPassword",
  "resetPassword",
  "resendVerification",
]);

export function getAuthToken(
  reduxToken: string | undefined,
  endpoint?: string
): string | undefined {
  if (endpoint && PUBLIC_AUTH_ENDPOINTS.has(endpoint)) {
    return undefined;
  }
  return reduxToken || getStoredToken() || undefined;
}
