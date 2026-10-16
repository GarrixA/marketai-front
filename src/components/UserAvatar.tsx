"use client";

import { Icon } from "@/components/Icon";
import { resolveMediaUrl } from "@/lib/mediaUrl";

type Props = {
  name?: string | null;
  avatarUrl?: string | null;
  size?: "sm" | "md" | "lg";
  className?: string;
  fallback?: "initials" | "icon";
};

const sizeClass = {
  sm: "h-7.5 w-7.5 text-[0.625rem]",
  md: "h-9 w-9 text-[0.6875rem]",
  lg: "h-14 w-14 text-sm",
} as const;

const iconSize = {
  sm: 15,
  md: 18,
  lg: 22,
} as const;

function initialsFromName(name: string | null | undefined) {
  if (!name?.trim()) return "";
  return name
    .split(/\s+/)
    .filter(Boolean)
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

export function UserAvatar({
  name,
  avatarUrl,
  size = "md",
  className = "",
  fallback = "initials",
}: Props) {
  const src = resolveMediaUrl(avatarUrl);
  const initials = initialsFromName(name);

  return (
    <span
      className={`relative inline-grid shrink-0 place-items-center overflow-hidden rounded-full bg-soko-slate font-extrabold text-soko-ink ${sizeClass[size]} ${className}`}
    >
      {src ? (
        <img
          src={src}
          alt={name ? `${name} profile` : "Profile"}
          className="h-full w-full object-cover"
        />
      ) : fallback === "icon" || !initials ? (
        <Icon name="user" size={iconSize[size]} />
      ) : (
        initials
      )}
    </span>
  );
}
