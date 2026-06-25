import {
  ArrowLeftRight,
  BarChart3,
  ChevronsLeft,
  FileText,
  LayoutDashboard,
  Package,
  PanelLeft,
  ShieldCheck,
  ShoppingCart,
  Tags,
  Users,
  type LucideIcon,
} from "lucide-react";
import { Logo } from "@/components/brand/Logo";
import { useEffect } from "react";
import { NavLink, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/Button";
import { Tooltip } from "@/components/ui/Tooltip";
import { useAuth } from "@/features/auth/AuthContext";
import { cn } from "@/lib/cn";
import { landingRouteForRole } from "@/routes/landing";
import type { Role } from "@/types";

interface NavItem {
  to: string;
  label: string;
  icon: LucideIcon;
  roles?: Role[];
}

interface NavSection {
  label?: string;
  items: NavItem[];
}

const SECTIONS: NavSection[] = [
  {
    items: [
      {
        to: "/dashboard",
        label: "Tableau de bord",
        icon: LayoutDashboard,
        roles: ["ADMIN", "MANAGER"],
      },
      {
        to: "/reports",
        label: "Rapports",
        icon: BarChart3,
        roles: ["ADMIN", "MANAGER"],
      },
    ],
  },
  {
    label: "Catalogue",
    items: [
      { to: "/products", label: "Produits", icon: Package },
      { to: "/categories", label: "Catégories", icon: Tags },
    ],
  },
  {
    label: "Opérations",
    items: [
      {
        to: "/stock-movements",
        label: "Mouvements de stock",
        icon: ArrowLeftRight,
        roles: ["ADMIN", "STOCK_MANAGER", "MANAGER"],
      },
      {
        to: "/ventes",
        label: "Ventes",
        icon: ShoppingCart,
        roles: ["ADMIN", "SELLER", "MANAGER"],
      },
      {
        to: "/invoices",
        label: "Factures",
        icon: FileText,
        roles: ["ADMIN", "MANAGER"],
      },
    ],
  },
  {
    label: "Administration",
    items: [
      { to: "/users", label: "Utilisateurs", icon: Users, roles: ["ADMIN"] },
      { to: "/roles", label: "Rôles", icon: ShieldCheck, roles: ["ADMIN"] },
    ],
  },
];

interface SidebarProps {
  mobileOpen: boolean;
  onMobileClose: () => void;
  collapsed: boolean;
  onCollapsedChange: (next: boolean) => void;
}

export function Sidebar({
  mobileOpen,
  onMobileClose,
  collapsed,
  onCollapsedChange,
}: SidebarProps) {
  const { hasRole, user } = useAuth();
  const location = useLocation();
  const home = landingRouteForRole(user?.role);

  // Ferme le drawer mobile lors d'une navigation
  useEffect(() => {
    onMobileClose();
    // location.pathname uniquement — onMobileClose est stable
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location.pathname]);

  // Esc → ferme le drawer mobile
  useEffect(() => {
    if (!mobileOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onMobileClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [mobileOpen, onMobileClose]);

  const sections = SECTIONS.map((s) => ({
    ...s,
    items: s.items.filter((item) => !item.roles || hasRole(...item.roles)),
  })).filter((s) => s.items.length > 0);

  return (
    <>
      {/* Overlay mobile */}
      {mobileOpen && (
        <button
          type="button"
          aria-label="Fermer le menu"
          className="fixed inset-0 z-40 bg-slate-950/55 backdrop-blur-[2px] lg:hidden animate-fade-in"
          onClick={onMobileClose}
        />
      )}

      <aside
        className={cn(
          // Base : fixed sur mobile (drawer), relative sur desktop
          "fixed inset-y-0 left-0 z-50 flex flex-col bg-surface border-r border-default",
          "transition-[transform,width] duration-200 ease-out",
          // Mobile drawer
          mobileOpen ? "translate-x-0" : "-translate-x-full",
          // Desktop : toujours visible, largeur selon collapsed
          "lg:relative lg:translate-x-0 lg:z-auto",
          // Largeur : mobile fixe à 64, desktop variable
          "w-64",
          collapsed ? "lg:w-14" : "lg:w-60",
        )}
        aria-label="Navigation principale"
      >
        {/* Logo */}
        <div
          className={cn(
            "flex items-center h-14 border-b border-default shrink-0",
            collapsed ? "lg:px-2 lg:justify-center" : "lg:px-4",
            "px-4",
          )}
        >
          <NavLink to={home} className="flex items-center gap-2.5 min-w-0">
            <Logo size={collapsed ? "sm" : "md"} className="lg:transition-[height,width]" />
            <span
              className={cn(
                "text-sm font-semibold text-primary tracking-tight truncate",
                collapsed && "lg:hidden",
              )}
            >
              StockFlow
            </span>
          </NavLink>
        </div>

        {/* Nav */}
        <nav className="flex-1 overflow-y-auto overflow-x-hidden py-3">
          <ul className="space-y-4">
            {sections.map((section, idx) => (
              <li key={section.label ?? `sec-${idx}`}>
                {section.label && (
                  <p
                    className={cn(
                      "px-3 mb-1 text-[11px] font-medium uppercase tracking-wider text-disabled",
                      collapsed && "lg:sr-only",
                    )}
                  >
                    {section.label}
                  </p>
                )}
                <ul className="space-y-0.5 px-2">
                  {section.items.map((item) => (
                    <SidebarItem
                      key={item.to}
                      item={item}
                      collapsed={collapsed}
                    />
                  ))}
                </ul>
              </li>
            ))}
          </ul>
        </nav>

        {/* Footer / collapse toggle */}
        <div
          className={cn(
            "border-t border-default shrink-0 hidden lg:flex items-center",
            collapsed ? "p-1.5 justify-center" : "p-2 justify-between",
          )}
        >
          <Button
            variant="ghost"
            size="icon-sm"
            onClick={() => onCollapsedChange(!collapsed)}
            aria-label={collapsed ? "Déplier la sidebar" : "Replier la sidebar"}
            className="text-muted hover:text-primary"
          >
            {collapsed ? (
              <PanelLeft className="h-4 w-4" />
            ) : (
              <ChevronsLeft className="h-4 w-4" />
            )}
          </Button>
          {!collapsed && (
            <span className="text-[11px] text-disabled mr-1">v1.0.0</span>
          )}
        </div>
      </aside>
    </>
  );
}

function SidebarItem({
  item,
  collapsed,
}: {
  item: NavItem;
  collapsed: boolean;
}) {
  const link = (
    <NavLink
      to={item.to}
      className={({ isActive }) =>
        cn(
          "group relative flex items-center gap-2.5 rounded-md text-sm font-medium",
          "transition-colors",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-ring focus-visible:ring-offset-1 focus-visible:ring-offset-app",
          collapsed
            ? "lg:justify-center lg:px-0 lg:h-8 lg:w-8 px-2.5 h-8"
            : "px-2.5 h-8",
          isActive
            ? "bg-accent-soft text-accent-soft-fg"
            : "text-secondary hover:bg-surface-muted hover:text-primary",
        )
      }
      end={item.to === "/dashboard"}
    >
      {({ isActive }) => (
        <>
          {isActive && (
            <span
              className="absolute left-0 top-1.5 bottom-1.5 w-0.5 rounded-r bg-accent"
              aria-hidden="true"
            />
          )}
          <item.icon
            className="h-4 w-4 shrink-0"
            strokeWidth={isActive ? 2.25 : 2}
            aria-hidden="true"
          />
          <span className={cn("truncate", collapsed && "lg:hidden")}>
            {item.label}
          </span>
        </>
      )}
    </NavLink>
  );

  // Tooltip uniquement quand replié — le NavLink gère mobile/desktop tout seul
  // via ses variantes lg:* (sur mobile, drawer toujours déplié).
  return (
    <li>
      {collapsed ? (
        <Tooltip content={item.label} side="right">
          {link}
        </Tooltip>
      ) : (
        link
      )}
    </li>
  );
}
