"use client";

import { useState } from "react";
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
      showError("Passwords do not match.", { title: "Check your password" });
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
        `${result.message} Next: open the verification link emailed to ${result.email} and enter the 6-digit code.`,
        { title: "Step 1 complete", confirmLabel: "OK" }
      );
      onClose();
    } catch (err) {
      await showError(formatApiError(err), { title: "Registration failed" });
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
            aria-label="Close register"
          >
            <Icon name="close" />
          </button>

          <div className="mb-6">
            <Logo />
          </div>

          <span className="text-[0.6875rem] font-extrabold tracking-[0.1375rem] text-soko-green-2 uppercase">
            Step 1 of 3
          </span>
          <h2 className="my-2 font-display text-[1.875rem] font-bold">
            Join Soko.
          </h2>
          <p className="mt-0 text-xs text-soko-muted">
            Create your account, then verify email and choose a role before
            signing in.
          </p>

          <form className="mt-6" onSubmit={(e) => void submit(e)}>
            <div className="grid gap-3.5 sm:grid-cols-2">
              <label className="block text-[0.625rem] font-bold">
                First name
                <input
                  type="text"
                  value={form.firstName}
                  onChange={(e) => setField("firstName", e.target.value)}
                  className="mt-1.5 block w-full rounded-1.25 border border-soko-line p-2.75 text-xs outline-soko-navy disabled:opacity-60"
                  placeholder="Aline"
                  autoComplete="given-name"
                  required
                  disabled={loading}
                />
              </label>
              <label className="block text-[0.625rem] font-bold">
                Last name
                <input
                  type="text"
                  value={form.lastName}
                  onChange={(e) => setField("lastName", e.target.value)}
                  className="mt-1.5 block w-full rounded-1.25 border border-soko-line p-2.75 text-xs outline-soko-navy disabled:opacity-60"
                  placeholder="Kabera"
                  autoComplete="family-name"
                  required
                  disabled={loading}
                />
              </label>
            </div>

            <label className="mt-3.5 block text-[0.625rem] font-bold">
              Email address
              <input
                type="email"
                value={form.email}
                onChange={(e) => setField("email", e.target.value)}
                className="mt-1.5 block w-full rounded-1.25 border border-soko-line p-2.75 text-xs outline-soko-navy disabled:opacity-60"
                placeholder="name@company.rw"
                autoComplete="email"
                required
                disabled={loading}
              />
            </label>

            <label className="mt-3.5 block text-[0.625rem] font-bold">
              Phone
              <input
                type="tel"
                value={form.phone}
                onChange={(e) => setField("phone", e.target.value)}
                className="mt-1.5 block w-full rounded-1.25 border border-soko-line p-2.75 text-xs outline-soko-navy disabled:opacity-60"
                placeholder="+2507…"
                autoComplete="tel"
                required
                disabled={loading}
              />
            </label>

            <label className="mt-3.5 block text-[0.625rem] font-bold">
              Password
              <span className="relative mt-1.5 block">
                <input
                  type={showPassword ? "text" : "password"}
                  value={form.password}
                  onChange={(e) => setField("password", e.target.value)}
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

            <label className="mt-3.5 block text-[0.625rem] font-bold">
              Confirm password
              <input
                type={showPassword ? "text" : "password"}
                value={form.confirmPassword}
                onChange={(e) => setField("confirmPassword", e.target.value)}
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
              className={`${btn.primaryCompact} mt-5 w-full sm:px-5.5 sm:py-3.5`}
              disabled={loading}
              aria-busy={loading}
            >
              {loading ? (
                <ButtonLoader label="Creating account…" />
              ) : (
                <>
                  Create account <Icon name="arrow" />
                </>
              )}
            </button>
          </form>

          <p className="mt-5 mb-0 text-center text-xs text-soko-muted">
            Already have an account?{" "}
            <button
              type="button"
              className="border-0 bg-transparent p-0 font-bold text-soko-navy underline-offset-2 hover:underline disabled:opacity-50"
              onClick={onSwitchToLogin}
              disabled={loading}
            >
              Sign in
            </button>
          </p>
        </div>
      </div>
    </>
  );
}
