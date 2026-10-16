import { BASE_API_URL } from "@/utils/config/keys";

export function resolveMediaUrl(
  path: string | null | undefined
): string | null {
  if (!path) return null;
  if (/^https?:\/\//i.test(path) || path.startsWith("data:")) return path;

  const origin = BASE_API_URL.replace(/\/api\/v1\/?$/i, "");
  return `${origin}${path.startsWith("/") ? path : `/${path}`}`;
}
