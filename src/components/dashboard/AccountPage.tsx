"use client";

import { useCallback, useEffect, useState, type ReactNode } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Icon } from "@/components/Icon";
import { ButtonLoader } from "@/components/ActionLoader";
import {
  DeliveryAddressFields,
  deliveryAddressFromLocation,
  emptyDeliveryAddress,
  formatDeliveryAddress,
  type DeliveryAddressValue,
} from "@/components/forms/DeliveryAddressFields";
import { Panel, Field, fieldClass } from "@/components/marketplace/uiBits";
import { useAppDialog } from "@/hooks/useAppDialog";
import { btn } from "@/lib/ui";
import { formatApiError } from "@/lib/apiError";
import { hasDeliveryAddress } from "@/lib/deliveryAddress";
import { resolveMediaUrl } from "@/lib/mediaUrl";
import { validateCoordinatesAgainstAddress } from "@/lib/validateRwandaCoordinates";
import { CoordinateMismatchDialog } from "@/components/support/CoordinateMismatchDialog";
import {
  SupportTicketModal,
  type SupportTicketPrefill,
} from "@/components/support/SupportTicketModal";
import { getSession, setSession } from "@/lib/session";
import { authService } from "@/services/auth.service";
import type {
  EstimatedVolumeCustomUnit,
  EstimatedVolumePeriod,
  EstimatedVolumeUnit,
  MeResponse,
} from "@/types/auth";

const VOLUME_PERIODS: { value: EstimatedVolumePeriod; label: string }[] = [
  { value: "DAILY", label: "Daily" },
  { value: "WEEKLY", label: "Weekly" },
  { value: "MONTHLY", label: "Monthly" },
  { value: "CUSTOM", label: "Custom" },
];

const VOLUME_UNITS: { value: EstimatedVolumeUnit; label: string }[] = [
  { value: "TRAYS", label: "Trays" },
  { value: "EGGS", label: "Eggs" },
];

const VOLUME_CUSTOM_UNITS: {
  value: EstimatedVolumeCustomUnit;
  label: string;
}[] = [
  { value: "HOURS", label: "Hours" },
  { value: "DAYS", label: "Days" },
  { value: "WEEKS", label: "Weeks" },
  { value: "MONTHS", label: "Months" },
  { value: "YEARS", label: "Years" },
];

type Tab = "profile" | "account";
type EditSection = "personal" | "delivery" | "aggregator";
type SaveSection = EditSection | "password" | "avatar" | null;

const TAB_ORDER: Tab[] = ["profile", "account"];

const tabEase = [0.22, 1, 0.36, 1] as const;

const panelStagger = {
  hidden: (dir: number) => ({ opacity: 0, x: dir * 24 }),
  show: {
    opacity: 1,
    x: 0,
    transition: { staggerChildren: 0.07, delayChildren: 0.04 },
  },
  exit: (dir: number) => ({
    opacity: 0,
    x: dir * -18,
    transition: { duration: 0.16, ease: tabEase },
  }),
};

const panelItem = {
  hidden: { opacity: 0, y: 12 },
  show: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.32, ease: tabEase },
  },
};

function formatDate(value: string | null | undefined) {
  if (!value) return "—";
  try {
    return new Date(value).toLocaleString("en-GB", {
      day: "numeric",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return value;
  }
}

function displayValue(value: ReactNode) {
  if (value == null || value === "") return "—";
  return value;
}

type BadgeTone = "neutral" | "active" | "pending" | "danger" | "amber";

function SoftBadge({
  children,
  tone = "neutral",
}: {
  children: ReactNode;
  tone?: BadgeTone;
}) {
  const tones: Record<BadgeTone, string> = {
    neutral: "bg-soko-slate text-soko-navy",
    active: "bg-[#e8f5ee] text-[#166534]",
    pending: "bg-[#fff4e5] text-soko-cta-hover",
    danger: "bg-[#fde8e8] text-[#b42318]",
    amber: "bg-[#fff4e5] text-soko-cta-hover",
  };
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-[0.625rem] font-bold tracking-wide uppercase ${tones[tone]}`}
    >
      {children}
    </span>
  );
}

function statusTone(status: string | null | undefined): BadgeTone {
  const s = (status ?? "").toUpperCase();
  if (s === "ACTIVE" || s === "VERIFIED" || s === "APPROVED") return "active";
  if (s === "PENDING" || s === "IN_REVIEW" || s === "SUBMITTED")
    return "pending";
  if (s === "REJECTED" || s === "SUSPENDED" || s === "INACTIVE")
    return "danger";
  return "neutral";
}

function DetailTile({
  label,
  value,
  icon,
  span = false,
  accent,
}: {
  label: string;
  value: ReactNode;
  icon?: string;
  span?: boolean;
  accent?: ReactNode;
}) {
  return (
    <div
      className={`group relative min-w-0 overflow-hidden rounded-xl border border-soko-line/80 bg-white px-3.5 py-3 transition-colors duration-200 hover:border-soko-navy/25 ${
        span ? "sm:col-span-2" : ""
      }`}
    >
      <div className="flex items-start gap-2.5">
        {icon ? (
          <span className="mt-0.5 grid h-7 w-7 shrink-0 place-items-center rounded-lg bg-soko-slate text-soko-navy">
            <Icon name={icon} size={14} />
          </span>
        ) : null}
        <div className="min-w-0 flex-1">
          <div className="mb-1 flex flex-wrap items-center gap-1.5">
            <p className="m-0 text-[0.625rem] font-bold tracking-[0.08em] text-soko-muted uppercase">
              {label}
            </p>
            {accent}
          </div>
          <p className="m-0 text-sm font-medium text-soko-ink break-words">
            {displayValue(value)}
          </p>
        </div>
      </div>
    </div>
  );
}

function DetailGrid({ children }: { children: ReactNode }) {
  return <div className="grid gap-2.5 sm:grid-cols-2">{children}</div>;
}

function SectionBlock({
  title,
  children,
}: {
  title: string;
  children: ReactNode;
}) {
  return (
    <div>
      <div className="mb-2.5 flex items-center gap-2">
        <span className="h-1 w-1 rounded-full bg-soko-navy" aria-hidden />
        <p className="m-0 text-[0.625rem] font-bold tracking-[0.1em] text-soko-muted uppercase">
          {title}
        </p>
      </div>
      {children}
    </div>
  );
}

function ProfileHero({
  avatarUrl,
  initials,
  title,
  subtitle,
  badges,
}: {
  avatarUrl?: string | null;
  initials: string;
  title: string;
  subtitle?: ReactNode;
  badges?: ReactNode;
}) {
  return (
    <div className="relative mb-1 overflow-hidden rounded-xl border border-soko-line bg-white px-4 py-4 sm:px-5">
      <div className="relative flex items-center gap-3.5">
        <div className="relative h-16 w-16 shrink-0 overflow-hidden rounded-full bg-soko-slate ring-2 ring-soko-line ring-offset-2 ring-offset-white">
          {avatarUrl ? (
            <img
              src={avatarUrl}
              alt={title}
              className="h-full w-full object-cover"
            />
          ) : (
            <div className="grid h-full w-full place-items-center bg-soko-navy font-display text-base font-bold text-white">
              {initials}
            </div>
          )}
        </div>
        <div className="min-w-0 flex-1">
          <p className="m-0 font-display text-lg font-bold tracking-tight text-soko-ink">
            {title}
          </p>
          {subtitle ? (
            <p className="m-0 mt-0.5 truncate text-xs text-soko-muted">
              {subtitle}
            </p>
          ) : null}
          {badges ? (
            <div className="mt-2.5 flex flex-wrap gap-1.5">{badges}</div>
          ) : null}
        </div>
      </div>
    </div>
  );
}

function AddressHero({ address }: { address: string }) {
  return (
    <div className="relative mb-1 overflow-hidden rounded-xl border border-soko-line bg-white px-4 py-4 sm:px-5">
      <div className="flex items-start gap-3">
        <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-soko-navy text-white">
          <Icon name="pin" size={18} />
        </span>
        <div className="min-w-0">
          <p className="m-0 text-[0.625rem] font-bold tracking-[0.08em] text-soko-muted uppercase">
            Address
          </p>
          <p className="m-0 mt-1 font-display text-[0.9375rem] leading-snug font-bold text-soko-ink">
            {address}
          </p>
        </div>
      </div>
    </div>
  );
}

function EmptyHint({ children }: { children: ReactNode }) {
  return (
    <div className="rounded-xl border border-dashed border-soko-line bg-soko-slate/50 px-4 py-8 text-center">
      <p className="m-0 text-xs text-soko-muted">{children}</p>
    </div>
  );
}

function EditIconButton({
  onClick,
  label,
}: {
  onClick: () => void;
  label: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={label}
      title={label}
      className="inline-grid h-9 w-9 place-items-center rounded-xl border border-soko-line bg-white text-soko-muted shadow-[0_1px_0_rgba(13,27,42,0.04)] transition-all duration-200 hover:-translate-y-0.5 hover:border-soko-navy hover:bg-soko-navy hover:text-white hover:shadow-md"
    >
      <Icon name="edit" size={15} />
    </button>
  );
}

function boolLabel(value: boolean | null | undefined) {
  if (value == null) return "—";
  return value ? "Yes" : "No";
}

function labelFromOptions<T extends string>(
  options: { value: T; label: string }[],
  value: T | null | undefined
) {
  if (!value) return null;
  return options.find((option) => option.value === value)?.label ?? value;
}

function formatEstimatedVolume(
  profile: MeResponse["aggregatorProfile"]
): string {
  if (!profile || profile.estimatedVolume == null) return "—";

  const unit =
    labelFromOptions(VOLUME_UNITS, profile.estimatedVolumeUnit) ?? "";
  const period = labelFromOptions(
    VOLUME_PERIODS,
    profile.estimatedVolumePeriod
  );

  let text = `${profile.estimatedVolume}${unit ? ` ${unit.toLowerCase()}` : ""}`;
  if (profile.estimatedVolumePeriod === "CUSTOM") {
    const timeUnit = labelFromOptions(
      VOLUME_CUSTOM_UNITS,
      profile.estimatedVolumeCustomUnit
    );
    if (profile.estimatedVolumeCustomInterval && timeUnit) {
      text += ` every ${profile.estimatedVolumeCustomInterval} ${timeUnit.toLowerCase()}`;
    }
  } else if (period) {
    text += ` / ${period.toLowerCase()}`;
  }
  return text;
}

function toLocationPayload(address: DeliveryAddressValue) {
  const latitude = address.latitude?.trim()
    ? Number(address.latitude)
    : undefined;
  const longitude = address.longitude?.trim()
    ? Number(address.longitude)
    : undefined;
  return {
    province: address.province,
    district: address.district,
    sector: address.sector,
    cell: address.cell,
    village: address.village,
    hood: address.hood?.trim() || undefined,
    latitude:
      latitude !== undefined && Number.isFinite(latitude)
        ? latitude
        : undefined,
    longitude:
      longitude !== undefined && Number.isFinite(longitude)
        ? longitude
        : undefined,
  };
}

function canEditDeliveryAddress(me: MeResponse | null) {
  if (!me) return false;
  if (me.buyerProfileId || me.aggregatorProfileId) return true;
  const roles = (me.roles ?? []).map((role) =>
    (typeof role === "string" ? role : role.name).toUpperCase()
  );
  return roles.includes("BUYER") || roles.includes("AGGREGATOR");
}

/** Dedicated aggregator business location (not the shared delivery/profile pin). */
function aggregatorBusinessLocation(me: MeResponse | null | undefined) {
  const agg = me?.aggregatorProfile;
  if (!agg || agg.useMarketplaceLocation) return null;
  return agg.location ?? null;
}

function syncSessionFromMe(me: MeResponse) {
  const session = getSession();
  if (!session) return;
  const name = `${me.firstName} ${me.lastName}`.trim() || session.name;
  setSession({
    ...session,
    name,
    email: me.email,
    phone: me.phone,
    businessName:
      me.aggregatorProfile?.companyName ||
      me.profile?.businessName ||
      me.buyerProfile?.businessName ||
      me.profile?.displayName ||
      name,
    avatarUrl: me.profile?.avatarUrl ?? null,
  });
}

export function AccountPage() {
  const { confirm, showError, showSuccess, dialog } = useAppDialog();
  const [tab, setTab] = useState<Tab>("profile");
  const [slide, setSlide] = useState(0);
  const [me, setMe] = useState<MeResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<EditSection | null>(null);
  const [savingSection, setSavingSection] = useState<SaveSection>(null);
  const [mismatchOpen, setMismatchOpen] = useState(false);
  const [mismatchMessage, setMismatchMessage] = useState("");
  const [helpOpen, setHelpOpen] = useState(false);
  const [helpPrefill, setHelpPrefill] = useState<SupportTicketPrefill | null>(
    null
  );

  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [phone, setPhone] = useState("");

  const [deliveryAddress, setDeliveryAddress] = useState<DeliveryAddressValue>(
    emptyDeliveryAddress()
  );
  const [businessAddress, setBusinessAddress] = useState<DeliveryAddressValue>(
    emptyDeliveryAddress()
  );

  const [companyName, setCompanyName] = useState("");
  const [businessRegistrationNumber, setBusinessRegistrationNumber] =
    useState("");
  const [storageCapacity, setStorageCapacity] = useState("");
  const [estimatedVolume, setEstimatedVolume] = useState("");
  const [estimatedVolumeUnit, setEstimatedVolumeUnit] = useState<
    EstimatedVolumeUnit | ""
  >("");
  const [estimatedVolumePeriod, setEstimatedVolumePeriod] = useState<
    EstimatedVolumePeriod | ""
  >("");
  const [estimatedVolumeCustomInterval, setEstimatedVolumeCustomInterval] =
    useState("");
  const [estimatedVolumeCustomUnit, setEstimatedVolumeCustomUnit] = useState<
    EstimatedVolumeCustomUnit | ""
  >("");
  const [supplierNetworkDescription, setSupplierNetworkDescription] =
    useState("");
  const [deliveryCapability, setDeliveryCapability] = useState(false);

  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const [pendingAvatarFile, setPendingAvatarFile] = useState<File | null>(null);

  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPasswords, setShowPasswords] = useState(false);

  const clearPendingAvatar = useCallback(() => {
    setPendingAvatarFile(null);
    setAvatarPreview((prev) => {
      if (prev?.startsWith("blob:")) URL.revokeObjectURL(prev);
      return null;
    });
  }, []);

  const hydrateFromMe = useCallback(
    (data: MeResponse) => {
      setMe(data);
      clearPendingAvatar();
      setFirstName(data.firstName ?? "");
      setLastName(data.lastName ?? "");
      setPhone(data.phone ?? "");

      setDeliveryAddress(
        deliveryAddressFromLocation(data.profile?.location ?? null)
      );
      setBusinessAddress(
        deliveryAddressFromLocation(aggregatorBusinessLocation(data))
      );

      setCompanyName(
        data.aggregatorProfile?.companyName || data.profile?.businessName || ""
      );
      setBusinessRegistrationNumber(
        data.profile?.businessRegistrationNumber ?? ""
      );
      setStorageCapacity(
        data.aggregatorProfile?.storageCapacity != null
          ? String(data.aggregatorProfile.storageCapacity)
          : ""
      );
      setEstimatedVolume(
        data.aggregatorProfile?.estimatedVolume != null
          ? String(data.aggregatorProfile.estimatedVolume)
          : ""
      );
      setEstimatedVolumeUnit(data.aggregatorProfile?.estimatedVolumeUnit ?? "");
      setEstimatedVolumePeriod(
        data.aggregatorProfile?.estimatedVolumePeriod ?? ""
      );
      setEstimatedVolumeCustomInterval(
        data.aggregatorProfile?.estimatedVolumeCustomInterval != null
          ? String(data.aggregatorProfile.estimatedVolumeCustomInterval)
          : ""
      );
      setEstimatedVolumeCustomUnit(
        data.aggregatorProfile?.estimatedVolumeCustomUnit ?? ""
      );
      setSupplierNetworkDescription(
        data.aggregatorProfile?.supplierNetworkDescription ?? ""
      );
      setDeliveryCapability(
        data.aggregatorProfile?.deliveryCapability ?? false
      );
    },
    [clearPendingAvatar]
  );

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      try {
        const data = await authService.getMe();
        if (!cancelled) hydrateFromMe(data);
      } catch (err) {
        if (!cancelled) {
          await showError(formatApiError(err), {
            title: "Could not load account",
          });
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [hydrateFromMe, showError]);

  const onAvatarSelected = (file: File | null) => {
    if (!file) {
      clearPendingAvatar();
      return;
    }
    if (!/^image\/(jpeg|png|webp)$/i.test(file.type)) {
      void showError("Use a JPEG, PNG, or WebP image.", {
        title: "Invalid image",
      });
      return;
    }
    if (file.size > 2 * 1024 * 1024) {
      void showError("Profile picture must be 2MB or smaller.", {
        title: "Image too large",
      });
      return;
    }
    setPendingAvatarFile(file);
    setAvatarPreview((prev) => {
      if (prev?.startsWith("blob:")) URL.revokeObjectURL(prev);
      return URL.createObjectURL(file);
    });
  };

  const submitPersonal = async (e: React.FormEvent) => {
    e.preventDefault();
    if (savingSection) return;
    setSavingSection("personal");
    try {
      let data = await authService.updateMePersonal({
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        phone: phone.trim(),
      });
      if (pendingAvatarFile) {
        setSavingSection("avatar");
        data = await authService.uploadMeAvatar(pendingAvatarFile);
      }
      hydrateFromMe(data);
      syncSessionFromMe(data);
      setEditing(null);
      await showSuccess("Personal details updated.", {
        title: "Profile saved",
      });
    } catch (err) {
      await showError(formatApiError(err), {
        title: "Could not update personal details",
      });
    } finally {
      setSavingSection(null);
    }
  };

  const validateAddressCoords = async (
    address: DeliveryAddressValue,
    kind: "delivery" | "business"
  ) => {
    const lat = address.latitude?.trim() ? Number(address.latitude) : NaN;
    const lng = address.longitude?.trim() ? Number(address.longitude) : NaN;
    if (
      !Number.isFinite(lat) ||
      !Number.isFinite(lng) ||
      !address.village?.trim()
    ) {
      return true;
    }

    const label = kind === "delivery" ? "delivery" : "business";
    try {
      const check = await validateCoordinatesAgainstAddress({
        latitude: lat,
        longitude: lng,
        province: address.province,
        district: address.district,
        sector: address.sector,
        cell: address.cell,
        village: address.village,
      });
      if (!check.ok) {
        setMismatchMessage(
          `${check.message} Fix the address, or request help from admin.`
        );
        setHelpPrefill({
          category: "LOCATION_MISMATCH",
          subject: `${kind === "delivery" ? "Delivery" : "Business"} coordinates do not match selected village`,
          message: `My GPS coordinates do not match the village I selected. Please help me correct my ${label} address.`,
          context: {
            summary: check.message,
            selectedAddress: address,
            lookup: check.lookup,
            mismatches: check.mismatches,
            addressKind: kind,
          },
        });
        setMismatchOpen(true);
        return false;
      }
    } catch {
      setMismatchMessage(
        "Village boundary lookup failed. Fix the address, or request help from admin."
      );
      setHelpPrefill({
        category: "LOCATION_MISMATCH",
        subject: `Could not verify ${label} coordinates`,
        message: `Village boundary lookup failed while saving my ${label} address. Please help me verify it.`,
        context: {
          summary: "Village boundary lookup failed.",
          selectedAddress: address,
          latitude: lat,
          longitude: lng,
          addressKind: kind,
        },
      });
      setMismatchOpen(true);
      return false;
    }
    return true;
  };

  const submitDelivery = async (e: React.FormEvent) => {
    e.preventDefault();
    if (savingSection) return;
    if (!hasDeliveryAddress(deliveryAddress)) {
      await showError(
        "Select a province and district for your delivery address.",
        { title: "Address required" }
      );
      return;
    }

    const coordsOk = await validateAddressCoords(deliveryAddress, "delivery");
    if (!coordsOk) return;

    setSavingSection("delivery");
    try {
      const data = await authService.updateMeProfile({
        location: toLocationPayload(deliveryAddress),
      });
      hydrateFromMe(data);
      syncSessionFromMe(data);
      setEditing(null);
      await showSuccess("Delivery address updated.", {
        title: "Address saved",
      });
    } catch (err) {
      await showError(formatApiError(err), {
        title: "Could not update delivery address",
      });
    } finally {
      setSavingSection(null);
    }
  };

  const submitAggregator = async (e: React.FormEvent) => {
    e.preventDefault();
    if (savingSection || !me?.aggregatorProfile) return;

    if (!companyName.trim()) {
      await showError("Enter your business name.", {
        title: "Business name required",
      });
      return;
    }

    if (!hasDeliveryAddress(businessAddress)) {
      await showError(
        "Select a province and district for your business location.",
        { title: "Business location required" }
      );
      return;
    }

    if (estimatedVolume && !estimatedVolumeUnit) {
      await showError("Select whether estimated volume is in trays or eggs.", {
        title: "Volume unit required",
      });
      return;
    }
    if (estimatedVolume && !estimatedVolumePeriod) {
      await showError(
        "Select a volume period (daily, weekly, monthly, or custom).",
        {
          title: "Volume period required",
        }
      );
      return;
    }
    if (
      estimatedVolumePeriod === "CUSTOM" &&
      (!estimatedVolumeCustomInterval || !estimatedVolumeCustomUnit)
    ) {
      await showError(
        "For a custom period, enter a number and choose hours, days, weeks, months, or years.",
        { title: "Custom period incomplete" }
      );
      return;
    }

    const coordsOk = await validateAddressCoords(businessAddress, "business");
    if (!coordsOk) return;

    setSavingSection("aggregator");
    try {
      const data = await authService.updateMeAggregatorProfile({
        companyName: companyName.trim(),
        businessRegistrationNumber: businessRegistrationNumber.trim() || null,
        storageCapacity: storageCapacity ? Number(storageCapacity) : null,
        estimatedVolume: estimatedVolume ? Number(estimatedVolume) : null,
        estimatedVolumeUnit: estimatedVolume
          ? (estimatedVolumeUnit as EstimatedVolumeUnit)
          : null,
        estimatedVolumePeriod: estimatedVolumePeriod || null,
        estimatedVolumeCustomInterval:
          estimatedVolumePeriod === "CUSTOM" && estimatedVolumeCustomInterval
            ? Number(estimatedVolumeCustomInterval)
            : null,
        estimatedVolumeCustomUnit:
          estimatedVolumePeriod === "CUSTOM" && estimatedVolumeCustomUnit
            ? estimatedVolumeCustomUnit
            : null,
        supplierNetworkDescription: supplierNetworkDescription.trim() || null,
        deliveryCapability,
        useMarketplaceLocation: false,
        location: toLocationPayload(businessAddress),
      });
      hydrateFromMe(data);
      syncSessionFromMe(data);
      setEditing(null);
      await showSuccess("Aggregator profile updated.", {
        title: "Profile saved",
      });
    } catch (err) {
      await showError(formatApiError(err), {
        title: "Could not update aggregator profile",
      });
    } finally {
      setSavingSection(null);
    }
  };

  const startEditing = async (section: EditSection) => {
    if (me) hydrateFromMe(me);
    setEditing(section);

    if (section === "aggregator" && me?.aggregatorProfile) {
      const hasBusiness = hasDeliveryAddress(aggregatorBusinessLocation(me));
      const hasDelivery = hasDeliveryAddress(me.profile?.location);
      if (!hasBusiness && hasDelivery) {
        const useSame = await confirm({
          title: "Use delivery address?",
          message:
            "You already have a delivery address. Use the same address for your business location?",
          confirmLabel: "Use delivery address",
          cancelLabel: "Enter a different address",
        });
        if (useSame) {
          setBusinessAddress(
            deliveryAddressFromLocation(me.profile?.location ?? null)
          );
        }
      }
      return;
    }

    if (section === "delivery" && me) {
      const hasDelivery = hasDeliveryAddress(me.profile?.location);
      const hasBusiness = hasDeliveryAddress(aggregatorBusinessLocation(me));
      if (!hasDelivery && hasBusiness) {
        const useSame = await confirm({
          title: "Use business address?",
          message:
            "You already have a business location. Use the same address for delivery?",
          confirmLabel: "Use business address",
          cancelLabel: "Enter a different address",
        });
        if (useSame) {
          setDeliveryAddress(
            deliveryAddressFromLocation(aggregatorBusinessLocation(me))
          );
        }
      }
    }
  };

  const cancelEditing = () => {
    clearPendingAvatar();
    if (me) hydrateFromMe(me);
    setEditing(null);
  };

  const displayedAvatarUrl =
    avatarPreview ?? resolveMediaUrl(me?.profile?.avatarUrl ?? null);

  const submitPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (savingSection) return;

    if (newPassword !== confirmPassword) {
      await showError("Passwords do not match.", {
        title: "Check your password",
      });
      return;
    }

    setSavingSection("password");
    try {
      const result = await authService.changePassword({
        currentPassword,
        newPassword,
        confirmPassword,
      });
      await showSuccess(result.message, { title: "Password updated" });
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
    } catch (err) {
      await showError(formatApiError(err), {
        title: "Could not update password",
      });
    } finally {
      setSavingSection(null);
    }
  };

  const tabs: { id: Tab; label: string }[] = [
    { id: "profile", label: "Profile" },
    { id: "account", label: "Account" },
  ];

  const selectTab = (next: Tab) => {
    if (next === tab) return;
    setSlide(TAB_ORDER.indexOf(next) > TAB_ORDER.indexOf(tab) ? 1 : -1);
    setTab(next);
  };

  const busy = savingSection != null;

  return (
    <>
      {dialog}
      <CoordinateMismatchDialog
        open={mismatchOpen}
        message={mismatchMessage}
        onClose={() => setMismatchOpen(false)}
        onFixAddress={() => setMismatchOpen(false)}
        onRequestHelp={() => {
          setMismatchOpen(false);
          setHelpOpen(true);
        }}
      />
      <SupportTicketModal
        open={helpOpen}
        onClose={() => setHelpOpen(false)}
        me={me}
        prefill={helpPrefill}
        onSubmitted={(ticketNumber) => {
          void showSuccess(`Support ticket ${ticketNumber} sent to admin.`, {
            title: "Help requested",
          });
        }}
        onError={(message) => {
          void showError(message, { title: "Could not send ticket" });
        }}
      />
      <div className="mb-4 flex gap-1 border-b border-soko-line">
        {tabs.map((item) => {
          const active = tab === item.id;
          return (
            <button
              key={item.id}
              type="button"
              className={`relative border-0 bg-transparent px-4 py-2.5 text-xs font-bold transition-colors duration-200 ${
                active ? "text-soko-ink" : "text-soko-muted hover:text-soko-ink"
              }`}
              onClick={() => selectTab(item.id)}
            >
              {item.label}
              {active ? (
                <motion.span
                  layoutId="account-tab-underline"
                  className="absolute right-0 bottom-0 left-0 h-0.5 bg-soko-navy"
                  transition={{ type: "spring", stiffness: 420, damping: 34 }}
                />
              ) : null}
            </button>
          );
        })}
      </div>

      <div className="relative min-h-40 overflow-hidden">
        <AnimatePresence mode="wait" initial={false} custom={slide}>
          {loading ? (
            <motion.div
              key="loading"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.22, ease: tabEase }}
            >
              <Panel title="Loading" subtitle="Fetching your account details.">
                <p className="m-0 text-xs text-soko-muted">Please wait…</p>
              </Panel>
            </motion.div>
          ) : null}

          {!loading && tab === "profile" && me ? (
            <motion.div
              key="profile"
              custom={slide}
              variants={panelStagger}
              initial="hidden"
              animate="show"
              exit="exit"
              className="flex flex-col gap-4"
            >
              <motion.div variants={panelItem}>
                <Panel
                  title="Personal details"
                  subtitle="Your account identity and contact details."
                  action={
                    editing === "personal" ? null : (
                      <EditIconButton
                        label="Edit personal details"
                        onClick={() => {
                          void startEditing("personal");
                        }}
                      />
                    )
                  }
                >
                  {editing === "personal" ? (
                    <form
                      className="flex flex-col gap-3"
                      onSubmit={(e) => void submitPersonal(e)}
                    >
                      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
                        <div className="relative h-20 w-20 shrink-0 overflow-hidden rounded-full bg-soko-navy">
                          {displayedAvatarUrl ? (
                            <img
                              src={displayedAvatarUrl}
                              alt="Profile preview"
                              className="h-full w-full object-cover"
                            />
                          ) : (
                            <div className="grid h-full w-full place-items-center font-display text-lg font-bold text-white">
                              {(firstName?.[0] ?? "").toUpperCase()}
                              {(lastName?.[0] ?? "").toUpperCase()}
                            </div>
                          )}
                        </div>
                        <div className="min-w-0 flex-1">
                          <Field label="Profile picture">
                            <input
                              type="file"
                              accept="image/jpeg,image/png,image/webp"
                              className={`${fieldClass} disabled:opacity-60`}
                              disabled={busy}
                              onChange={(e) =>
                                onAvatarSelected(e.target.files?.[0] ?? null)
                              }
                            />
                          </Field>
                          <p className="m-0 mt-1.5 text-[0.6875rem] text-soko-muted">
                            JPEG, PNG, or WebP. Max 2MB.
                          </p>
                        </div>
                      </div>
                      <div className="grid gap-3 sm:grid-cols-2">
                        <Field label="First name">
                          <input
                            className={`${fieldClass} disabled:opacity-60`}
                            value={firstName}
                            onChange={(e) => setFirstName(e.target.value)}
                            required
                            disabled={busy}
                          />
                        </Field>
                        <Field label="Last name">
                          <input
                            className={`${fieldClass} disabled:opacity-60`}
                            value={lastName}
                            onChange={(e) => setLastName(e.target.value)}
                            required
                            disabled={busy}
                          />
                        </Field>
                      </div>
                      <Field label="Phone">
                        <input
                          className={`${fieldClass} disabled:opacity-60`}
                          value={phone}
                          onChange={(e) => setPhone(e.target.value)}
                          required
                          disabled={busy}
                        />
                      </Field>
                      <p className="m-0 text-[0.6875rem] text-soko-muted">
                        Email stays tied to verification and cannot be changed
                        here.
                      </p>
                      <div className="flex flex-wrap gap-2 pt-1">
                        <button
                          type="submit"
                          className={`${btn.primaryCompact}`}
                          disabled={busy}
                          aria-busy={
                            savingSection === "personal" ||
                            savingSection === "avatar"
                          }
                        >
                          {savingSection === "personal" ||
                          savingSection === "avatar" ? (
                            <ButtonLoader label="Saving…" />
                          ) : (
                            <>
                              Save <Icon name="arrow" />
                            </>
                          )}
                        </button>
                        <button
                          type="button"
                          className={btn.outline}
                          onClick={cancelEditing}
                          disabled={busy}
                        >
                          Cancel
                        </button>
                      </div>
                    </form>
                  ) : (
                    <div className="flex flex-col gap-3.5">
                      <ProfileHero
                        avatarUrl={resolveMediaUrl(me.profile?.avatarUrl)}
                        initials={`${(me.firstName?.[0] ?? "").toUpperCase()}${(me.lastName?.[0] ?? "").toUpperCase()}`}
                        title={`${me.firstName} ${me.lastName}`}
                        subtitle={me.email}
                        badges={
                          <>
                            <SoftBadge tone={statusTone(me.status)}>
                              {me.status}
                            </SoftBadge>
                            {me.roles.map((r) => (
                              <SoftBadge key={r.id} tone="neutral">
                                {r.name}
                              </SoftBadge>
                            ))}
                          </>
                        }
                      />
                      <DetailGrid>
                        <DetailTile
                          icon="phone"
                          label="Phone"
                          value={me.phone}
                        />
                        <DetailTile
                          icon="shield"
                          label="Account status"
                          value={
                            <SoftBadge tone={statusTone(me.status)}>
                              {me.status}
                            </SoftBadge>
                          }
                        />
                        <DetailTile
                          icon="users"
                          label="Roles"
                          value={
                            me.roles.length
                              ? me.roles.map((r) => r.name).join(", ")
                              : "—"
                          }
                        />
                        <DetailTile
                          icon="calendar"
                          label="Member since"
                          value={formatDate(me.createdAt)}
                        />
                        <DetailTile
                          icon="mail"
                          label="Email verified"
                          value={formatDate(me.emailVerifiedAt)}
                          accent={
                            me.emailVerifiedAt ? (
                              <SoftBadge tone="active">Verified</SoftBadge>
                            ) : (
                              <SoftBadge tone="pending">Pending</SoftBadge>
                            )
                          }
                        />
                        <DetailTile
                          icon="phone"
                          label="Phone verified"
                          value={formatDate(me.phoneVerifiedAt)}
                          accent={
                            me.phoneVerifiedAt ? (
                              <SoftBadge tone="active">Verified</SoftBadge>
                            ) : (
                              <SoftBadge tone="pending">Unverified</SoftBadge>
                            )
                          }
                        />
                      </DetailGrid>
                    </div>
                  )}
                </Panel>
              </motion.div>

              {canEditDeliveryAddress(me) ? (
                <motion.div variants={panelItem}>
                  <Panel
                    title="Delivery address"
                    subtitle="Where orders should be delivered."
                    action={
                      editing === "delivery" ? null : (
                        <EditIconButton
                          label="Edit delivery address"
                          onClick={() => {
                            void startEditing("delivery");
                          }}
                        />
                      )
                    }
                  >
                    {editing === "delivery" ? (
                      <form
                        className="flex flex-col gap-3"
                        onSubmit={(e) => void submitDelivery(e)}
                      >
                        {hasDeliveryAddress(businessAddress) ? (
                          <div className="flex justify-end">
                            <button
                              type="button"
                              className={`${btn.text} px-0 text-[0.6875rem]`}
                              disabled={busy}
                              onClick={() =>
                                setDeliveryAddress({ ...businessAddress })
                              }
                            >
                              Use business address
                            </button>
                          </div>
                        ) : null}
                        <DeliveryAddressFields
                          value={deliveryAddress}
                          onChange={setDeliveryAddress}
                          disabled={busy}
                          required
                        />
                        <div className="flex flex-wrap gap-2 pt-1">
                          <button
                            type="submit"
                            className={`${btn.primaryCompact}`}
                            disabled={busy}
                            aria-busy={savingSection === "delivery"}
                          >
                            {savingSection === "delivery" ? (
                              <ButtonLoader label="Saving…" />
                            ) : (
                              <>
                                Save <Icon name="arrow" />
                              </>
                            )}
                          </button>
                          <button
                            type="button"
                            className={btn.outline}
                            onClick={cancelEditing}
                            disabled={busy}
                          >
                            Cancel
                          </button>
                        </div>
                      </form>
                    ) : me.profile?.location ? (
                      <div className="flex flex-col gap-3.5">
                        <AddressHero
                          address={formatDeliveryAddress(me.profile.location)}
                        />
                        <DetailGrid>
                          <DetailTile
                            icon="tag"
                            label="Hood"
                            value={me.profile.location.hood}
                          />
                          <DetailTile
                            icon="pin"
                            label="Coordinates"
                            value={
                              me.profile.location.latitude != null &&
                              me.profile.location.longitude != null
                                ? `${me.profile.location.latitude}, ${me.profile.location.longitude}`
                                : null
                            }
                          />
                        </DetailGrid>
                      </div>
                    ) : (
                      <EmptyHint>
                        No delivery address yet. Use the edit icon to add one.
                      </EmptyHint>
                    )}
                  </Panel>
                </motion.div>
              ) : null}

              {me.supplierProfile ? (
                <motion.div variants={panelItem}>
                  <Panel
                    title="Supplier profile"
                    subtitle="Supplier-specific details."
                  >
                    <DetailGrid>
                      <DetailTile
                        icon="building"
                        label="Farm name"
                        value={me.supplierProfile.farmName}
                      />
                      <DetailTile
                        icon="layers"
                        label="Estimated layers"
                        value={me.supplierProfile.estimatedLayers}
                      />
                      <DetailTile
                        icon="chart"
                        label="Avg weekly production"
                        value={me.supplierProfile.averageWeeklyProduction}
                      />
                      <DetailTile
                        icon="truck"
                        label="Delivery capability"
                        value={boolLabel(me.supplierProfile.deliveryCapability)}
                      />
                      <DetailTile
                        icon="pin"
                        label="Pickup available"
                        value={boolLabel(me.supplierProfile.pickupAvailable)}
                      />
                      <DetailTile
                        icon="shield"
                        label="Verification"
                        value={
                          <SoftBadge
                            tone={statusTone(
                              me.supplierProfile.verificationStatus
                            )}
                          >
                            {me.supplierProfile.verificationStatus}
                          </SoftBadge>
                        }
                      />
                    </DetailGrid>
                  </Panel>
                </motion.div>
              ) : null}

              {me.aggregatorProfile ? (
                <motion.div variants={panelItem}>
                  <Panel
                    title="Aggregator profile"
                    subtitle="Business details and aggregator operations."
                    action={
                      editing === "aggregator" ? null : (
                        <EditIconButton
                          label="Edit aggregator profile"
                          onClick={() => {
                            void startEditing("aggregator");
                          }}
                        />
                      )
                    }
                  >
                    {editing === "aggregator" ? (
                      <form
                        className="flex flex-col gap-3"
                        onSubmit={(e) => void submitAggregator(e)}
                      >
                        <p className="m-0 text-[0.625rem] font-bold tracking-wide text-soko-muted uppercase">
                          Business details
                        </p>
                        <Field label="Business name">
                          <input
                            className={`${fieldClass} disabled:opacity-60`}
                            value={companyName}
                            onChange={(e) => setCompanyName(e.target.value)}
                            required
                            disabled={busy}
                            placeholder="Trading or company name"
                          />
                        </Field>
                        <Field label="Business registration number">
                          <input
                            className={`${fieldClass} disabled:opacity-60`}
                            value={businessRegistrationNumber}
                            onChange={(e) =>
                              setBusinessRegistrationNumber(e.target.value)
                            }
                            disabled={busy}
                            placeholder="Optional registration / TIN"
                          />
                        </Field>

                        <div className="flex flex-wrap items-center justify-between gap-2 pt-1">
                          <p className="m-0 text-[0.625rem] font-bold tracking-wide text-soko-muted uppercase">
                            Business location
                          </p>
                          {hasDeliveryAddress(deliveryAddress) ? (
                            <button
                              type="button"
                              className={`${btn.text} px-0 text-[0.6875rem]`}
                              disabled={busy}
                              onClick={() =>
                                setBusinessAddress({ ...deliveryAddress })
                              }
                            >
                              Use delivery address
                            </button>
                          ) : null}
                        </div>
                        <div className="rounded-1.25 border border-soko-line p-3">
                          <DeliveryAddressFields
                            value={businessAddress}
                            onChange={setBusinessAddress}
                            disabled={busy}
                            required
                          />
                        </div>

                        <p className="m-0 mt-1 text-[0.625rem] font-bold tracking-wide text-soko-muted uppercase">
                          Operations
                        </p>
                        <Field label="Storage capacity">
                          <input
                            type="number"
                            min={0}
                            className={`${fieldClass} disabled:opacity-60`}
                            value={storageCapacity}
                            onChange={(e) => setStorageCapacity(e.target.value)}
                            disabled={busy}
                          />
                        </Field>

                        <div className="grid gap-3 sm:grid-cols-3">
                          <Field label="Estimated volume">
                            <input
                              type="number"
                              min={0}
                              className={`${fieldClass} disabled:opacity-60`}
                              value={estimatedVolume}
                              onChange={(e) =>
                                setEstimatedVolume(e.target.value)
                              }
                              disabled={busy}
                            />
                          </Field>
                          <Field label="Volume unit">
                            <select
                              className={`${fieldClass} disabled:opacity-60`}
                              value={estimatedVolumeUnit}
                              onChange={(e) =>
                                setEstimatedVolumeUnit(
                                  e.target.value as EstimatedVolumeUnit | ""
                                )
                              }
                              disabled={busy}
                            >
                              <option value="">Select unit</option>
                              {VOLUME_UNITS.map((unit) => (
                                <option key={unit.value} value={unit.value}>
                                  {unit.label}
                                </option>
                              ))}
                            </select>
                          </Field>
                          <Field label="Volume period">
                            <select
                              className={`${fieldClass} disabled:opacity-60`}
                              value={estimatedVolumePeriod}
                              onChange={(e) =>
                                setEstimatedVolumePeriod(
                                  e.target.value as EstimatedVolumePeriod | ""
                                )
                              }
                              disabled={busy}
                            >
                              <option value="">Select period</option>
                              {VOLUME_PERIODS.map((period) => (
                                <option key={period.value} value={period.value}>
                                  {period.label}
                                </option>
                              ))}
                            </select>
                          </Field>
                        </div>

                        {estimatedVolumePeriod === "CUSTOM" ? (
                          <div className="grid gap-3 sm:grid-cols-2">
                            <Field label="Every">
                              <input
                                type="number"
                                min={1}
                                className={`${fieldClass} disabled:opacity-60`}
                                value={estimatedVolumeCustomInterval}
                                onChange={(e) =>
                                  setEstimatedVolumeCustomInterval(
                                    e.target.value
                                  )
                                }
                                disabled={busy}
                                required
                              />
                            </Field>
                            <Field label="Time unit">
                              <select
                                className={`${fieldClass} disabled:opacity-60`}
                                value={estimatedVolumeCustomUnit}
                                onChange={(e) =>
                                  setEstimatedVolumeCustomUnit(
                                    e.target.value as
                                      EstimatedVolumeCustomUnit | ""
                                  )
                                }
                                disabled={busy}
                                required
                              >
                                <option value="">Select time unit</option>
                                {VOLUME_CUSTOM_UNITS.map((unit) => (
                                  <option key={unit.value} value={unit.value}>
                                    {unit.label}
                                  </option>
                                ))}
                              </select>
                            </Field>
                          </div>
                        ) : null}
                        <Field label="Supplier network">
                          <textarea
                            className={`${fieldClass} min-h-24 resize-y disabled:opacity-60`}
                            value={supplierNetworkDescription}
                            onChange={(e) =>
                              setSupplierNetworkDescription(e.target.value)
                            }
                            disabled={busy}
                          />
                        </Field>
                        <label className="flex items-center gap-2 text-xs text-soko-ink">
                          <input
                            type="checkbox"
                            checked={deliveryCapability}
                            onChange={(e) =>
                              setDeliveryCapability(e.target.checked)
                            }
                            disabled={busy}
                          />
                          Delivery capability
                        </label>

                        <div className="flex flex-wrap gap-2 pt-1">
                          <button
                            type="submit"
                            className={`${btn.primaryCompact}`}
                            disabled={busy}
                            aria-busy={savingSection === "aggregator"}
                          >
                            {savingSection === "aggregator" ? (
                              <ButtonLoader label="Saving…" />
                            ) : (
                              <>
                                Save <Icon name="arrow" />
                              </>
                            )}
                          </button>
                          <button
                            type="button"
                            className={btn.outline}
                            onClick={cancelEditing}
                            disabled={busy}
                          >
                            Cancel
                          </button>
                        </div>
                      </form>
                    ) : (
                      <div className="flex flex-col gap-4">
                        <div className="relative overflow-hidden rounded-xl border border-soko-line bg-white px-4 py-4 sm:px-5">
                          <div className="relative flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
                            <div className="min-w-0">
                              <p className="m-0 text-[0.625rem] font-bold tracking-[0.1em] text-soko-muted uppercase">
                                Aggregator business
                              </p>
                              <p className="m-0 mt-1 font-display text-xl font-bold tracking-tight text-soko-ink">
                                {me.aggregatorProfile.companyName ||
                                  me.profile?.businessName ||
                                  "Business name not set"}
                              </p>
                              <p className="m-0 mt-1 text-xs text-soko-muted">
                                {formatEstimatedVolume(me.aggregatorProfile)}
                              </p>
                            </div>
                            <SoftBadge
                              tone={statusTone(
                                me.aggregatorProfile.verificationStatus
                              )}
                            >
                              {me.aggregatorProfile.verificationStatus}
                            </SoftBadge>
                          </div>
                        </div>

                        <SectionBlock title="Business details">
                          <DetailGrid>
                            <DetailTile
                              icon="building"
                              label="Business name"
                              value={
                                me.aggregatorProfile.companyName ||
                                me.profile?.businessName
                              }
                            />
                            <DetailTile
                              icon="hash"
                              label="Registration number"
                              value={me.profile?.businessRegistrationNumber}
                            />
                            <DetailTile
                              icon="pin"
                              label="Business location"
                              span
                              value={
                                aggregatorBusinessLocation(me)
                                  ? formatDeliveryAddress(
                                      aggregatorBusinessLocation(me)
                                    )
                                  : me.aggregatorProfile
                                        .useMarketplaceLocation &&
                                      me.profile?.location
                                    ? formatDeliveryAddress(me.profile.location)
                                    : null
                              }
                            />
                          </DetailGrid>
                        </SectionBlock>

                        <SectionBlock title="Operations">
                          <DetailGrid>
                            <DetailTile
                              icon="layers"
                              label="Storage capacity"
                              value={me.aggregatorProfile.storageCapacity}
                            />
                            <DetailTile
                              icon="chart"
                              label="Estimated volume"
                              value={formatEstimatedVolume(
                                me.aggregatorProfile
                              )}
                            />
                            <DetailTile
                              icon="truck"
                              label="Delivery capability"
                              value={
                                <SoftBadge
                                  tone={
                                    me.aggregatorProfile.deliveryCapability
                                      ? "active"
                                      : "neutral"
                                  }
                                >
                                  {boolLabel(
                                    me.aggregatorProfile.deliveryCapability
                                  )}
                                </SoftBadge>
                              }
                            />
                            <DetailTile
                              icon="shield"
                              label="Verification"
                              value={
                                <SoftBadge
                                  tone={statusTone(
                                    me.aggregatorProfile.verificationStatus
                                  )}
                                >
                                  {me.aggregatorProfile.verificationStatus}
                                </SoftBadge>
                              }
                            />
                            <DetailTile
                              icon="users"
                              label="Supplier network"
                              span
                              value={
                                me.aggregatorProfile.supplierNetworkDescription
                              }
                            />
                          </DetailGrid>
                        </SectionBlock>
                      </div>
                    )}
                  </Panel>
                </motion.div>
              ) : null}
            </motion.div>
          ) : null}

          {!loading && tab === "account" ? (
            <motion.div
              key="account"
              initial={{ opacity: 0, x: slide * 28 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: slide * -20 }}
              transition={{ duration: 0.28, ease: tabEase }}
            >
              <Panel
                title="Change password"
                subtitle="Use a strong password you have not used elsewhere."
              >
                <form
                  className="max-w-md"
                  onSubmit={(e) => void submitPassword(e)}
                >
                  <div className="mb-3.5">
                    <Field label="Current password">
                      <span className="relative block">
                        <input
                          type={showPasswords ? "text" : "password"}
                          value={currentPassword}
                          onChange={(e) => setCurrentPassword(e.target.value)}
                          className={`${fieldClass} pr-10 disabled:opacity-60`}
                          autoComplete="current-password"
                          required
                          minLength={8}
                          disabled={busy}
                        />
                        <button
                          type="button"
                          className="absolute top-1/2 right-2.5 grid -translate-y-1/2 place-items-center border-0 bg-transparent p-0.5 text-soko-muted hover:text-soko-navy"
                          onClick={() => setShowPasswords((v) => !v)}
                          aria-label={
                            showPasswords ? "Hide passwords" : "Show passwords"
                          }
                          disabled={busy}
                        >
                          <Icon
                            name={showPasswords ? "eyeOff" : "eye"}
                            size={16}
                          />
                        </button>
                      </span>
                    </Field>
                  </div>
                  <div className="mb-3.5">
                    <Field label="New password">
                      <input
                        type={showPasswords ? "text" : "password"}
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        className={`${fieldClass} disabled:opacity-60`}
                        placeholder="At least 8 characters"
                        autoComplete="new-password"
                        required
                        minLength={8}
                        disabled={busy}
                      />
                    </Field>
                  </div>
                  <div className="mb-5">
                    <Field label="Confirm new password">
                      <input
                        type={showPasswords ? "text" : "password"}
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        className={`${fieldClass} disabled:opacity-60`}
                        placeholder="Repeat new password"
                        autoComplete="new-password"
                        required
                        minLength={8}
                        disabled={busy}
                      />
                    </Field>
                  </div>
                  <button
                    type="submit"
                    className={`${btn.primaryCompact} w-full sm:w-auto sm:px-5.5 sm:py-3.5`}
                    disabled={busy}
                    aria-busy={savingSection === "password"}
                  >
                    {savingSection === "password" ? (
                      <ButtonLoader label="Updating…" />
                    ) : (
                      <>
                        Update password <Icon name="arrow" />
                      </>
                    )}
                  </button>
                </form>
              </Panel>
            </motion.div>
          ) : null}
        </AnimatePresence>
      </div>
    </>
  );
}
