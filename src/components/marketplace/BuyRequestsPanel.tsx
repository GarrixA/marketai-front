"use client";

import { useState } from "react";
import useTranslation from "next-translate/useTranslation";
import { Icon, btn } from "@/lib/ui";
import { formatRwf } from "@/lib/marketplaceStore";
import { formatApiError } from "@/lib/apiError";
import { openRequestToDeal } from "@/lib/openBuyRequest";
import { useAppDialog } from "@/hooks/useAppDialog";
import { ConfirmDealForm } from "@/components/marketplace/ConfirmDealForm";
import {
  EmptyState,
  Field,
  Panel,
  fieldClass,
} from "@/components/marketplace/uiBits";
import {
  TradeResultModal,
  type TradeResult,
} from "@/components/marketplace/TradeResultModal";
import { ActionOverlay, ButtonLoader } from "@/components/ActionLoader";
import { getSession } from "@/lib/session";
import {
  useCreateOpenBuyRequestMutation,
  useListMarketBuyRequestsQuery,
  useListMyBuyRequestsQuery,
} from "@/store/actions/requests";
import type { OpenBuyRequest } from "@/types/request";

export function BuyRequestsPanel({ mode }: { mode: "mine" | "incoming" }) {
  const { t } = useTranslation("buyRequests");
  const session = getSession();
  const { dialog, showError } = useAppDialog();
  const [createOpenBuyRequest] = useCreateOpenBuyRequestMutation();
  const mineQuery = useListMyBuyRequestsQuery(undefined, {
    skip: mode !== "mine",
  });
  const marketQuery = useListMarketBuyRequestsQuery(undefined, {
    skip: mode !== "incoming",
    pollingInterval: 8_000,
    refetchOnFocus: true,
    refetchOnReconnect: true,
  });

  const [product, setProduct] = useState("Fresh eggs · Large");
  const [quantity, setQuantity] = useState("300");
  const [location, setLocation] = useState("Kigali");
  const [date, setDate] = useState("2026-10-12");
  const [price, setPrice] = useState("4000");
  const [notes, setNotes] = useState("");
  const [tradeResult, setTradeResult] = useState<TradeResult | null>(null);
  const [loading, setLoading] = useState(false);

  const list: OpenBuyRequest[] =
    mode === "mine" ? (mineQuery.data ?? []) : (marketQuery.data ?? []);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!session || loading) return;
    setLoading(true);
    const qty = Number(quantity) || 0;
    try {
      await createOpenBuyRequest({
        product,
        quantity: qty,
        unit: "trays",
        deliveryLocation: location,
        requiredDate: date,
        targetPrice: Number(price) || 0,
        notes,
      }).unwrap();
      setNotes("");
      setTradeResult({
        kind: "buy",
        title: "Buy request sent",
        message:
          "Suppliers and aggregators see this on the market with a Sell button. Buyers keep buying listed products.",
        details: [
          product,
          `${qty} trays · needed by ${date}`,
          `Delivery to ${location}`,
          `Target ${formatRwf(Number(price) || 0)}/tray`,
        ],
      });
    } catch (err) {
      await showError(formatApiError(err), {
        title: "Could not send buy request",
      });
    } finally {
      setLoading(false);
    }
  };

  const listLoading =
    mode === "mine" ? mineQuery.isLoading : marketQuery.isLoading;

  return (
    <>
      {dialog}
      <div className="grid grid-cols-[1.1fr_1fr] gap-4.25 max-lg:grid-cols-1">
        {mode === "mine" ? (
          <Panel title={t("newRequest")} subtitle={t("newRequestDescription")}>
            <div className="relative">
              {loading ? <ActionOverlay label="Sending buy request…" /> : null}
              <form
                className="grid grid-cols-2 gap-3 max-sm:grid-cols-1"
                onSubmit={submit}
              >
                <Field label={t("product")}>
                  <select
                    className={fieldClass}
                    value={product}
                    onChange={(e) => setProduct(e.target.value)}
                    required
                    disabled={loading}
                  >
                    {[
                      ["Fresh eggs · Large", "freshEggsLarge"],
                      ["Fresh eggs · Medium", "freshEggsMedium"],
                      ["Fresh eggs · Small", "freshEggsSmall"],
                      ["Fresh eggs · Mixed", "freshEggsMixed"],
                      ["Fresh eggs · Organic Large", "freshEggsOrganicLarge"],
                      ["Fresh eggs · Free-range", "freshEggsFreeRange"],
                    ].map(([option, labelKey]) => (
                      <option key={option} value={option}>
                        {t(`productOptions.${labelKey}`)}
                      </option>
                    ))}
                  </select>
                </Field>
                <Field label={t("quantityTrays")}>
                  <input
                    className={fieldClass}
                    type="number"
                    min={1}
                    value={quantity}
                    onChange={(e) => setQuantity(e.target.value)}
                    required
                    disabled={loading}
                  />
                </Field>
                <Field label={t("deliveryLocation")}>
                  <input
                    className={fieldClass}
                    value={location}
                    onChange={(e) => setLocation(e.target.value)}
                    required
                    disabled={loading}
                  />
                </Field>
                <Field label={t("requiredDate")}>
                  <input
                    className={fieldClass}
                    type="date"
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                    required
                    disabled={loading}
                  />
                </Field>
                <Field label={t("targetPricePerTray")}>
                  <input
                    className={fieldClass}
                    type="number"
                    min={0}
                    value={price}
                    onChange={(e) => setPrice(e.target.value)}
                    disabled={loading}
                  />
                </Field>
                <Field label={t("notes")}>
                  <input
                    className={fieldClass}
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="Frequency, quality, packaging…"
                    disabled={loading}
                  />
                </Field>
                <div className="col-span-full">
                  <button
                    type="submit"
                    className={`${btn.buyCompact} w-full sm:w-auto sm:px-5.5 sm:py-3.5`}
                    disabled={loading}
                  >
                    {loading ? (
                      <ButtonLoader label="Sending…" />
                    ) : (
                      <>
                        {t("sendRequest")} <Icon name="arrow" />
                      </>
                    )}
                  </button>
                </div>
              </form>
            </div>
          </Panel>
        ) : (
          <Panel
            title={t("howConfirmationWorks")}
            subtitle={t("confirmationDescription")}
          >
            <ol className="m-0 list-decimal space-y-3 pl-4 text-xs text-soko-muted">
              <li>{t("confirmationSteps.step1")}</li>
              <li>{t("confirmationSteps.step2")}</li>
              <li>{t("confirmationSteps.step3")}</li>
              <li>{t("confirmationSteps.step4")}</li>
            </ol>
          </Panel>
        )}

        <Panel
          title={mode === "mine" ? t("myRfqs") : t("openRfqs")}
          subtitle={
            mode === "mine" ? t("myRfqsDescription") : t("openRfqsDescription")
          }
        >
          {listLoading ? (
            <EmptyState message="Loading buy requests…" />
          ) : list.length === 0 ? (
            <EmptyState
              message={
                mode === "mine"
                  ? "No buy requests yet. Use the form to publish one."
                  : t("noOpenRequests")
              }
            />
          ) : (
            <div className="flex flex-col gap-3">
              {list.map((request) => (
                <article
                  key={request.id}
                  className="rounded-1.25 border border-soko-line px-3.5 py-3.5"
                >
                  <div className="mb-2 flex items-start justify-between gap-2">
                    <div>
                      <strong className="block text-[0.8125rem]">
                        {request.product}
                      </strong>
                      <small className="text-[0.5625rem] text-soko-muted">
                        {mode === "mine"
                          ? t("toSuppliersAndAggregators", {
                              location: request.deliveryLocation,
                            })
                          : t("buyerAndLocation", {
                              buyer: request.buyerBusiness || request.buyerName,
                              location: request.deliveryLocation,
                            })}
                      </small>
                    </div>
                    <span className="inline-flex rounded-xl bg-[#fff1e6] px-2 py-1 text-[0.5625rem] font-bold text-[#c2410c]">
                      {request.status === "OPEN" ? t("open") : request.status}
                    </span>
                  </div>
                  <div className="grid grid-cols-3 gap-2 text-[0.625rem] max-sm:grid-cols-2">
                    <div>
                      <span className="block text-soko-muted">
                        {t("requested")}
                      </span>
                      <b>
                        {request.quantity} {request.unit}
                      </b>
                    </div>
                    <div>
                      <span className="block text-soko-muted">
                        {t("target")}
                      </span>
                      <b>{formatRwf(request.targetPrice)}/tray</b>
                    </div>
                    <div>
                      <span className="block text-soko-muted">
                        {t("neededBy")}
                      </span>
                      <b>{request.requiredDate}</b>
                    </div>
                  </div>
                  {mode === "incoming" && request.hasMyOffer ? (
                    <p className="mt-2 mb-0 text-[0.625rem] text-soko-green-2">
                      Offer sent
                    </p>
                  ) : null}
                  {mode === "incoming" && !request.hasMyOffer ? (
                    <ConfirmDealForm
                      deal={openRequestToDeal(request)}
                      allowReject={false}
                    />
                  ) : null}
                </article>
              ))}
            </div>
          )}
        </Panel>
      </div>

      <TradeResultModal
        result={tradeResult}
        onClose={() => setTradeResult(null)}
      />
    </>
  );
}
