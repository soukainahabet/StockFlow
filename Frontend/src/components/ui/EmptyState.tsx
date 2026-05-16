import type { LucideIcon } from "lucide-react";
import type { ReactNode } from "react";
import { cn } from "@/lib/cn";

interface EmptyStateProps {
  icon?: LucideIcon;
  title: string;
  description?: ReactNode;
  action?: ReactNode;
  className?: string;
  size?: "sm" | "md";
}

export function EmptyState({
  icon: Icon,
  title,
  description,
  action,
  className,
  size = "md",
}: EmptyStateProps) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center text-center",
        size === "md" ? "px-6 py-16" : "px-4 py-10",
        className,
      )}
    >
      {Icon && (
        <div
          className={cn(
            "flex items-center justify-center rounded-full bg-surface-muted border border-default mb-4",
            size === "md" ? "h-12 w-12" : "h-10 w-10",
          )}
        >
          <Icon
            className={cn("text-muted", size === "md" ? "h-5 w-5" : "h-4 w-4")}
            strokeWidth={1.5}
            aria-hidden="true"
          />
        </div>
      )}
      <h3 className="text-sm font-semibold text-primary">{title}</h3>
      {description && (
        <p className="mt-1 text-sm text-muted max-w-sm">{description}</p>
      )}
      {action && <div className="mt-5">{action}</div>}
    </div>
  );
}
