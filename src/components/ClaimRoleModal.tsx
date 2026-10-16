"use client";

import { useState } from "react";
import { Icon } from "@/components/Icon";
import { Logo } from "@/components/Logo";
import { ButtonLoader } from "@/components/ActionLoader";
import { useAppDialog } from "@/hooks/useAppDialog";
import { btn } from "@/lib/ui";
import { formatApiError } from "@/lib/apiError";
import { authService } from "@/services/auth.service";
import type { ClaimableRole } from "@/types/auth";

const ROLE_OPTIONS: {
  role: ClaimableRole;
  title: string;
  description: string;
}[] = [
  {
    role: "BUYER",
    title: "Buyer",
    description: "Source eggs and manage purchase deals.",
  },
  {
    role: "SUPPLIER",
    title: "Supplier",
    description: "List stock and fulfill sell offers.",
  },
  {
    role: "AGGREGATOR",
    title: "Aggregator",
    description: "Buy and sell from one workspace.",
  },
];

type ClaimRoleModalProps = {
  userId: string;
  email: string;
  onClose: () => void;
  onSuccess: () => void;
};

export function ClaimRoleModal({
  userId,
  email,
  onClose,
  onSuccess,
}: ClaimRoleModalProps) {
  const { showError, showSuccess, dialog } = useAppDialog();
  const [role, setRole] = useState<ClaimableRole | "">("");
  const [loading, setLoading] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (loading || !role) return;

    setLoading(true);
    try {
      const result = await authService.claimRole({ userId, role });
      await showSuccess(
        `${result.message} You can now sign in as ${role.toLowerCase()}.`,
        { title: "Role selected", confirmLabel: "Continue to sign in" }
      );
      onSuccess();
    } catch (err) {
      await showError(formatApiError(err), { title: "Could not select role" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      {dialog}
      <div className="fixed inset-0 z-100 grid place-items-center bg-soko-navy/72 p-6 backdrop-blur-sm">
        <div className="relative max-h-[min(90vh,44rem)] w-full max-w-105 overflow-auto rounded-2.5 bg-white px-10.5 py-9 max-sm:px-5 max-sm:py-7.5">
          <button
            type="button"
            className="absolute top-4 right-4 z-2 grid h-9 w-9 place-items-center rounded-full border border-soko-line bg-white disabled:opacity-50"
            onClick={onClose}
            disabled={loading}
            aria-label="Close role selection"
          >
            <Icon name="close" />
          </button>

          <div className="mb-6">
            <Logo />
          </div>

          <span className="text-[0.6875rem] font-extrabold tracking-[0.1375rem] text-soko-green-2 uppercase">
            Step 3 of 3
          </span>
          <h2 className="my-2 font-display text-[1.875rem] font-bold">
            Choose your role
          </h2>
          <p className="mt-0 text-xs text-soko-muted">
            Finish setup for <strong className="text-soko-ink">{email}</strong>.
            Pick how you will use Soko.
          </p>

          <form className="mt-6 space-y-2.5" onSubmit={(e) => void submit(e)}>
            {ROLE_OPTIONS.map((option) => {
              const selected = role === option.role;
              return (
                <label
                  key={option.role}
                  className={`flex cursor-pointer gap-3 rounded-1.25 border p-3.5 ${
                    selected
                      ? "border-soko-navy bg-soko-slate"
                      : "border-soko-line bg-white"
                  }`}
                >
                  <input
                    type="radio"
                    name="role"
                    value={option.role}
                    checked={selected}
                    onChange={() => setRole(option.role)}
                    className="mt-1"
                    disabled={loading}
                    required
                  />
                  <span>
                    <strong className="block text-[0.75rem]">
                      {option.title}
                    </strong>
                    <span className="block text-[0.625rem] text-soko-muted">
                      {option.description}
                    </span>
                  </span>
                </label>
              );
            })}

            <button
              type="submit"
              className={`${btn.primaryCompact} mt-4 w-full sm:px-5.5 sm:py-3.5`}
              disabled={loading || !role}
              aria-busy={loading}
            >
              {loading ? (
                <ButtonLoader label="Saving…" />
              ) : (
                <>
                  Continue <Icon name="arrow" />
                </>
              )}
            </button>
          </form>
        </div>
      </div>
    </>
  );
}
