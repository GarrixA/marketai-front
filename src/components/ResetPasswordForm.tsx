"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Icon } from "@/components/Icon";
import { Logo } from "@/components/Logo";
import { ButtonLoader } from "@/components/ActionLoader";
import { useAppDialog } from "@/hooks/useAppDialog";
import { btn } from "@/lib/ui";
import { formatApiError } from "@/lib/apiError";
import { authService } from "@/services/auth.service";

type ResetPasswordFormProps = {
  token: string;
};

export function ResetPasswordForm({ token }: ResetPasswordFormProps) {
  const router = useRouter();
  const { showError, showSuccess, dialog } = useAppDialog();
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (loading) return;

    if (password !== confirmPassword) {
      await showError("Passwords do not match.", {
        title: "Check your password",
      });
      return;
    }

    setLoading(true);
    try {
      const result = await authService.resetPassword(token, {
        password,
        confirmPassword,
      });
      await showSuccess(result.message, {
        title: "Password updated",
        confirmLabel: "Go to sign in",
      });
      router.push("/?auth=login");
    } catch (err) {
      await showError(formatApiError(err), { title: "Reset failed" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      {dialog}
      <div className="flex min-h-screen items-center justify-center bg-soko-slate p-6">
        <div className="w-full max-w-105 rounded-2.5 border border-soko-line bg-white px-10.5 py-9 max-sm:px-5 max-sm:py-7.5">
          <div className="mb-6">
            <Logo onHome={() => router.push("/")} />
          </div>

          <span className="text-[0.6875rem] font-extrabold tracking-[0.1375rem] text-soko-green-2 uppercase">
            Password reset
          </span>
          <h1 className="my-2 font-display text-[1.875rem] font-bold">
            Choose a new password
          </h1>
          <p className="mt-0 text-xs text-soko-muted">
            Enter a new password for your MarketAI account.
          </p>

          <form className="mt-6" onSubmit={(e) => void submit(e)}>
            <label className="mb-3.5 block text-[0.625rem] font-bold">
              New password
              <span className="relative mt-1.5 block">
                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="block w-full rounded-1.25 border border-soko-line p-2.75 pr-10 text-xs outline-soko-navy disabled:opacity-60"
                  placeholder="At least 8 characters"
                  autoComplete="new-password"
                  required
                  minLength={8}
                  disabled={loading}
                />
                <button
                  type="button"
                  className="absolute top-1/2 right-2.5 grid -translate-y-1/2 place-items-center border-0 bg-transparent p-0.5 text-soko-muted hover:text-soko-navy"
                  onClick={() => setShowPassword((v) => !v)}
                  aria-label={showPassword ? "Hide password" : "Show password"}
                  disabled={loading}
                >
                  <Icon name={showPassword ? "eyeOff" : "eye"} size={16} />
                </button>
              </span>
            </label>

            <label className="mb-3.5 block text-[0.625rem] font-bold">
              Confirm password
              <input
                type={showPassword ? "text" : "password"}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="mt-1.5 block w-full rounded-1.25 border border-soko-line p-2.75 text-xs outline-soko-navy disabled:opacity-60"
                placeholder="Repeat password"
                autoComplete="new-password"
                required
                minLength={8}
                disabled={loading}
              />
            </label>

            <button
              type="submit"
              className={`${btn.primaryCompact} w-full sm:px-5.5 sm:py-3.5`}
              disabled={loading}
              aria-busy={loading}
            >
              {loading ? (
                <ButtonLoader label="Updating…" />
              ) : (
                <>
                  Reset password <Icon name="arrow" />
                </>
              )}
            </button>
          </form>
        </div>
      </div>
    </>
  );
}
