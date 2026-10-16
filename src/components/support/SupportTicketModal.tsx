"use client";

import { useMemo, useState, type FormEvent } from "react";
import { ActionOverlay, ButtonLoader } from "@/components/ActionLoader";
import { Field, fieldClass } from "@/components/marketplace/uiBits";
import { formatApiError } from "@/lib/apiError";
import { Icon, btn } from "@/lib/ui";
import { useCreateSupportTicketMutation } from "@/store/actions/support";
import type { MeResponse } from "@/types/auth";
import {
  SUPPORT_CATEGORY_OPTIONS,
  type SupportTicketCategory,
} from "@/types/support";

export type SupportTicketPrefill = {
  category?: SupportTicketCategory;
  subject?: string;
  message?: string;
  context?: Record<string, unknown>;
};

type Props = {
  open: boolean;
  onClose: () => void;
  me?: MeResponse | null;
  prefill?: SupportTicketPrefill | null;
  onSubmitted?: (ticketNumber: string) => void;
  onError?: (message: string) => void;
};

export function SupportTicketModal({
  open,
  onClose,
  me,
  prefill,
  onSubmitted,
  onError,
}: Props) {
  const [createTicket, createState] = useCreateSupportTicketMutation();
  const draftKey = open
    ? [
        prefill?.category ?? "LOCATION_MISMATCH",
        prefill?.subject ?? "Need help with delivery location",
        prefill?.message ?? "",
      ].join("\n")
    : "closed";
  const [category, setCategory] = useState<SupportTicketCategory>(
    prefill?.category ?? "LOCATION_MISMATCH"
  );
  const [subject, setSubject] = useState(
    prefill?.subject ?? "Need help with delivery location"
  );
  const [message, setMessage] = useState(prefill?.message ?? "");
  const [appliedDraft, setAppliedDraft] = useState(draftKey);

  if (appliedDraft !== draftKey) {
    setAppliedDraft(draftKey);
    if (open) {
      setCategory(prefill?.category ?? "LOCATION_MISMATCH");
      setSubject(prefill?.subject ?? "Need help with delivery location");
      setMessage(prefill?.message ?? "");
    }
  }

  const userSummary = useMemo(() => {
    if (!me) return null;
    return {
      name: `${me.firstName} ${me.lastName}`.trim() || me.email,
      email: me.email,
      phone: me.phone || "—",
    };
  }, [me]);

  if (!open) return null;

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    if (createState.isLoading) return;
    if (!message.trim()) {
      onError?.("Please describe what you need help with.");
      return;
    }
    try {
      const ticket = await createTicket({
        category,
        subject: subject.trim(),
        message: message.trim(),
        context: {
          ...(prefill?.context ?? {}),
          submittedFrom: "support_ticket_modal",
        },
      }).unwrap();
      onSubmitted?.(ticket.ticketNumber);
      onClose();
    } catch (err) {
      onError?.(formatApiError(err));
    }
  };

  return (
    <div className="fixed inset-0 z-130 grid place-items-center overflow-y-auto bg-soko-navy/72 p-4 backdrop-blur-sm sm:p-6">
      <div className="relative my-auto w-full max-w-125 rounded-2.5 bg-white px-5 py-6 sm:px-7">
        {createState.isLoading ? (
          <ActionOverlay label="Sending support ticket…" />
        ) : null}
        <button
          type="button"
          className="absolute top-4 right-4 grid h-8 w-8 place-items-center rounded-full border border-soko-line bg-white disabled:opacity-50"
          onClick={onClose}
          disabled={createState.isLoading}
          aria-label="Close support form"
        >
          <Icon name="close" size={16} />
        </button>

        <h3 className="m-0 pr-8 font-display text-[1.125rem] font-bold">
          Request for help
        </h3>
        <p className="mt-1 mb-4 text-[0.6875rem] text-soko-muted">
          Send a support ticket to the admin team. Include what you need help
          with and we will follow up.
        </p>

        {userSummary ? (
          <div className="mb-4 rounded-1.25 border border-soko-line bg-soko-slate px-3.5 py-3 text-[0.6875rem]">
            <p className="m-0 font-bold text-soko-ink">{userSummary.name}</p>
            <p className="m-0 mt-1 text-soko-muted">{userSummary.email}</p>
            <p className="m-0 text-soko-muted">{userSummary.phone}</p>
          </div>
        ) : null}

        {prefill?.context ? (
          <div className="mb-4 rounded-1.25 border border-soko-line px-3.5 py-3 text-[0.6875rem] text-soko-muted">
            <p className="m-0 font-bold tracking-wide text-soko-ink uppercase">
              Issue details
            </p>
            <p className="m-0 mt-1 whitespace-pre-wrap">
              {String(
                (prefill.context as { summary?: string }).summary ??
                  JSON.stringify(prefill.context, null, 2)
              )}
            </p>
          </div>
        ) : null}

        <form className="grid gap-3" onSubmit={(e) => void submit(e)}>
          <Field label="Support type">
            <select
              className={fieldClass}
              value={category}
              onChange={(e) =>
                setCategory(e.target.value as SupportTicketCategory)
              }
              required
              disabled={createState.isLoading}
            >
              {SUPPORT_CATEGORY_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </Field>

          <Field label="Subject">
            <input
              className={fieldClass}
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              required
              disabled={createState.isLoading}
            />
          </Field>

          <Field label="How can we help?">
            <textarea
              className={`${fieldClass} min-h-28 resize-y`}
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Describe the problem and what you expected…"
              required
              disabled={createState.isLoading}
            />
          </Field>

          <div className="flex flex-wrap gap-2 pt-1">
            <button
              type="submit"
              className={`${btn.primaryCompact} min-w-0 flex-1`}
              disabled={createState.isLoading}
            >
              {createState.isLoading ? (
                <ButtonLoader label="Sending…" />
              ) : (
                <>
                  Send ticket <Icon name="arrow" />
                </>
              )}
            </button>
            <button
              type="button"
              className={`${btn.outline} shrink-0`}
              onClick={onClose}
              disabled={createState.isLoading}
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
