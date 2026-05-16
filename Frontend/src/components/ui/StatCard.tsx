import { ArrowDownRight, ArrowUpRight, Minus, type LucideIcon } from "lucide-react";
import type { ReactNode } from "react";
import { cn } from "@/lib/cn";
import { Skeleton } from "./Skeleton";

type Direction = "up" | "down" | "flat";

interface Delta {
  value: number; // pourcentage ou valeur absolue
  direction?: Direction;
  /** Si non fourni, la couleur suit `direction`. */
  tone?: "success" | "danger" | "warning" | "muted";
  /** Libellé de comparaison ("vs hier", "30j", ...) */
  label?: string;
  /** Si false, on affiche la valeur brute (pas de `%`). */
  isPercent?: boolean;
}

interface StatCardProps {
  label: string;
  value: ReactNode;
  delta?: Delta;
  icon?: LucideIcon;
  loading?: boolean;
  className?: string;
  /** Sparkline (Recharts) ou autre visuel sous le bloc principal. */
  children?: ReactNode;
}

function deriveDirection(value: number): Direction {
  if (value > 0) return "up";
  if (value < 0) return "down";
  return "flat";
}

const TONE_BY_DIRECTION: Record<Direction, "success" | "danger" | "muted"> = {
  up: "success",
  down: "danger",
  flat: "muted",
};

const TONE_CLASS = {
  success: "text-success-soft-fg",
  danger: "text-danger-soft-fg",
  warning: "text-warning-soft-fg",
  muted: "text-muted",
} as const;

const ICON_BY_DIRECTION = {
  up: ArrowUpRight,
  down: ArrowDownRight,
  flat: Minus,
} as const;

export function StatCard({
  label,
  value,
  delta,
  icon: Icon,
  loading,
  className,
  children,
}: StatCardProps) {
  const dir = delta?.direction ?? (delta ? deriveDirection(delta.value) : "flat");
  const tone = delta?.tone ?? TONE_BY_DIRECTION[dir];
  const DeltaIcon = ICON_BY_DIRECTION[dir];
  const isPercent = delta?.isPercent ?? true;

  return (
    <div
      className={cn(
        "relative flex flex-col gap-2 rounded-md border border-default bg-surface p-4 shadow-subtle",
        className,
      )}
    >
      <div className="flex items-center justify-between gap-2">
        <p className="text-xs font-medium uppercase tracking-wider text-muted">
          {label}
        </p>
        {Icon && (
          <Icon
            className="h-3.5 w-3.5 text-muted shrink-0"
            strokeWidth={2}
            aria-hidden="true"
          />
        )}
      </div>

      {loading ? (
        <Skeleton className="h-7 w-24" />
      ) : (
        <p className="text-2xl font-semibold text-primary tabular-nums leading-none">
          {value}
        </p>
      )}

      {delta && !loading && (
        <div className="flex items-center gap-1.5 text-xs">
          <span
            className={cn(
              "inline-flex items-center gap-0.5 font-medium tabular-nums",
              TONE_CLASS[tone],
            )}
          >
            <DeltaIcon className="h-3 w-3" strokeWidth={2.5} aria-hidden="true" />
            {Math.abs(delta.value).toFixed(isPercent ? 1 : 0)}
            {isPercent && "%"}
          </span>
          {delta.label && <span className="text-muted">{delta.label}</span>}
        </div>
      )}

      {children}
    </div>
  );
}
