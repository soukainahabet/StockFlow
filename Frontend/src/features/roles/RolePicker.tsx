import { Lock, UserCircle } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectSeparator,
  SelectTrigger,
  SelectValue,
} from "@/components/ui";
import type { Role, RoleResponse } from "@/types";

const ROLE_LABEL: Record<string, string> = {
  ADMIN: "Administrateur",
  STOCK_MANAGER: "Gestionnaire stock",
  SELLER: "Vendeur",
  MANAGER: "Manager",
  USER: "Utilisateur",
};

interface RolePickerProps {
  value: Role | "";
  onChange: (value: Role) => void;
  roles: RoleResponse[];
  disabled?: boolean;
  placeholder?: string;
  id?: string;
  /** Si vrai, masque les rôles système (utile pour /register en self-service). */
  excludeSystem?: boolean;
  /** Si vrai, masque le rôle USER (souvent réservé en interne). */
  excludeUser?: boolean;
}

export function RolePicker({
  value,
  onChange,
  roles,
  disabled,
  placeholder = "Sélectionner…",
  id,
  excludeSystem,
  excludeUser,
}: RolePickerProps) {
  const systemRoles = roles
    .filter((r) => r.type === "SYSTEM")
    .filter((r) => (excludeUser ? r.name !== "USER" : true))
    .filter(() => !excludeSystem);

  const customRoles = roles.filter(
    (r) => r.type === "CUSTOM" && r.active,
  );

  return (
    <Select value={value} onValueChange={(v) => onChange(v as Role)} disabled={disabled}>
      <SelectTrigger id={id}>
        <SelectValue placeholder={placeholder} />
      </SelectTrigger>
      <SelectContent>
        {systemRoles.length > 0 && (
          <SelectGroup>
            <SelectLabel className="flex items-center gap-1.5 text-[11px] uppercase tracking-wider">
              <Lock className="h-3 w-3" aria-hidden="true" />
              Rôles système
            </SelectLabel>
            {systemRoles.map((r) => (
              <SelectItem key={r.id} value={r.name}>
                <span className="flex items-center gap-2">
                  <UserCircle className="h-3.5 w-3.5 text-muted" />
                  {ROLE_LABEL[r.name] ?? r.name}
                </span>
              </SelectItem>
            ))}
          </SelectGroup>
        )}
        {systemRoles.length > 0 && customRoles.length > 0 && <SelectSeparator />}
        {customRoles.length > 0 && (
          <SelectGroup>
            <SelectLabel className="text-[11px] uppercase tracking-wider">
              Rôles personnalisés
            </SelectLabel>
            {customRoles.map((r) => (
              <SelectItem key={r.id} value={r.name}>
                <span className="flex items-center gap-2">
                  <UserCircle className="h-3.5 w-3.5 text-muted" />
                  <span className="font-mono">{r.name}</span>
                </span>
              </SelectItem>
            ))}
          </SelectGroup>
        )}
      </SelectContent>
    </Select>
  );
}
