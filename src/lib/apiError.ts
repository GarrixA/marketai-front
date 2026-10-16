import type { IncompleteRegistrationError } from "@/types/auth";

/** Shared RTK Query / fetch error message extractor. */
export function formatApiError(error: unknown): string {
  if (error instanceof Error && error.message) {
    return error.message;
  }

  if (!error || typeof error !== "object") {
    return "Something went wrong. Please try again.";
  }

  const err = error as {
    status?: number | string;
    data?: {
      message?: string | string[];
      missingActionLabel?: string;
    };
  };

  const data = err.data;
  // Prefer the API `message` — never surface missingActionLabel as the primary copy.
  if (Array.isArray(data?.message)) return data.message.join(", ");
  if (typeof data?.message === "string" && data.message.trim()) {
    return data.message;
  }
  if (err.status === 401) return "Invalid email or password.";
  return "Something went wrong. Please try again.";
}

export function getIncompleteRegistration(
  error: unknown
): IncompleteRegistrationError | null {
  if (!error || typeof error !== "object") return null;
  const data = (error as { data?: IncompleteRegistrationError }).data;
  if (!data?.missingAction || typeof data.message !== "string") return null;
  return data;
}
