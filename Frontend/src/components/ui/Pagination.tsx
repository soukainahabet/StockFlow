import { ChevronLeft, ChevronRight } from "lucide-react";
import clsx from "clsx";

interface Props {
  page: number;
  totalPages: number;
  totalElements: number;
  size: number;
  onPageChange: (page: number) => void;
}

export function Pagination({ page, totalPages, totalElements, size, onPageChange }: Props) {
  if (totalPages <= 0) return null;

  const start = totalElements === 0 ? 0 : page * size + 1;
  const end = Math.min((page + 1) * size, totalElements);

  const pages: number[] = [];
  const window = 2;
  for (let i = Math.max(0, page - window); i <= Math.min(totalPages - 1, page + window); i++) {
    pages.push(i);
  }

  return (
    <div className="flex items-center justify-between gap-4 px-4 py-3 border-t border-secondary-100 bg-white rounded-b-xl text-sm">
      <p className="text-secondary-600">
        {totalElements > 0
          ? <>Affichage <b>{start}</b>–<b>{end}</b> sur <b>{totalElements}</b></>
          : "Aucun résultat"}
      </p>
      <div className="flex items-center gap-1">
        <button
          type="button"
          className="btn-ghost p-2"
          onClick={() => onPageChange(page - 1)}
          disabled={page <= 0}
          aria-label="Page précédente"
        >
          <ChevronLeft size={16} />
        </button>
        {pages[0]! > 0 && (
          <>
            <button className="btn-ghost px-3 py-1.5" onClick={() => onPageChange(0)}>1</button>
            {pages[0]! > 1 && <span className="px-1 text-secondary-400">…</span>}
          </>
        )}
        {pages.map((p) => (
          <button
            key={p}
            type="button"
            onClick={() => onPageChange(p)}
            className={clsx(
              "px-3 py-1.5 rounded-lg text-sm font-medium",
              p === page ? "bg-primary text-white" : "text-secondary-700 hover:bg-secondary-100",
            )}
          >
            {p + 1}
          </button>
        ))}
        {pages[pages.length - 1]! < totalPages - 1 && (
          <>
            {pages[pages.length - 1]! < totalPages - 2 && (
              <span className="px-1 text-secondary-400">…</span>
            )}
            <button className="btn-ghost px-3 py-1.5" onClick={() => onPageChange(totalPages - 1)}>
              {totalPages}
            </button>
          </>
        )}
        <button
          type="button"
          className="btn-ghost p-2"
          onClick={() => onPageChange(page + 1)}
          disabled={page >= totalPages - 1}
          aria-label="Page suivante"
        >
          <ChevronRight size={16} />
        </button>
      </div>
    </div>
  );
}
