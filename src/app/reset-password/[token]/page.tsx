"use client";

import { use } from "react";
import { ResetPasswordForm } from "@/components/ResetPasswordForm";

type ResetPasswordPageProps = {
  params: Promise<{ token: string }>;
};

export default function ResetPasswordPage({ params }: ResetPasswordPageProps) {
  const { token: rawToken } = use(params);
  const token = decodeURIComponent(rawToken);

  if (!token) {
    return (
      <div className="grid min-h-screen place-items-center p-6 text-sm text-soko-muted">
        Invalid reset link.
      </div>
    );
  }

  return <ResetPasswordForm token={token} />;
}
