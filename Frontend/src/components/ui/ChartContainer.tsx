import type { CSSProperties, ReactElement, ReactNode } from "react";
import { ResponsiveContainer } from "recharts";
import { cn } from "@/lib/cn";
import { Skeleton } from "./Skeleton";

type Height = number | `${number}px` | `${number}rem` | `${number}vh`;

interface ChartContainerProps {
  /** Un et un seul élément Recharts (LineChart, BarChart, AreaChart, ...). */
  children: ReactElement;
  /** Hauteur du wrapper. Défaut 288 px (= Tailwind h-72). Ignoré si `aspect` est fourni. */
  height?: Height;
  /** Ratio largeur/hauteur — la hauteur suit la largeur (utile pour sparklines). */
  aspect?: number;
  loading?: boolean;
  empty?: boolean;
  emptyState?: ReactNode;
  className?: string;
}

export function ChartContainer({
  children,
  height = 288,
  aspect,
  loading,
  empty,
  emptyState,
  className,
}: ChartContainerProps) {
  const style: CSSProperties = aspect
    ? { aspectRatio: aspect }
    : { height: typeof height === "number" ? `${height}px` : height };

  return (
    <div className={cn("relative w-full min-h-0", className)} style={style}>
      {loading ? (
        <Skeleton className="h-full w-full" />
      ) : empty ? (
        <div className="flex h-full w-full items-center justify-center text-sm text-muted">
          {emptyState ?? "Aucune donnée sur la période."}
        </div>
      ) : (
        <ResponsiveContainer width="100%" height="100%">
          {children}
        </ResponsiveContainer>
      )}
    </div>
  );
}
