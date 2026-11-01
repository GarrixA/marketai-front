"use client";

import { useState } from "react";
import useTranslation from "next-translate/useTranslation";
import { Icon } from "@/components/Icon";
import { Logo } from "@/components/Logo";
import { ButtonLoader } from "@/components/ActionLoader";
import { useAppDialog } from "@/hooks/useAppDialog";
import { btn } from "@/lib/ui";
import { formatApiError } from "@/lib/apiError";
import { authService } from "@/services/auth.service";

type RegisterModalProps = {
  onClose: () => void;
  onSwitchToLogin: () => void;
};

const emptyForm = () => ({
  firstName: "",
  lastName: "",
  email: "",
  phone: "",
  password: "",
  confirmPassword: "",
});

export function RegisterModal({
  onClose,
  onSwitchToLogin,
}: RegisterModalProps) {
  const { t } = useTranslation("auth");
  const { showError, showSuccess, dialog } = useAppDialog();
  const [form, setForm] = useState(emptyForm);
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const setField = (key: keyof ReturnType<typeof emptyForm>, value: string) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (loading) return;

    if (form.password !== form.confirmPassword) {
      void showError(t("register.passwordMismatch"), {
        title: t("register.passwordMismatchTitle"),
      });
      return;
    }

    setLoading(true);
    try {
      const result = await authService.register({
        email: form.email.trim().toLowerCase(),
        phone: form.phone.trim(),
        password: form.password,
        confirmPassword: form.confirmPassword,
        firstName: form.firstName.trim(),
        lastName: form.lastName.trim(),
      });
      setForm(emptyForm());
      await showSuccess(
        t("register.successMessage", {
          message: result.message,
          email: result.email,
        }),
        { title: t("register.successTitle"), confirmLabel: t("common.ok") }
      );
      onClose();
    } catch (err) {
      await showError(formatApiError(err), {
        title: t("register.failedTitle"),
      });
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
            aria-label={t("register.close")}
          >
            <Icon name="close" />
          </button>

          <div className="mb-6">
            <Logo />
          </div>

          <span className="text-[0.6875rem] font-extrabold tracking-[0.1375rem] text-soko-green-2 uppercase">
            {t("register.eyebrow")}
          </span>
          <h2 className="my-2 font-display text-[1.875rem] font-bold">
            {t("register.title")}
          </h2>
          <p className="mt-0 text-xs text-soko-muted">
            {t("register.description")}
          </p>

          <form className="mt-6" onSubmit={(e) => void submit(e)}>
            <div className="grid gap-3.5 sm:grid-cols-2">
              <label className="block text-[0.625rem] font-bold">
                {t("register.firstName")}
                <input
                  type="text"
                  value={form.firstName}
                  onChange={(e) => setField("firstName", e.target.value)}
                  className="mt-1.5 block w-full rounded-1.25 border border-soko-line p-2.75 text-xs outline-soko-navy disabled:opacity-60"
                  placeholder={t("register.firstNamePlaceholder")}
                  autoComplete="given-name"
                  required
                  disabled={loading}
                />
              </label>
              <label className="block text-[0.625rem] font-bold">
                {t("register.lastName")}
                <input
                  type="text"
                  value={form.lastName}
                  onChange={(e) => setField("lastName", e.target.value)}
                  className="mt-1.5 block w-full rounded-1.25 border border-soko-line p-2.75 text-xs outline-soko-navy disabled:opacity-60"
                  placeholder={t("register.lastNamePlaceholder")}
                  autoComplete="family-name"
                  required
                  disabled={loading}
                />
              </label>
            </div>

            <label className="mt-3.5 block text-[0.625rem] font-bold">
              {t("common.email")}
              <input
                type="email"
                value={form.email}
                onChange={(e) => setField("email", e.target.value)}
                className="mt-1.5 block w-full rounded-1.25 border border-soko-line p-2.75 text-xs outline-soko-navy disabled:opacity-60"
                placeholder={t("common.emailPlaceholder")}
                autoComplete="email"
                required
                disabled={loading}
              />
            </label>

            <label className="mt-3.5 block text-[0.625rem] font-bold">
              {t("register.phone")}
              <input
                type="tel"
                value={form.phone}
                onChange={(e) => setField("phone", e.target.value)}
                className="mt-1.5 block w-full rounded-1.25 border border-soko-line p-2.75 text-xs outline-soko-navy disabled:opacity-60"
                placeholder={t("register.phonePlaceholder")}
                autoComplete="tel"
                required
                disabled={loading}
              />
            </label>

            <label className="mt-3.5 block text-[0.625rem] font-bold">
              {t("common.password")}
              <span className="relative mt-1.5 block">
                <input
                  type={showPassword ? "text" : "password"}
                  value={form.password}
                  onChange={(e) => setField("password", e.target.value)}
                  className="block w-full rounded-1.25 border border-soko-line p-2.75 pr-10 text-xs outline-soko-navy disabled:opacity-60"
                  placeholder={t("register.passwordPlaceholder")}
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

            <label className="mt-3.5 block text-[0.625rem] font-bold">
              {t("register.confirmPassword")}
              <input
                type={showPassword ? "text" : "password"}
                value={form.confirmPassword}
                onChange={(e) => setField("confirmPassword", e.target.value)}
                className="mt-1.5 block w-full rounded-1.25 border border-soko-line p-2.75 text-xs outline-soko-navy disabled:opacity-60"
                placeholder={t("register.confirmPasswordPlaceholder")}
                autoComplete="new-password"
                required
                minLength={8}
                disabled={loading}
              />
            </label>

            <button
              type="submit"
              className={`${btn.primaryCompact} mt-5 w-full sm:px-5.5 sm:py-3.5`}
              disabled={loading}
              aria-busy={loading}
            >
              {loading ? (
                <ButtonLoader label={t("register.submitting")} />
              ) : (
                <>
                  {t("register.submit")} <Icon name="arrow" />
                </>
              )}
            </button>
          </form>

          <p className="mt-5 mb-0 text-center text-xs text-soko-muted">
            {t("register.alreadyHaveAccount")}{" "}
            <button
              type="button"
              className="border-0 bg-transparent p-0 font-bold text-soko-navy underline-offset-2 hover:underline disabled:opacity-50"
              onClick={onSwitchToLogin}
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
