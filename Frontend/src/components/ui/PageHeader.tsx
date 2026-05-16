import type { ReactNode } from "react";
import { cn } from "@/lib/cn";

interface PageHeaderProps {
  title: string;
  /** Alias accepté pour rétrocompat : `subtitle` (legacy) = `description`. */
  description?: ReactNode;
  subtitle?: ReactNode;
  /** Méta-info à droite du titre (ex : compteur "234 produits"). */
  meta?: ReactNode;
  /** Actions à droite (boutons CTA, dropdown, etc.). */
  actions?: ReactNode;
  className?: string;
}

export function PageHeader({
  title,
  description,
  subtitle,
  meta,
  actions,
  className,
}: PageHeaderProps) {
  const desc = description ?? subtitle;
  return (
    <header
      className={cn(
        "flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between mb-5",
        className,
      )}
    >
      <div className="min-w-0">
        <div className="flex items-center gap-2 min-w-0">
          <h1 className="text-xl font-semibold text-primary tracking-tight truncate">
            {title}
          </h1>
          {meta}
        </div>
        {desc && <p className="mt-1 text-sm text-muted">{desc}</p>}
      </div>
      {actions && (
        <div className="flex items-center gap-2 shrink-0">{actions}</div>
      )}
    </header>
  );
}
