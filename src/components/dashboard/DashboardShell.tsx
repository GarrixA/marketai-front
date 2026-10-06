"use client";

import { useEffect, useState, type ReactNode } from "react";
import { usePathname, useRouter } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import { Icon, Logo, btn } from "@/lib/ui";
import { clearSession, getSession, type DashboardRole } from "@/lib/session";
import { MarketplaceProvider } from "@/components/marketplace/MarketplaceProvider";
import { RecordStockModal } from "@/components/marketplace/RecordStockModal";
import {
  TradeResultModal,
  type TradeResult,
} from "@/components/marketplace/TradeResultModal";
// import { MOCK_USERS } from "@/lib/mockUsers";
import { formatRwf } from "@/lib/marketplaceStore";
import { useMarketplace } from "@/components/marketplace/MarketplaceProvider";
import { NavBadge } from "@/components/dashboard/NavBadge";
import { getNavBadges } from "@/lib/navBadges";
import { subscribeSellOffersSeen } from "@/lib/sellOffersSeen";
import {
  SECTION_ICON,
  SECTION_PATH,
  navByRole,
  pathForSection,
  roleCanAccess,
  sectionFromPath,
  type DashboardSection,
} from "@/lib/dashboardNav";

const workspaceLabel: Record<DashboardRole, string> = {
  buyer: "Buyer",
  supplier: "Supplier",
  aggregator: "Aggregator",
  logistics: "Logistics",
  admin: "Operations",
};

// function DemoAccountsHint() {
//   return (
//     <details className="rounded-1.25 border border-[#e5e4df] bg-white px-3.5 py-2.5 text-[0.625rem] text-soko-muted">
//       <summary className="cursor-pointer font-bold text-soko-ink">
//         Demo accounts (shared deal state)
//       </summary>
//       <ul className="mt-2 mb-0 space-y-1 pl-4">
//         {MOCK_USERS.map((u) => (
//           <li key={u.email}>
//             <b className="text-soko-ink">{u.role}</b>: {u.email} / {u.password}
//           </li>
//         ))}
//       </ul>
//     </details>
//   );
// }

function SidebarNav({
  role,
  active,
  onLeaveWorkspace,
  onLogout,
  onNavigate,
}: {
  role: DashboardRole;
  active: DashboardSection;
  onLeaveWorkspace: () => void;
  onLogout: () => void;
  onNavigate?: () => void;
}) {
  const router = useRouter();
  const session = getSession();
  const { deals, inventory, sellOffers } = useMarketplace();
  const [, setSeenTick] = useState(0);
  const displayName = session?.name ?? "Aline Kabera";
  const initials = displayName
    .split(" ")
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  useEffect(() => subscribeSellOffersSeen(() => setSeenTick((n) => n + 1)), []);

  const badges = getNavBadges({
    role,
    email: session?.email ?? "",
    deals,
    inventory,
    sellOffers,
  });

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
                  ? "bg-[#f5f5f1] text-soko-ink"
                  : "bg-transparent text-soko-muted hover:bg-[#f5f5f1] hover:text-soko-ink"
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
        className="mt-auto flex items-center gap-3 border-0 border-t border-[#e5e4df] bg-transparent px-2.75 pt-4.25 text-left text-xs text-soko-muted hover:text-soko-ink"
        onClick={() => {
          onLeaveWorkspace();
          onNavigate?.();
        }}
      >
        <Icon name="arrow" className="rotate-180" />
        <span>Public marketplace</span>
      </button>
      <div className="mt-3 border-t border-[#e5e4df] px-2 pt-3.25">
        <div className="flex items-center gap-2.5">
          <span className="grid h-7.5 w-7.5 place-items-center rounded-full bg-[#f5f5f1] text-[0.625rem] font-extrabold text-soko-ink">
            {initials}
          </span>
          <div>
            <strong className="block text-[0.6875rem]">{displayName}</strong>
            <small className="block text-[0.5625rem] text-soko-muted">
              {session?.businessName ?? "Verified account"}
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
}: {
  open: boolean;
  onClose: () => void;
  role: DashboardRole;
  active: DashboardSection;
  onLeaveWorkspace: () => void;
  onLogout: () => void;
}) {
  return (
    <AnimatePresence>
      {open ? (
        <div className="fixed inset-0 z-50 md:hidden">
          <motion.button
            type="button"
            aria-label="Close menu"
            className="absolute inset-0 border-0 bg-[#08141cb8]"
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
              className="absolute top-4 right-4 grid h-9 w-9 place-items-center rounded-full border border-[#ddd] bg-white"
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
  const session = getSession();
  const { deals, inventory, sellOffers } = useMarketplace();
  const [, setSeenTick] = useState(0);

  useEffect(() => subscribeSellOffersSeen(() => setSeenTick((n) => n + 1)), []);

  const badges = getNavBadges({
    role,
    email: session?.email ?? "",
    deals,
    inventory,
    sellOffers,
  });
  const pending = Object.entries(badges)
    .filter(([section]) => section !== "Overview")
    .reduce((sum, [, n]) => sum + (n ?? 0), 0);

  return (
    <motion.button
      type="button"
      className="relative grid h-9 w-9 place-items-center rounded-md border border-[#e5e4df] bg-white md:hidden"
      onClick={onOpen}
      aria-label={
        pending > 0 ? `Open menu, ${pending} pending` : "Open menu"
      }
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
  const active = sectionFromPath(pathname);
  const [stockOpen, setStockOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [tradeResult, setTradeResult] = useState<TradeResult | null>(null);

  useEffect(() => {
    if (!roleCanAccess(role, active)) {
      router.replace(SECTION_PATH.Overview);
    }
  }, [role, active, router]);

  const today = new Date().toLocaleDateString("en-GB", {
    weekday: "long",
    day: "numeric",
    month: "long",
  });

  const goToMarketplace = () => router.push("/");
  const logout = () => {
    clearSession();
    router.push("/");
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
      setStockOpen(true);
      return;
    }
    if (role === "logistics") router.push(pathForSection("Transport"));
    else if (role === "buyer") router.push(pathForSection("Sell Offers"));
    else router.push(pathForSection("Products"));
  };

  return (
    <MarketplaceProvider>
      <div className="flex min-h-screen bg-[#f5f5f1]">
        <aside className="fixed inset-y-0 left-0 z-10 hidden w-60 flex-col border-r border-[#e5e4df] bg-white px-4 py-6.25 text-soko-ink md:flex">
          <SidebarNav
            role={role}
            active={active}
            onLeaveWorkspace={goToMarketplace}
            onLogout={logout}
          />
        </aside>

        <div className="w-full md:ml-60 md:w-[calc(100%-240px)]">
          <header className="sticky top-0 z-5 flex h-17 items-center gap-3 border-b border-[#dddeda] bg-white px-4 sm:px-6 md:px-8">
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
              <span className="hidden rounded-full bg-[#eef1f4] px-2.5 py-1 text-[0.5625rem] font-bold text-soko-green sm:inline">
                MVP showcase
              </span>
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
                  {active === "Overview"
                    ? `Good morning, ${session?.name?.split(" ")[0] ?? "there"}.`
                    : active}
                </h1>
                <span className="text-xs text-soko-muted">
                  {active === "Overview"
                    ? role === "aggregator"
                      ? "Buy and sell from one workspace — market, payments, and transport."
                      : "Analytics first, then move deals through the MVP loop."
                    : active === "Products"
                      ? role === "aggregator"
                        ? "Use Buy to source stock, Sell to manage your listings."
                        : role === "supplier"
                          ? "Your sell listings — tap Sell to update stock."
                          : "Buy eggs from suppliers and aggregators."
                      : active === "Sell Offers"
                        ? "New listings from suppliers and aggregators — review and buy."
                        : `Manage ${active.toLowerCase()} for the demo marketplace.`}
                </span>
              </div>
              <button
                type="button"
                className={`${
                  canRecord
                    ? btn.sellCompact
                    : role === "buyer"
                      ? btn.buyCompact
                      : btn.primaryCompact
                } w-full sm:w-auto sm:px-5.5 sm:py-3.5`}
                onClick={onPrimary}
              >
                {canRecord
                  ? "List for sale"
                  : role === "logistics"
                    ? "View transport"
                    : role === "buyer"
                      ? "View sell offers"
                      : "Browse products"}{" "}
                <Icon name="arrow" />
              </button>
            </div>

            {/* <div className="mb-4.25">
              <DemoAccountsHint />
            </div> */}

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
      />
      <RecordStockModal
        open={stockOpen}
        onClose={() => setStockOpen(false)}
        onSuccess={(result) => {
          setTradeResult({
            kind: "sell",
            title: result.isUpdate
              ? "Sell order confirmed"
              : "Listing published",
            message: result.isUpdate
              ? "Your sell offer is live for buyers under Sell Offers."
              : "Your product is now live for buyers under Sell Offers.",
            details: [
              `${result.product} · ${result.grade}`,
              `${result.quantity} trays @ ${formatRwf(result.pricePerUnit)}/tray`,
              result.location,
            ],
          });
        }}
      />
      <TradeResultModal
        result={tradeResult}
        onClose={() => setTradeResult(null)}
      />
    </MarketplaceProvider>
  );
}
