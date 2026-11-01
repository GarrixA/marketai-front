"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import useTranslation from "next-translate/useTranslation";
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
  const { t } = useTranslation("auth");
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
      await showError(t("resetPassword.passwordMismatch"), {
        title: t("resetPassword.passwordMismatchTitle"),
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
        title: t("resetPassword.successTitle"),
        confirmLabel: t("resetPassword.goToSignIn"),
      });
      router.push("/?auth=login");
    } catch (err) {
      await showError(formatApiError(err), {
        title: t("resetPassword.failedTitle"),
      });
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
            {t("resetPassword.eyebrow")}
          </span>
          <h1 className="my-2 font-display text-[1.875rem] font-bold">
            {t("resetPassword.title")}
          </h1>
          <p className="mt-0 text-xs text-soko-muted">
            {t("resetPassword.description")}
          </p>

          <form className="mt-6" onSubmit={(e) => void submit(e)}>
            <label className="mb-3.5 block text-[0.625rem] font-bold">
              {t("resetPassword.newPassword")}
              <span className="relative mt-1.5 block">
                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="block w-full rounded-1.25 border border-soko-line p-2.75 pr-10 text-xs outline-soko-navy disabled:opacity-60"
                  placeholder={t("resetPassword.passwordPlaceholder")}
                  autoComplete="new-password"
                  required
                  minLength={8}
                  disabled={loading}
                />
                <button
                  type="button"
                  className="absolute top-1/2 right-2.5 grid -translate-y-1/2 place-items-center border-0 bg-transparent p-0.5 text-soko-muted hover:text-soko-navy"
                  onClick={() => setShowPassword((v) => !v)}
                  aria-label={
                    showPassword
                      ? t("common.hidePassword")
                      : t("common.showPassword")
                  }
                  disabled={loading}
                >
                  <Icon name={showPassword ? "eyeOff" : "eye"} size={16} />
                </button>
              </span>
            </label>

            <label className="mb-3.5 block text-[0.625rem] font-bold">
              {t("resetPassword.confirmPassword")}
              <input
                type={showPassword ? "text" : "password"}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="mt-1.5 block w-full rounded-1.25 border border-soko-line p-2.75 text-xs outline-soko-navy disabled:opacity-60"
                placeholder={t("resetPassword.confirmPasswordPlaceholder")}
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
                <ButtonLoader label={t("resetPassword.submitting")} />
              ) : (
                <>
                  {t("resetPassword.submit")} <Icon name="arrow" />
                </>
              )}
            </button>
          </form>
        </div>
      </div>
    </>
  );
}
