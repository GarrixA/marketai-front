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

export function ForgotPasswordForm() {
  const { t } = useTranslation("auth");
  const router = useRouter();
  const { showError, dialog } = useAppDialog();
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (loading) return;

    setLoading(true);
    try {
      await authService.forgotPassword(email.trim().toLowerCase());
      setSent(true);
    } catch (err) {
      await showError(formatApiError(err), {
        title: t("forgotPassword.failedTitle"),
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
            {t("forgotPassword.eyebrow")}
          </span>
          <h1 className="my-2 font-display text-[1.875rem] font-bold">
            {sent
              ? t("forgotPassword.successTitle")
              : t("forgotPassword.title")}
          </h1>
          <p className="mt-0 text-xs text-soko-muted">
            {sent
              ? t("forgotPassword.successDescription")
              : t("forgotPassword.description")}
          </p>

          {sent ? (
            <button
              type="button"
              className={`${btn.primaryCompact} mt-6 w-full sm:px-5.5 sm:py-3.5`}
              onClick={() => router.push("/?auth=login")}
            >
              {t("forgotPassword.goToSignIn")} <Icon name="arrow" />
            </button>
          ) : (
            <>
              <form className="mt-6" onSubmit={(e) => void submit(e)}>
                <label className="mb-3.5 block text-[0.625rem] font-bold">
                  {t("common.email")}
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="mt-1.5 block w-full rounded-1.25 border border-soko-line p-2.75 text-xs outline-soko-navy disabled:opacity-60"
                    placeholder={t("common.emailPlaceholder")}
                    autoComplete="email"
                    required
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
                    <ButtonLoader label={t("forgotPassword.submitting")} />
                  ) : (
                    <>
                      {t("forgotPassword.submit")} <Icon name="arrow" />
                    </>
                  )}
                </button>
              </form>

              <p className="mt-5 mb-0 text-center text-xs text-soko-muted">
                {t("forgotPassword.rememberPassword")}{" "}
                <button
                  type="button"
                  className="border-0 bg-transparent p-0 font-bold text-soko-navy underline-offset-2 hover:underline disabled:opacity-50"
                  onClick={() => router.push("/?auth=login")}
                  disabled={loading}
                >
                  {t("common.signIn")}
                </button>
              </p>
            </>
          )}
        </div>
      </div>
    </>
  );
}
