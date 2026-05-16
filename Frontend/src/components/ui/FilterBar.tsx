import { X } from "lucide-react";
import type { ReactNode } from "react";
import { cn } from "@/lib/cn";
import { Button } from "./Button";

interface FilterBarProps {
  children: ReactNode;
  /** Si fourni, affiche un bouton "Réinitialiser" à droite. */
  onReset?: () => void;
  hasActiveFilters?: boolean;
  className?: string;
}

export function FilterBar({
  children,
  onReset,
  hasActiveFilters,
  className,
}: FilterBarProps) {
  return (
    <div
      className={cn(
        "flex flex-wrap items-center gap-2",
        className,
      )}
    >
      {children}
      {onReset && hasActiveFilters && (
        <Button
          variant="ghost"
          size="sm"
          onClick={onReset}
          className="ml-auto text-muted"
        >
          <X className="h-3.5 w-3.5" />
          Réinitialiser
        </Button>
      )}
    </div>
  );
}
