"use client";

import type { ButtonHTMLAttributes, ReactNode } from "react";
import { Icon } from "@/components/Icon";

export type ActionButtonVariant =
  "sell" | "buy" | "edit" | "remove" | "primary" | "outline" | "ghost";

export type ActionButtonSize = "sm" | "md";

export type ActionButtonShape = "rounded" | "pill";

type ActionButtonProps = {
  variant?: ActionButtonVariant;
  size?: ActionButtonSize;
  shape?: ActionButtonShape;
  icon?: string | null;
  iconPosition?: "left" | "right";
  children: ReactNode;
  fullWidth?: boolean;
  className?: string;
} & Omit<ButtonHTMLAttributes<HTMLButtonElement>, "className">;

const variantClass: Record<ActionButtonVariant, string> = {
  sell: "border-transparent bg-[#ef4444] text-white shadow-sm hover:bg-[#dc2626] active:bg-[#b91c1c]",
  buy: "border-transparent bg-[#22c55e] text-white shadow-sm hover:bg-[#16a34a] active:bg-[#15803d]",
  edit: "border-soko-navy/15 bg-soko-navy/[0.06] text-soko-navy hover:bg-soko-navy/10 active:bg-soko-navy/15",
  remove:
    "border-[#fecaca] bg-[#fef2f2] text-[#b42318] hover:bg-[#fee2e2] active:bg-[#fecaca]",
  primary:
    "border-transparent bg-soko-navy text-white hover:bg-soko-navy-2 active:bg-soko-dark",
  outline:
    "border-soko-line bg-white text-soko-ink hover:bg-soko-slate active:bg-soko-line/40",
  ghost:
    "border-transparent bg-transparent text-soko-muted hover:text-soko-ink",
};

const sizeClass: Record<ActionButtonSize, string> = {
  sm: "min-h-8 gap-1.5 px-2.5 py-1.5 text-[0.6875rem] sm:min-h-8.5 sm:px-3 sm:text-[0.75rem]",
  md: "min-h-10 gap-2 px-3.5 py-2.5 text-[0.8125rem] sm:min-h-10.5 sm:px-4.5 sm:py-3 sm:text-sm",
};

const shapeClass: Record<ActionButtonShape, string> = {
  rounded: "rounded-md",
  pill: "rounded-full",
};

const iconSize: Record<ActionButtonSize, number> = {
  sm: 14,
  md: 16,
};

const defaultIcon: Partial<Record<ActionButtonVariant, string>> = {
  sell: "tag",
  buy: "cart",
  edit: "edit",
  remove: "trash",
};

export function ActionButton({
  variant = "outline",
  size = "sm",
  shape = "rounded",
  icon,
  iconPosition = "left",
  children,
  fullWidth = false,
  disabled,
  className = "",
  type = "button",
  ...rest
}: ActionButtonProps) {
  const resolvedIcon =
    icon === null ? null : (icon ?? defaultIcon[variant] ?? null);
  const iconEl = resolvedIcon ? (
    <Icon name={resolvedIcon} size={iconSize[size]} className="shrink-0" />
  ) : null;

  return (
    <button
      type={type}
      disabled={disabled}
      className={[
        "inline-flex items-center justify-center border font-bold transition-colors",
        "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-soko-navy",
        "disabled:pointer-events-none disabled:opacity-45",
        variantClass[variant],
        sizeClass[size],
        shapeClass[shape],
        fullWidth ? "w-full" : "",
        className,
      ]
        .filter(Boolean)
        .join(" ")}
      {...rest}
    >
      {iconPosition === "left" ? iconEl : null}
      <span className="truncate">{children}</span>
      {iconPosition === "right" ? iconEl : null}
    </button>
  );
}

export type ActionToggleOption<T extends string> = {
  value: T;
  label: string;
  icon?: string;
  activeVariant?: Extract<ActionButtonVariant, "buy" | "sell" | "primary">;
};

type ActionToggleProps<T extends string> = {
  value: T;
  options: ActionToggleOption<T>[];
  onChange: (value: T) => void;
  size?: ActionButtonSize;
  className?: string;
};

/** Pill segmented control built from ActionButton (e.g. Buy / Sell). */
export function ActionToggle<T extends string>({
  value,
  options,
  onChange,
  size = "sm",
  className = "",
}: ActionToggleProps<T>) {
  return (
    <div
      className={["inline-flex rounded-full bg-soko-slate p-1", className]
        .filter(Boolean)
        .join(" ")}
      role="tablist"
    >
      {options.map((option) => {
        const active = option.value === value;
        const activeVariant = option.activeVariant ?? "primary";
        return (
          <ActionButton
            key={option.value}
            role="tab"
            aria-selected={active}
            size={size}
            shape="pill"
            variant={active ? activeVariant : "ghost"}
            icon={option.icon}
            onClick={() => onChange(option.value)}
            className={active ? "" : "shadow-none"}
          >
            {option.label}
          </ActionButton>
        );
      })}
    </div>
  );
}
