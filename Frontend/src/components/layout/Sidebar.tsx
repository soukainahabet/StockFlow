import { NavLink } from "react-router-dom";
import {
  LayoutDashboard,
  Package,
  Tags,
  ShoppingCart,
  ArrowLeftRight,
  Users,
  ShieldCheck,
  Boxes,
} from "lucide-react";
import clsx from "clsx";
import { useAuth } from "@/features/auth/AuthContext";
import type { Role } from "@/types";

interface NavItem {
  to: string;
  label: string;
  icon: typeof LayoutDashboard;
  roles?: Role[];
}

const NAV: NavItem[] = [
  { to: "/dashboard", label: "Tableau de bord", icon: LayoutDashboard },
  { to: "/products", label: "Produits", icon: Package },
  { to: "/categories", label: "Catégories", icon: Tags },
  { to: "/ventes", label: "Ventes", icon: ShoppingCart },
  { to: "/stock-movements", label: "Mouvements de stock", icon: ArrowLeftRight },
  { to: "/users", label: "Utilisateurs", icon: Users, roles: ["ADMIN"] },
  { to: "/roles", label: "Rôles", icon: ShieldCheck, roles: ["ADMIN"] },
];

interface Props {
  open: boolean;
  onClose: () => void;
}

export function Sidebar({ open, onClose }: Props) {
  const { hasRole } = useAuth();

  const items = NAV.filter((item) => !item.roles || hasRole(...item.roles));

  return (
    <>
      {open && (
        <div
          className="fixed inset-0 z-30 bg-secondary-900/50 lg:hidden"
          onClick={onClose}
          aria-hidden
        />
      )}
      <aside
        className={clsx(
          "fixed inset-y-0 left-0 z-40 flex w-64 flex-col bg-secondary-800 text-secondary-100 transition-transform lg:translate-x-0 lg:static lg:z-auto",
          open ? "translate-x-0" : "-translate-x-full lg:translate-x-0",
        )}
      >
        <div className="flex items-center gap-2.5 px-6 py-5 border-b border-secondary-700/60">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary text-white">
            <Boxes size={20} />
          </div>
          <div>
            <p className="text-base font-bold text-white tracking-tight leading-tight">StockFlow</p>
            <p className="text-[11px] text-secondary-400">SaaS Stock Management</p>
          </div>
        </div>

        <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-1">
          {items.map(({ to, label, icon: Icon }) => (
            <NavLink
              key={to}
              to={to}
              onClick={onClose}
              className={({ isActive }) =>
                clsx(
                  "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
                  isActive
                    ? "bg-primary text-white shadow-sm"
                    : "text-secondary-300 hover:bg-secondary-700/60 hover:text-white",
                )
              }
            >
              <Icon size={18} />
              <span>{label}</span>
            </NavLink>
          ))}
        </nav>

        <div className="border-t border-secondary-700/60 px-6 py-4 text-[11px] text-secondary-400">
          v1.0.0 · &copy; {new Date().getFullYear()}
        </div>
      </aside>
    </>
  );
}
