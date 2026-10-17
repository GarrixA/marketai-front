export const API_TAGS = [
  "Auth",
  "Users",
  "Roles",
  "Products",
  "Support",
  "Deals",
  "Requests",
] as const;

export type ApiTag = (typeof API_TAGS)[number];
