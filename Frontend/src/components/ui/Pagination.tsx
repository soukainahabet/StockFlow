import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from "lucide-react";
import { cn } from "@/lib/cn";
import { Button } from "./Button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "./Select";

interface PaginationProps {
  /** Index 0-based (compatible avec Spring Data `Page.number`). */
  page: number;
  totalPages: number;
  totalElements: number;
  /** Taille de page courante. Accepte `size` (legacy) ou `pageSize`. */
  size?: number;
  pageSize?: number;
  onPageChange: (page: number) => void;
  /** Si fourni, expose un sélecteur de taille de page. */
  onPageSizeChange?: (size: number) => void;
  pageSizeOptions?: number[];
  className?: string;
}

export function Pagination({
  page,
  totalPages,
  totalElements,
  size,
  pageSize,
  onPageChange,
  onPageSizeChange,
  pageSizeOptions = [10, 20, 50, 100],
  className,
}: PaginationProps) {
  const ps = pageSize ?? size ?? 20;
  if (totalPages <= 0 || totalElements === 0) {
    return (
      <div
        className={cn(
          "flex items-center justify-between px-3 py-2 text-xs text-muted",
          className,
        )}
      >
        <span>Aucun résultat</span>
      </div>
    );
  }

  const start = page * ps + 1;
  const end = Math.min((page + 1) * ps, totalElements);
  const isFirst = page <= 0;
  const isLast = page >= totalPages - 1;

  return (
    <div
      className={cn(
        "flex flex-col gap-3 px-3 py-2 sm:flex-row sm:items-center sm:justify-between",
        "text-xs text-muted tabular-nums",
        className,
      )}
    >
      <p>
        <span className="text-secondary font-medium">{start}</span>
        <span className="mx-1">–</span>
        <span className="text-secondary font-medium">{end}</span>
        <span className="mx-1.5">sur</span>
        <span className="text-secondary font-medium">{totalElements}</span>
      </p>

      <div className="flex items-center gap-2">
        {onPageSizeChange && (
          <label className="flex items-center gap-2 mr-2">
            <span className="hidden sm:inline">Par page</span>
            <Select
              value={String(ps)}
              onValueChange={(v) => onPageSizeChange(Number(v))}
            >
              <SelectTrigger className="h-7 w-auto text-xs px-2 py-0">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {pageSizeOptions.map((opt) => (
                  <SelectItem key={opt} value={String(opt)}>
                    {opt}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </label>
        )}

        <div className="flex items-center gap-0.5">
          <Button
            variant="ghost"
            size="icon-sm"
            disabled={isFirst}
            onClick={() => onPageChange(0)}
            aria-label="Première page"
          >
            <ChevronsLeft className="h-3.5 w-3.5" />
          </Button>
          <Button
            variant="ghost"
            size="icon-sm"
            disabled={isFirst}
            onClick={() => onPageChange(page - 1)}
            aria-label="Page précédente"
          >
            <ChevronLeft className="h-3.5 w-3.5" />
          </Button>
          <span className="px-2 text-secondary">
            <span className="font-medium">{page + 1}</span>
            <span className="mx-1 text-disabled">/</span>
            <span>{totalPages}</span>
          </span>
          <Button
            variant="ghost"
            size="icon-sm"
            disabled={isLast}
            onClick={() => onPageChange(page + 1)}
            aria-label="Page suivante"
          >
            <ChevronRight className="h-3.5 w-3.5" />
          </Button>
          <Button
            variant="ghost"
            size="icon-sm"
            disabled={isLast}
            onClick={() => onPageChange(totalPages - 1)}
            aria-label="Dernière page"
          >
            <ChevronsRight className="h-3.5 w-3.5" />
          </Button>
        </div>
      </div>
    </div>
  );
}
