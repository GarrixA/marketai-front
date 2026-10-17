"use client";

import { useEffect, useMemo, useState, type ReactNode } from "react";
import { usePathname, useRouter } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import { ProfileMenu } from "@/components/ProfileMenu";
import { UserAvatar } from "@/components/UserAvatar";
import { ActionButton, Icon, Logo } from "@/lib/ui";
import { getSession, patchSession, type DashboardRole } from "@/lib/session";
import { authService } from "@/services/auth.service";
import { MarketplaceProvider } from "@/components/marketplace/MarketplaceProvider";
import { ProductFormModal } from "@/components/marketplace/ProductFormModal";
import {
  TradeResultModal,
  type TradeResult,
} from "@/components/marketplace/TradeResultModal";
import { formatRwandaLocation } from "@/components/forms/RwandaLocationFields";
import { useMarketplace } from "@/components/marketplace/MarketplaceProvider";
import { NavBadge } from "@/components/dashboard/NavBadge";
import { getNavBadges } from "@/lib/navBadges";
import { mapApiDealToLocal } from "@/lib/mapApiDeal";
import { subscribeSellOffersSeen } from "@/lib/sellOffersSeen";
import {
  liveDealListOptions,
  useListAllDealsQuery,
  useListIncomingDealsQuery,
  useListMyDealsQuery,
  useListTransportDealsQuery,
} from "@/store/actions/deals";
import {
  SECTION_ICON,
  SECTION_PATH,
  navByRole,
  pathForSection,
  roleCanAccess,
  sectionFromPath,
  utilityPageFromPath,
  type DashboardSection,
} from "@/lib/dashboardNav";

const workspaceLabel: Record<DashboardRole, string> = {
  buyer: "Buyer",
  supplier: "Supplier",
  aggregator: "Aggregator",
  logistics: "Logistics",
  admin: "Operations",
};

function useWorkspaceBadges(role: DashboardRole) {
  const session = getSession();
  const { deals, inventory, sellOffers } = useMarketplace();
  const [, setSeenTick] = useState(0);

  useEffect(() => subscribeSellOffersSeen(() => setSeenTick((n) => n + 1)), []);

  const canFetchMine =
    role === "buyer" || role === "aggregator" || role === "admin";
  const canFetchIncoming =
    role === "supplier" || role === "aggregator" || role === "admin";
  const canFetchTransport = role === "logistics" || role === "admin";
  const { data: myApiDeals = [] } = useListMyDealsQuery(undefined, {
    ...liveDealListOptions,
    skip: !canFetchMine,
  });
  const { data: incomingApiDeals = [] } = useListIncomingDealsQuery(undefined, {
    ...liveDealListOptions,
    skip: !canFetchIncoming,
  });
  const { data: transportApiDeals = [] } = useListTransportDealsQuery(
    undefined,
    {
      ...liveDealListOptions,
      skip: !canFetchTransport,
    }
  );
  const { data: allApiDeals = [] } = useListAllDealsQuery(undefined, {
    ...liveDealListOptions,
    skip: role !== "admin",
  });
  const apiDeals = useMemo(
    () => [
      ...myApiDeals.map(mapApiDealToLocal),
      ...incomingApiDeals.map(mapApiDealToLocal),
      ...transportApiDeals.map(mapApiDealToLocal),
      ...allApiDeals.map(mapApiDealToLocal),
    ],
    [myApiDeals, incomingApiDeals, transportApiDeals, allApiDeals]
  );

  return getNavBadges({
    role,
    email: session?.email ?? "",
    userId: session?.userId,
    deals,
    inventory,
    sellOffers,
    apiDeals,
  });
}

function SidebarNav({
  role,
  active,
  onLeaveWorkspace,
  onLogout,
  onNavigate,
  displayName,
  businessName,
  avatarUrl,
}: {
  role: DashboardRole;
  active: DashboardSection | null;
  onLeaveWorkspace: () => void;
  onLogout: () => void;
  onNavigate?: () => void;
  displayName: string;
  businessName: string;
  avatarUrl?: string | null;
}) {
  const router = useRouter();
  const badges = useWorkspaceBadges(role);

  const go = (section: DashboardSection) => {
    router.push(SECTION_PATH[section]);
    onNavigate?.();
  };

  return (
    <>
      <div className="mx-2.5 mb-8">
        <Logo
          onHome={() => {
            onLeaveWorkspace();
            onNavigate?.();
          }}
        />
      </div>
      <div className="px-2.75 pb-3.25 text-[0.5rem] tracking-[0.09375rem] text-soko-muted uppercase">
        WORKSPACE{" "}
        <span className="float-right text-soko-ink">
          {workspaceLabel[role].toUpperCase()}
        </span>
      </div>
      <nav className="flex flex-col gap-0.5 overflow-auto">
        {navByRole[role].map((item) => {
          const count = badges[item] ?? 0;
          const isActive = active === item;
          return (
            <motion.button
              key={item}
              type="button"
              className={`flex w-full items-center gap-3 rounded-1.25 border-0 px-2.75 py-2.5 text-left text-xs ${
                isActive
                  ? "bg-soko-slate text-soko-ink"
                  : "bg-transparent text-soko-muted hover:bg-soko-slate hover:text-soko-ink"
              }`}
              onClick={() => go(item)}
              whileHover={count > 0 ? { x: 2 } : undefined}
              whileTap={{ scale: 0.98 }}
              transition={{ type: "spring", stiffness: 420, damping: 28 }}
            >
              <span className="relative shrink-0">
                <Icon
                  name={SECTION_ICON[item]}
                  className="min-w-4.5 shrink-0"
                />
                {count > 0 && !isActive ? (
                  <motion.span
                    className="absolute -top-0.5 -right-0.5 h-1.5 w-1.5 rounded-full bg-[#ef4444]"
                    animate={{ scale: [1, 1.35, 1], opacity: [1, 0.7, 1] }}
                    transition={{
                      duration: 1.4,
                      repeat: Infinity,
                      ease: "easeInOut",
                    }}
                    aria-hidden
                  />
                ) : null}
              </span>
              <span className="min-w-0 flex-1 truncate">{item}</span>
              <NavBadge count={isActive ? 0 : count} />
            </motion.button>
          );
        })}
      </nav>
      <button
        type="button"
        className="mt-auto flex items-center gap-3 border-0 border-t border-soko-line bg-transparent px-2.75 pt-4.25 text-left text-xs text-soko-muted hover:text-soko-ink"
        onClick={() => {
          onLeaveWorkspace();
          onNavigate?.();
        }}
      >
        <Icon name="arrow" className="rotate-180" />
        <span>Public marketplace</span>
      </button>
      <div className="mt-3 border-t border-soko-line px-2 pt-3.25">
        <div className="flex items-center gap-2.5">
          <UserAvatar
            name={displayName}
            avatarUrl={avatarUrl}
            size="sm"
            fallback="initials"
          />
          <div className="min-w-0">
            <strong className="block truncate text-[0.6875rem] text-soko-ink">
              {displayName}
            </strong>
            <small className="block truncate text-[0.5625rem] text-soko-muted">
              {businessName || "Verified account"}
            </small>
          </div>
        </div>
        <button
          type="button"
          className="mt-3 flex w-full items-center gap-2 border-0 bg-transparent px-0 py-1.5 text-left text-[0.6875rem] font-bold text-soko-muted hover:text-soko-ink"
          onClick={() => {
            onLogout();
            onNavigate?.();
          }}
        >
          <Icon name="arrow" className="rotate-180" size={15} />
          <span>Log out</span>
        </button>
      </div>
    </>
  );
}

function MobileMenuModal({
  open,
  onClose,
  role,
  active,
  onLeaveWorkspace,
  onLogout,
  displayName,
  businessName,
  avatarUrl,
}: {
  open: boolean;
  onClose: () => void;
  role: DashboardRole;
  active: DashboardSection | null;
  onLeaveWorkspace: () => void;
  onLogout: () => void;
  displayName: string;
  businessName: string;
  avatarUrl?: string | null;
}) {
  return (
    <AnimatePresence>
      {open ? (
        <div className="fixed inset-0 z-50 md:hidden">
          <motion.button
            type="button"
            aria-label="Close menu"
            className="absolute inset-0 border-0 bg-soko-navy/72"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={onClose}
          />
          <motion.aside
            className="absolute inset-y-0 left-0 flex w-[min(20rem,86vw)] flex-col bg-white px-4 py-6.25 text-soko-ink shadow-xl"
            initial={{ x: "-100%" }}
            animate={{ x: 0 }}
            exit={{ x: "-100%" }}
            transition={{
              type: "tween",
              duration: 0.28,
              ease: [0.22, 1, 0.36, 1],
            }}
          >
            <button
              type="button"
              className="absolute top-4 right-4 grid h-9 w-9 place-items-center rounded-full border border-soko-line bg-white"
              onClick={onClose}
              aria-label="Close menu"
            >
              <Icon name="close" />
            </button>
            <SidebarNav
              role={role}
              active={active}
              onLeaveWorkspace={onLeaveWorkspace}
              onLogout={onLogout}
              displayName={displayName}
              businessName={businessName}
              avatarUrl={avatarUrl}
              onNavigate={onClose}
            />
          </motion.aside>
        </div>
      ) : null}
    </AnimatePresence>
  );
}

function MobileMenuButton({
  role,
  onOpen,
}: {
  role: DashboardRole;
  onOpen: () => void;
}) {
  const badges = useWorkspaceBadges(role);
  const pending = Object.entries(badges)
    .filter(([section]) => section !== "Overview")
    .reduce((sum, [, n]) => sum + (n ?? 0), 0);

  return (
    <motion.button
      type="button"
      className="relative grid h-9 w-9 place-items-center rounded-md border border-soko-line bg-white text-soko-ink md:hidden"
      onClick={onOpen}
      aria-label={pending > 0 ? `Open menu, ${pending} pending` : "Open menu"}
      whileTap={{ scale: 0.94 }}
    >
      <Icon name="menu" />
      {pending > 0 ? (
        <motion.span
          className="absolute -top-1 -right-1 flex h-4.5 min-w-4.5 items-center justify-center rounded-full bg-[#ef4444] px-1 text-[0.5rem] font-extrabold text-white"
          initial={{ scale: 0 }}
          animate={{ scale: [1, 1.15, 1] }}
          transition={{
            duration: 1.5,
            repeat: Infinity,
            repeatDelay: 1,
            ease: "easeInOut",
          }}
        >
          {pending > 9 ? "9+" : pending}
        </motion.span>
      ) : null}
    </motion.button>
  );
}

export function DashboardShell({
  role,
  children,
}: {
  role: DashboardRole;
  children: ReactNode;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const session = getSession();
  const utilityPage = utilityPageFromPath(pathname);
  const active = utilityPage ? null : sectionFromPath(pathname);
  const [stockOpen, setStockOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [tradeResult, setTradeResult] = useState<TradeResult | null>(null);
  const [displayName, setDisplayName] = useState(
    session?.name ?? "Aline Kabera"
  );
  const [businessName, setBusinessName] = useState(
    session?.businessName ?? "Verified account"
  );
  const [avatarUrl, setAvatarUrl] = useState<string | null>(
    session?.avatarUrl ?? null
  );

  useEffect(() => {
    if (utilityPage) return;
    if (active && !roleCanAccess(role, active)) {
      router.replace(SECTION_PATH.Overview);
    }
  }, [role, active, router, utilityPage]);

  useEffect(() => {
    const syncFromSession = () => {
      const next = getSession();
      if (!next) return;
      setDisplayName(next.name);
      setBusinessName(next.businessName || "Verified account");
      setAvatarUrl(next.avatarUrl ?? null);
    };
    window.addEventListener("soko-session", syncFromSession);
    return () => window.removeEventListener("soko-session", syncFromSession);
  }, []);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const me = await authService.getMe();
        if (cancelled) return;
        const name = `${me.firstName} ${me.lastName}`.trim() || displayName;
        const nextBusiness =
          me.profile?.businessName || me.profile?.displayName || name;
        const nextAvatar = me.profile?.avatarUrl ?? null;
        setDisplayName(name);
        setBusinessName(nextBusiness);
        setAvatarUrl(nextAvatar);
        patchSession({
          name,
          email: me.email,
          phone: me.phone,
          businessName: nextBusiness,
          avatarUrl: nextAvatar,
        });
      } catch {
        // Keep local session values if /me is unavailable.
      }
    })();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps -- refresh once on mount
  }, []);

  const today = new Date().toLocaleDateString("en-GB", {
    weekday: "long",
    day: "numeric",
    month: "long",
  });

  const goToMarketplace = () => router.push("/");
  const logout = () => {
    void Promise.resolve(authService.logout()).finally(() => {
      router.push("/");
    });
  };

  const headerName =
    session?.businessName ??
    (role === "admin"
      ? "Platform Operations"
      : role === "supplier"
        ? "Musanze Growers Co-op"
        : role === "aggregator"
          ? "Northern Egg Hub"
          : role === "logistics"
            ? "SwiftRoute Logistics"
            : "Kigali Fresh Foods");

  const canRecord = role === "supplier" || role === "aggregator";

  const onPrimary = () => {
    if (canRecord) {
      if (active !== "Products") {
        router.push(pathForSection("Products"));
      }
      setStockOpen(true);
      return;
    }
    if (role === "logistics") router.push(pathForSection("Transport"));
    else router.push(pathForSection("Products"));
  };

  return (
    <MarketplaceProvider>
      <div className="flex min-h-screen bg-soko-slate">
        <aside className="fixed inset-y-0 left-0 z-10 hidden w-60 flex-col border-r border-soko-line bg-white px-4 py-6.25 text-soko-ink md:flex">
          <SidebarNav
            role={role}
            active={active}
            onLeaveWorkspace={goToMarketplace}
            onLogout={logout}
            displayName={displayName}
            businessName={businessName}
            avatarUrl={avatarUrl}
          />
        </aside>

        <div className="w-full md:ml-60 md:w-[calc(100%-240px)]">
          <header className="sticky top-0 z-5 flex h-17 items-center gap-3 border-b border-soko-line bg-white px-4 text-soko-ink sm:px-6 md:px-8">
            <MobileMenuButton role={role} onOpen={() => setMenuOpen(true)} />
            <div className="min-w-0">
              <span className="block text-[0.5625rem] text-soko-muted">
                Soko workspace
              </span>
              <strong className="block truncate text-[0.8125rem]">
                {headerName}
              </strong>
            </div>
            <div className="ml-auto flex items-center gap-3">
              <ProfileMenu
                onLogout={logout}
                displayName={displayName}
                avatarUrl={avatarUrl}
              />
            </div>
          </header>

          <main className="mx-auto max-w-362.5 p-4 sm:p-6 md:p-8">
            <div className="mb-6 flex flex-col gap-4 sm:mb-6.75 sm:flex-row sm:items-end sm:justify-between">
              <div className="min-w-0">
                <p
                  className="m-0 text-[0.625rem] tracking-wide text-soko-muted uppercase"
                  suppressHydrationWarning
                >
                  {today}
                </p>
                <h1 className="my-1.5 font-display text-[1.375rem] font-bold sm:text-[1.6875rem]">
                  {utilityPage === "account"
                    ? "My account"
                    : utilityPage === "settings"
                      ? "Settings"
                      : active === "Overview"
                        ? `Good morning, ${displayName.split(" ")[0] || "there"}.`
                        : active}
                </h1>
                <span className="text-xs text-soko-muted">
                  {utilityPage === "account"
                    ? "View your profile details and manage account security."
                    : utilityPage === "settings"
                      ? "Workspace preferences for this browser."
                      : active === "Overview"
                        ? role === "aggregator"
                          ? "Buy and sell from one workspace — market, payments, and transport."
                          : "Live catalog and deal activity from the marketplace."
                        : active === "Products" && role === "admin"
                          ? "Listings, availability, who is selling, and listed value."
                          : active === "Products"
                            ? role === "aggregator"
                              ? "Manage your products, then buy or sell on the market."
                              : role === "supplier"
                                ? "Create and manage your products — availability and location included."
                                : "Buy eggs from suppliers and aggregators."
                            : active === "Market"
                              ? role === "aggregator"
                                ? "Buy listings or sell into open requests."
                                : role === "supplier"
                                  ? "Open requests you can sell into."
                                  : "Listings you can buy."
                              : active === "Sell Offers"
                                ? "New listings from suppliers and aggregators — review and buy."
                                : active === "Deals" && role === "admin"
                                  ? "Volume, status, where each deal is going, and who owns both sides."
                                  : active === "Users"
                                    ? "Create accounts and assign platform roles."
                                    : active === "Support"
                                      ? "Review help requests from buyers and sellers."
                                      : active === "Orders" &&
                                          role === "aggregator"
                                        ? "Orders for products you sold, and purchases you made."
                                        : active === "Income"
                                          ? "Delivery fees credited after a buyer confirms receipt."
                                          : `Manage ${(active ?? "workspace").toLowerCase()} for the demo marketplace.`}
                </span>
              </div>
              {!utilityPage && active !== "Users" ? (
                <ActionButton
                  variant={
                    canRecord ? "sell" : role === "buyer" ? "buy" : "primary"
                  }
                  size="md"
                  icon={
                    canRecord
                      ? "arrow"
                      : role === "logistics"
                        ? "truck"
                        : role === "buyer"
                          ? "cart"
                          : "box"
                  }
                  iconPosition="right"
                  fullWidth
                  className="sm:w-auto"
                  onClick={onPrimary}
                >
                  {canRecord
                    ? "List for sale"
                    : role === "logistics"
                      ? "View transport"
                      : "Browse products"}
                </ActionButton>
              ) : null}
            </div>

            {children}
          </main>
        </div>
      </div>

      <MobileMenuModal
        open={menuOpen}
        onClose={() => setMenuOpen(false)}
        role={role}
        active={active}
        onLeaveWorkspace={goToMarketplace}
        onLogout={logout}
        displayName={displayName}
        businessName={businessName}
        avatarUrl={avatarUrl}
      />
      {canRecord ? (
        <ProductFormModal
          open={stockOpen}
          onClose={() => setStockOpen(false)}
          onSuccess={(saved, isUpdate) => {
            if (active !== "Products") {
              router.push(pathForSection("Products"));
            }
            setTradeResult({
              kind: "sell",
              title: isUpdate ? "Product updated" : "Listed for sale",
              message: isUpdate
                ? "Your product changes are live on the sell tab."
                : "Your product is now visible on your sell tab.",
              details: [
                `${saved.name}${saved.grade ? ` · ${saved.grade}` : ""}`,
                `${Number(saved.price || 0).toLocaleString("en-RW")} RWF / ${saved.unit.toLowerCase()}`,
                `${saved.availableQuantity} ${saved.unit}`,
                formatRwandaLocation(saved.location),
              ],
            });
          }}
        />
      ) : null}
      <TradeResultModal
        result={tradeResult}
        onClose={() => setTradeResult(null)}
      />
    </MarketplaceProvider>
  );
}
