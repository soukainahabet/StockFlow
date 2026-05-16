import { ChevronDown, LogOut, UserCircle } from "lucide-react";
import { Badge, type BadgeProps } from "@/components/ui/Badge";
import {
  Dropdown,
  DropdownContent,
  DropdownItem,
  DropdownLabel,
  DropdownSeparator,
  DropdownTrigger,
} from "@/components/ui/Dropdown";
import { useAuth } from "@/features/auth/AuthContext";
import { cn } from "@/lib/cn";
import type { Role } from "@/types";

const ROLE_LABEL: Record<string, string> = {
  ADMIN: "Administrateur",
  STOCK_MANAGER: "Gestionnaire stock",
  SELLER: "Vendeur",
  MANAGER: "Manager",
  USER: "Utilisateur",
};

const ROLE_VARIANT: Record<string, BadgeProps["variant"]> = {
  ADMIN: "accent",
  STOCK_MANAGER: "info",
  SELLER: "success",
  MANAGER: "neutral",
  USER: "neutral",
};

function initialsOf(name: string | undefined): string {
  if (!name) return "?";
  return (
    name
      .split(" ")
      .filter(Boolean)
      .slice(0, 2)
      .map((s) => s[0]?.toUpperCase())
      .join("") || "?"
  );
}

export function UserMenu() {
  const { user, logout } = useAuth();
  const role: Role | undefined = user?.role;
  const initials = initialsOf(user?.name);

  return (
    <Dropdown>
      <DropdownTrigger asChild>
        <button
          type="button"
          className={cn(
            "flex items-center gap-2 rounded-md px-1.5 py-1 -my-1",
            "hover:bg-surface-muted transition-colors",
            "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-ring focus-visible:ring-offset-1 focus-visible:ring-offset-app",
          )}
          aria-label="Menu utilisateur"
        >
          <span
            className="flex h-7 w-7 items-center justify-center rounded-full bg-accent-soft text-accent-soft-fg text-xs font-semibold"
            aria-hidden="true"
          >
            {initials}
          </span>
          <span className="hidden text-left sm:block leading-tight">
            <span className="block text-xs font-medium text-primary truncate max-w-[120px]">
              {user?.name}
            </span>
            <span className="block text-[11px] text-muted">
              {role ? (ROLE_LABEL[role] ?? role) : ""}
            </span>
          </span>
          <ChevronDown
            className="h-3.5 w-3.5 text-muted hidden sm:block"
            aria-hidden="true"
          />
        </button>
      </DropdownTrigger>
      <DropdownContent className="w-56">
        <DropdownLabel>
          <div className="space-y-0.5">
            <p className="text-sm font-medium text-primary truncate">
              {user?.name}
            </p>
            <p className="text-xs text-muted truncate">{user?.email}</p>
          </div>
        </DropdownLabel>
        <DropdownSeparator />
        <div className="px-2 py-1.5 flex items-center gap-2 text-xs text-muted">
          <UserCircle className="h-3.5 w-3.5" aria-hidden="true" />
          <span>Rôle</span>
          {role && (
            <Badge variant={ROLE_VARIANT[role] ?? "neutral"} className="ml-auto">
              {ROLE_LABEL[role] ?? role}
            </Badge>
          )}
        </div>
        <DropdownSeparator />
        <DropdownItem destructive onSelect={() => logout()}>
          <LogOut className="h-3.5 w-3.5" aria-hidden="true" />
          <span>Se déconnecter</span>
        </DropdownItem>
      </DropdownContent>
    </Dropdown>
  );
}
