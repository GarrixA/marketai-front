"use client";

import { use } from "react";
import { VerifyEmailForm } from "@/components/VerifyEmailForm";

type VerifyEmailPageProps = {
  params: Promise<{ token: string }>;
};

export default function VerifyEmailPage({ params }: VerifyEmailPageProps) {
  const { token: rawToken } = use(params);
  const token = decodeURIComponent(rawToken);

  if (!token) {
    return (
      <div className="grid min-h-screen place-items-center p-6 text-sm text-soko-muted">
        Invalid verification link.
      </div>
    );
  }

  return <VerifyEmailForm token={token} />;
}
