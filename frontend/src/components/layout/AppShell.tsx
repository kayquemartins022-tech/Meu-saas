import type { ReactNode } from "react";
import { Link, Navigate, NavLink, useLocation } from "react-router-dom";
import {
  BarChart3,
  Bell,
  CalendarDays,
  CreditCard,
  LayoutDashboard,
  LogOut,
  Settings,
  Users,
  Wallet,
} from "lucide-react";
import { Logo } from "@/components/Logo";
import { Button } from "@/components/ui/button";
import { useSession, useSessionActions } from "@/lib/session";
import { cn } from "@/lib/utils";

export const NAV_ITEMS = [
  { to: "/app/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { to: "/app/clientes", label: "Clientes", icon: Users },
  { to: "/app/pagamentos", label: "Pagamentos", icon: CreditCard },
  { to: "/app/financeiro", label: "Financeiro", icon: Wallet },
  { to: "/app/calendario", label: "Calendário", icon: CalendarDays },
  { to: "/app/lembretes", label: "Lembretes", icon: Bell },
  { to: "/app/relatorios", label: "Relatórios", icon: BarChart3 },
  { to: "/app/configuracoes", label: "Configurações", icon: Settings },
];

const MOBILE_ITEMS = NAV_ITEMS.filter((i) =>
  ["/app/dashboard", "/app/clientes", "/app/pagamentos", "/app/financeiro", "/app/configuracoes"].includes(
    i.to,
  ),
);

function initials(name: string) {
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase())
    .join("");
}

export default function AppShell({
  title,
  subtitle,
  actions,
  children,
}: {
  title: string;
  subtitle?: string;
  actions?: ReactNode;
  children: ReactNode;
}) {
  const { data: user, isLoading, isError } = useSession();
  const { endSession } = useSessionActions();
  const location = useLocation();

  if (isLoading) {
    return (
      <div className="grid min-h-dvh place-items-center bg-slate-50" data-testid="shell-loading">
        <div className="flex flex-col items-center gap-4">
          <Logo />
          <p className="text-sm text-slate-500">Carregando seu painel…</p>
        </div>
      </div>
    );
  }

  if (isError || !user) {
    return <Navigate to="/login" replace state={{ from: location.pathname }} />;
  }

  if (!user.onboarded) {
    return <Navigate to="/onboarding" replace />;
  }

  const businessName = user.business_name ?? "Meu negócio";
  const ownerName = user.owner_name ?? user.email;

  return (
    <div className="min-h-dvh bg-slate-50">
      {/* Desktop sidebar */}
      <aside
        className="fixed inset-y-0 left-0 z-40 hidden w-[260px] flex-col border-r border-slate-800 bg-[#0f172a] lg:flex"
        data-testid="desktop-sidebar"
      >
        <div className="px-6 py-6">
          <Logo tone="dark" to="/app/dashboard" />
        </div>
        <div className="mx-4 mb-5 rounded-xl border border-slate-800 bg-slate-900/70 px-4 py-3">
          <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">
            Negócio
          </p>
          <p className="truncate text-sm font-bold text-slate-100" data-testid="sidebar-business-name">
            {businessName}
          </p>
          <p className="truncate text-xs text-slate-400">{user.segment ?? "—"}</p>
        </div>
        <nav className="flex-1 space-y-1 overflow-y-auto px-3 pb-6">
          {NAV_ITEMS.map(({ to, label, icon: Icon }) => (
            <NavLink
              key={to}
              to={to}
              data-testid={`sidebar-link-${label.toLowerCase()}`}
              className={({ isActive }) =>
                cn(
                  "flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold text-slate-400 transition-colors duration-150 hover:bg-slate-800/70 hover:text-slate-100",
                  isActive && "bg-slate-800 text-sky-400",
                )
              }
            >
              <Icon className="size-[18px] shrink-0" />
              {label}
            </NavLink>
          ))}
        </nav>
        <div className="border-t border-slate-800 p-4">
          <div className="mb-3 flex items-center gap-3">
            <span className="grid size-9 shrink-0 place-items-center rounded-full bg-indigo-600 text-xs font-bold text-white">
              {initials(ownerName)}
            </span>
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold text-slate-100">{ownerName}</p>
              <p className="truncate text-xs text-slate-500">{user.email}</p>
            </div>
          </div>
          <Button
            variant="ghost"
            size="sm"
            data-testid="sidebar-logout-button"
            onClick={() => void endSession()}
            className="w-full justify-start gap-2 text-slate-400 hover:bg-slate-800 hover:text-rose-400"
          >
            <LogOut className="size-4" /> Sair da conta
          </Button>
        </div>
      </aside>

      {/* Mobile header */}
      <header
        className="sticky top-0 z-40 flex h-16 items-center justify-between border-b border-slate-200 bg-white/85 px-4 backdrop-blur-xl lg:hidden"
        data-testid="mobile-header"
      >
        <Logo to="/app/dashboard" />
        <div className="flex items-center gap-1">
          <Link
            to="/app/lembretes"
            aria-label="Lembretes"
            data-testid="mobile-reminders-link"
            className="grid size-11 place-items-center rounded-xl text-slate-600 transition-colors duration-150 active:bg-slate-100"
          >
            <Bell className="size-5" />
          </Link>
          <button
            type="button"
            aria-label="Sair da conta"
            data-testid="mobile-logout-button"
            onClick={() => void endSession()}
            className="grid size-11 place-items-center rounded-xl text-slate-600 transition-colors duration-150 active:bg-slate-100"
          >
            <LogOut className="size-5" />
          </button>
        </div>
      </header>

      {/* Content */}
      <main className="lg:pl-[260px]">
        <div className="mx-auto w-full max-w-7xl px-4 pb-28 pt-6 md:px-6 lg:px-10 lg:pb-12 lg:pt-10">
          <div className="mb-7 flex flex-wrap items-end justify-between gap-4">
            <div>
              <h1
                className="text-2xl font-extrabold tracking-tight text-slate-900 md:text-3xl"
                data-testid="page-title"
              >
                {title}
              </h1>
              {subtitle ? (
                <p className="mt-1 max-w-2xl text-sm text-slate-500">{subtitle}</p>
              ) : null}
            </div>
            {actions ? <div className="flex items-center gap-2">{actions}</div> : null}
          </div>
          {children}
        </div>
      </main>

      {/* Mobile bottom nav */}
      <nav
        className="fixed inset-x-0 bottom-0 z-40 border-t border-slate-200 bg-white/95 pb-[env(safe-area-inset-bottom)] backdrop-blur-xl lg:hidden"
        data-testid="mobile-bottom-nav"
      >
        <div className="grid grid-cols-5">
          {MOBILE_ITEMS.map(({ to, label, icon: Icon }) => (
            <NavLink
              key={to}
              to={to}
              data-testid={`mobilenav-link-${label.toLowerCase()}`}
              className={({ isActive }) =>
                cn(
                  "flex min-h-[60px] flex-col items-center justify-center gap-1 text-[11px] font-semibold text-slate-500 transition-colors duration-150",
                  isActive && "text-indigo-700",
                )
              }
            >
              <Icon className="size-5" />
              <span className="truncate px-1">{label}</span>
            </NavLink>
          ))}
        </div>
      </nav>
    </div>
  );
}
