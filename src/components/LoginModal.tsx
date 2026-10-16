"use client";

import { useState } from "react";
import { Icon } from "@/components/Icon";
import { Logo } from "@/components/Logo";
import { ButtonLoader } from "@/components/ActionLoader";
import { useAppDialog } from "@/hooks/useAppDialog";
import { btn } from "@/lib/ui";
import { formatApiError, getIncompleteRegistration } from "@/lib/apiError";
import { authService } from "@/services/auth.service";
import type { UserSession } from "@/lib/session";

type LoginModalProps = {
  onClose: () => void;
  onSuccess: (session: UserSession) => void;
  onSwitchToRegister: () => void;
  onNeedRole: (details: { userId: string; email: string }) => void;
  onNeedVerifyEmail: (email: string) => void;
};

export function LoginModal({
  onClose,
  onSuccess,
  onSwitchToRegister,
  onNeedRole,
  onNeedVerifyEmail,
}: LoginModalProps) {
  const { showError, dialog } = useAppDialog();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (loading) return;

    setLoading(true);
    const normalizedEmail = email.trim().toLowerCase();

    try {
      const session = await authService.login({
        email: normalizedEmail,
        password,
      });
      onSuccess(session);
    } catch (err) {
      const incomplete = getIncompleteRegistration(err);
      if (incomplete?.missingAction === "SELECT_ROLE" && incomplete.userId) {
        await showError(incomplete.message, {
          title: "Finish account setup",
          confirmLabel: "Select role",
        });
        onNeedRole({
          userId: incomplete.userId,
          email: incomplete.email ?? normalizedEmail,
        });
        setLoading(false);
        return;
      }
      if (incomplete?.missingAction === "VERIFY_EMAIL") {
        await showError(incomplete.message, {
          title: "Verify your email",
          confirmLabel: "OK",
        });
        onNeedVerifyEmail(incomplete.email ?? normalizedEmail);
        setLoading(false);
        return;
      }

      await showError(formatApiError(err), { title: "Sign in failed" });
      setLoading(false);
    }
  };

  return (
    <>
      {dialog}
      <div className="fixed inset-0 z-100 grid place-items-center bg-soko-navy/72 p-6 backdrop-blur-sm">
        <div className="relative w-full max-w-105 overflow-auto rounded-2.5 bg-white px-10.5 py-9 max-sm:px-5 max-sm:py-7.5">
          <button
            type="button"
            className="absolute top-4 right-4 z-2 grid h-9 w-9 place-items-center rounded-full border border-soko-line bg-white disabled:opacity-50"
            onClick={onClose}
            disabled={loading}
            aria-label="Close login"
          >
            <Icon name="close" />
          </button>

          <div className="mb-6">
            <Logo />
          </div>

          <span className="text-[0.6875rem] font-extrabold tracking-[0.1375rem] text-soko-green-2 uppercase">
            Welcome back
          </span>
          <h2 className="my-2 font-display text-[1.875rem] font-bold">
            Log in to Soko.
          </h2>
          <p className="mt-0 text-xs text-soko-muted">
            Sign in with your MarketAI account. Admin seed: admin@soko.com /
            Admin@123
          </p>

          <form className="mt-6" onSubmit={(e) => void submit(e)}>
            <label className="mb-3.5 block text-[0.625rem] font-bold">
              Email address
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="mt-1.5 block w-full rounded-1.25 border border-soko-line p-2.75 text-xs outline-soko-navy disabled:opacity-60"
                placeholder="name@company.rw"
                autoComplete="email"
                required
                disabled={loading}
              />
            </label>

            <label className="mb-3.5 block text-[0.625rem] font-bold">
              Password
              <span className="relative mt-1.5 block">
                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="block w-full rounded-1.25 border border-soko-line p-2.75 pr-10 text-xs outline-soko-navy disabled:opacity-60"
                  placeholder="Enter your password"
                  autoComplete="current-password"
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

            <button
              type="submit"
              className={`${btn.primaryCompact} w-full sm:px-5.5 sm:py-3.5`}
              disabled={loading}
              aria-busy={loading}
            >
              {loading ? (
                <ButtonLoader label="Signing in…" />
              ) : (
                <>
                  Sign in <Icon name="arrow" />
                </>
              )}
            </button>
          </form>

          <p className="mt-5 mb-0 text-center text-xs text-soko-muted">
            New to Soko?{" "}
            <button
              type="button"
              className="border-0 bg-transparent p-0 font-bold text-soko-navy underline-offset-2 hover:underline disabled:opacity-50"
              onClick={onSwitchToRegister}
              disabled={loading}
            >
              Create an account
            </button>
          </p>
        </div>
      </div>
    </>
  );
}
