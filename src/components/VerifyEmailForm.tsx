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

type VerifyEmailFormProps = {
  token: string;
};

export function VerifyEmailForm({ token }: VerifyEmailFormProps) {
  const { t } = useTranslation("auth");
  const router = useRouter();
  const { showError, showSuccess, dialog } = useAppDialog();
  const [code, setCode] = useState("");
  const [loading, setLoading] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (loading) return;

    const normalized = code.trim();
    if (!/^\d{6}$/.test(normalized)) {
      await showError(t("verifyEmail.invalidCode"), {
        title: t("verifyEmail.invalidCodeTitle"),
      });
      return;
    }

    setLoading(true);
    try {
      const result = await authService.verifyEmail(token, normalized);

      if (result.nextAction === "SELECT_ROLE" && result.userId) {
        await showSuccess(result.message, {
          title: t("verifyEmail.successTitle"),
          confirmLabel: t("verifyEmail.selectRole"),
        });
        router.push(
          `/?auth=claim-role&userId=${encodeURIComponent(result.userId)}&email=${encodeURIComponent(result.email)}`
        );
        return;
      }

      await showSuccess(result.message, {
        title: t("verifyEmail.successTitle"),
        confirmLabel: t("verifyEmail.goToSignIn"),
      });
      router.push("/?auth=login");
    } catch (err) {
      await showError(formatApiError(err), {
        title: t("verifyEmail.failedTitle"),
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
            {t("verifyEmail.eyebrow")}
          </span>
          <h1 className="my-2 font-display text-[1.875rem] font-bold">
            {t("verifyEmail.title")}
          </h1>
          <p className="mt-0 text-xs text-soko-muted">
            {t("verifyEmail.description")}
          </p>

          <form className="mt-6" onSubmit={(e) => void submit(e)}>
            <label className="mb-3.5 block text-[0.625rem] font-bold">
              {t("verifyEmail.code")}
              <input
                type="text"
                inputMode="numeric"
                pattern="[0-9]{6}"
                maxLength={6}
                value={code}
                onChange={(e) =>
                  setCode(e.target.value.replace(/\D/g, "").slice(0, 6))
                }
                className="mt-1.5 block w-full rounded-1.25 border border-soko-line p-2.75 text-center text-lg tracking-[0.28em] outline-soko-navy disabled:opacity-60"
                placeholder={t("verifyEmail.codePlaceholder")}
                autoComplete="one-time-code"
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
                <ButtonLoader label={t("verifyEmail.submitting")} />
              ) : (
                <>
                  {t("verifyEmail.submit")} <Icon name="arrow" />
                </>
              )}
            </button>
          </form>

          <p className="mt-5 mb-0 text-center text-xs text-soko-muted">
            {t("verifyEmail.alreadyVerified")}{" "}
            <button
              type="button"
              className="border-0 bg-transparent p-0 font-bold text-soko-navy underline-offset-2 hover:underline"
              onClick={() => router.push("/?auth=login")}
              disabled={loading}
            >
              {t("common.signIn")}
            </button>
          </p>
        </div>
      </div>
    </>
  );
}
