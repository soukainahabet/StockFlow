import {
  ArrowDown,
  ArrowUp,
  ChevronsUpDown,
  Inbox,
  Settings2,
} from "lucide-react";
import { useMemo, useState, type ReactNode } from "react";
import { cn } from "@/lib/cn";
import { Button } from "./Button";
import { Checkbox } from "./Checkbox";
import {
  Dropdown,
  DropdownCheckboxItem,
  DropdownContent,
  DropdownLabel,
  DropdownSeparator,
  DropdownTrigger,
} from "./Dropdown";
import { EmptyState } from "./EmptyState";
import { Skeleton } from "./Skeleton";

export type RowId = string | number;

export interface Column<T> {
  id: string;
  header: ReactNode;
  cell: (row: T) => ReactNode;
  /** Si fourni, la colonne est triable et `sortKey` est passé au callback. */
  sortKey?: string;
  align?: "left" | "right" | "center";
  /** Largeur Tailwind ou CSS — ex : "w-32", "120px". */
  width?: string;
  /** Permet de cacher la colonne via le menu Colonnes. */
  hideable?: boolean;
  /** Cachée par défaut au mount. */
  defaultHidden?: boolean;
  /** Padding cellule plus serré (ex: actions, checkbox). */
  compact?: boolean;
}

export interface SortState {
  key: string;
  direction: "asc" | "desc";
}

export interface DataTableProps<T> {
  columns: Column<T>[];
  data: T[];
  getRowId: (row: T) => RowId;

  loading?: boolean;
  /** Nombre de lignes squelette pendant le chargement. */
  rowCount?: number;
  /** Customisation de l'état vide. */
  emptyTitle?: string;
  emptyDescription?: ReactNode;
  emptyAction?: ReactNode;

  /** Tri serveur. `undefined` = pas de tri actif. */
  sort?: SortState;
  onSortChange?: (sort: SortState | undefined) => void;

  /** Sélection multi. */
  selectable?: boolean;
  selectedIds?: RowId[];
  onSelectionChange?: (ids: RowId[]) => void;

  /** Click ligne entière (hors checkbox + actions). */
  onRowClick?: (row: T) => void;
  rowClassName?: (row: T) => string | undefined;

  className?: string;
  density?: "compact" | "normal";
  /** Affiche le menu pour masquer les colonnes. Défaut: true si au moins une `hideable`. */
  showColumnToggle?: boolean;
  /** Slot à gauche du menu Colonnes (ex : actions sur sélection). */
  toolbarLeft?: ReactNode;
}

export function DataTable<T>({
  columns,
  data,
  getRowId,
  loading,
  rowCount = 6,
  emptyTitle = "Aucun résultat",
  emptyDescription,
  emptyAction,
  sort,
  onSortChange,
  selectable,
  selectedIds = [],
  onSelectionChange,
  onRowClick,
  rowClassName,
  className,
  density = "normal",
  showColumnToggle,
  toolbarLeft,
}: DataTableProps<T>) {
  const [hidden, setHidden] = useState<Record<string, boolean>>(() =>
    Object.fromEntries(
      columns.filter((c) => c.defaultHidden).map((c) => [c.id, true]),
    ),
  );

  const visibleColumns = useMemo(
    () => columns.filter((c) => !hidden[c.id]),
    [columns, hidden],
  );

  const hideableColumns = useMemo(
    () => columns.filter((c) => c.hideable),
    [columns],
  );
  const hasHideable = hideableColumns.length > 0;
  const showToggle = showColumnToggle ?? hasHideable;

  const selectedSet = useMemo(() => new Set(selectedIds), [selectedIds]);
  const rowIds = useMemo(() => data.map(getRowId), [data, getRowId]);
  const pageAllSelected =
    rowIds.length > 0 && rowIds.every((id) => selectedSet.has(id));
  const pageSomeSelected =
    !pageAllSelected && rowIds.some((id) => selectedSet.has(id));

  const toggleAllOnPage = () => {
    if (!onSelectionChange) return;
    if (pageAllSelected) {
      const idsToRemove = new Set(rowIds);
      onSelectionChange(selectedIds.filter((id) => !idsToRemove.has(id)));
    } else {
      const merged = new Set(selectedIds);
      for (const id of rowIds) merged.add(id);
      onSelectionChange(Array.from(merged));
    }
  };

  const toggleRow = (id: RowId) => {
    if (!onSelectionChange) return;
    const next = new Set(selectedIds);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    onSelectionChange(Array.from(next));
  };

  const handleHeaderClick = (col: Column<T>) => {
    if (!col.sortKey || !onSortChange) return;
    const key = col.sortKey;
    if (sort?.key !== key) onSortChange({ key, direction: "asc" });
    else if (sort.direction === "asc")
      onSortChange({ key, direction: "desc" });
    else onSortChange(undefined);
  };

  const rowHeight = density === "compact" ? "h-9" : "h-11";
  const cellPad = density === "compact" ? "px-3" : "px-3.5";

  const showToolbar = showToggle || toolbarLeft;

  return (
    <div
      className={cn(
        "flex flex-col rounded-md border border-default bg-surface overflow-hidden",
        className,
      )}
    >
      {showToolbar && (
        <div className="flex items-center justify-between gap-2 border-b border-default px-3 py-2">
          <div className="min-w-0 flex items-center gap-2">{toolbarLeft}</div>
          {showToggle && (
            <Dropdown>
              <DropdownTrigger asChild>
                <Button variant="ghost" size="sm">
                  <Settings2 className="h-3.5 w-3.5" />
                  <span className="hidden sm:inline">Colonnes</span>
                </Button>
              </DropdownTrigger>
              <DropdownContent align="end" className="w-48">
                <DropdownLabel>Colonnes affichées</DropdownLabel>
                <DropdownSeparator />
                {hideableColumns.map((c) => (
                  <DropdownCheckboxItem
                    key={c.id}
                    checked={!hidden[c.id]}
                    onCheckedChange={(checked) =>
                      setHidden((prev) => ({ ...prev, [c.id]: !checked }))
                    }
                    onSelect={(e) => e.preventDefault()}
                  >
                    {typeof c.header === "string" ? c.header : c.id}
                  </DropdownCheckboxItem>
                ))}
              </DropdownContent>
            </Dropdown>
          )}
        </div>
      )}

      <div className="overflow-x-auto">
        <table className="w-full text-sm border-collapse">
          <thead className="sticky top-0 z-10 bg-surface-muted/60 backdrop-blur">
            <tr className="border-b border-default">
              {selectable && (
                <th className={cn("w-9", cellPad, "py-2")} scope="col">
                  <Checkbox
                    checked={
                      pageSomeSelected ? "indeterminate" : pageAllSelected
                    }
                    onCheckedChange={toggleAllOnPage}
                    aria-label="Tout sélectionner sur cette page"
                    disabled={loading || data.length === 0}
                  />
                </th>
              )}
              {visibleColumns.map((col) => {
                const isSorted = sort?.key === col.sortKey;
                const SortIcon = !col.sortKey
                  ? null
                  : !isSorted
                    ? ChevronsUpDown
                    : sort?.direction === "asc"
                      ? ArrowUp
                      : ArrowDown;
                return (
                  <th
                    key={col.id}
                    scope="col"
                    style={col.width ? { width: col.width } : undefined}
                    className={cn(
                      "py-2 text-xs font-medium text-muted whitespace-nowrap",
                      col.compact ? "px-2" : cellPad,
                      col.align === "right" && "text-right",
                      col.align === "center" && "text-center",
                      col.sortKey &&
                        "cursor-pointer select-none hover:text-primary transition-colors",
                    )}
                    onClick={
                      col.sortKey ? () => handleHeaderClick(col) : undefined
                    }
                    aria-sort={
                      !isSorted
                        ? "none"
                        : sort?.direction === "asc"
                          ? "ascending"
                          : "descending"
                    }
                  >
                    <span
                      className={cn(
                        "inline-flex items-center gap-1",
                        col.align === "right" && "flex-row-reverse",
                      )}
                    >
                      {col.header}
                      {SortIcon && (
                        <SortIcon
                          className={cn(
                            "h-3 w-3 shrink-0",
                            isSorted ? "text-primary" : "text-disabled",
                          )}
                          strokeWidth={2.25}
                          aria-hidden="true"
                        />
                      )}
                    </span>
                  </th>
                );
              })}
            </tr>
          </thead>

          <tbody>
            {loading ? (
              Array.from({ length: rowCount }).map((_, i) => (
                <tr
                  key={`sk-${i}`}
                  className={cn("border-b border-default", rowHeight)}
                >
                  {selectable && (
                    <td className={cn(cellPad, "py-2")}>
                      <Skeleton className="h-4 w-4 rounded-[4px]" />
                    </td>
                  )}
                  {visibleColumns.map((c) => (
                    <td
                      key={c.id}
                      className={cn(
                        "py-2",
                        c.compact ? "px-2" : cellPad,
                        c.align === "right" && "text-right",
                      )}
                    >
                      <Skeleton
                        className={cn(
                          "h-3",
                          c.align === "right" ? "ml-auto w-12" : "w-24",
                        )}
                      />
                    </td>
                  ))}
                </tr>
              ))
            ) : data.length === 0 ? (
              <tr>
                <td
                  colSpan={visibleColumns.length + (selectable ? 1 : 0)}
                  className="py-0"
                >
                  <EmptyState
                    size="sm"
                    icon={Inbox}
                    title={emptyTitle}
                    description={emptyDescription}
                    action={emptyAction}
                  />
                </td>
              </tr>
            ) : (
              data.map((row) => {
                const id = getRowId(row);
                const isSelected = selectedSet.has(id);
                return (
                  <tr
                    key={id}
                    className={cn(
                      "border-b border-default transition-colors last:border-b-0",
                      rowHeight,
                      onRowClick && "cursor-pointer hover:bg-surface-muted/40",
                      isSelected && "bg-accent-soft/40",
                      rowClassName?.(row),
                    )}
                    onClick={
                      onRowClick
                        ? (e) => {
                            // Ignorer clicks sur checkbox/boutons internes
                            const t = e.target as HTMLElement;
                            if (t.closest("[data-row-stop]")) return;
                            onRowClick(row);
                          }
                        : undefined
                    }
                  >
                    {selectable && (
                      <td
                        className={cn(cellPad, "py-2")}
                        data-row-stop
                        onClick={(e) => e.stopPropagation()}
                      >
                        <Checkbox
                          checked={isSelected}
                          onCheckedChange={() => toggleRow(id)}
                          aria-label="Sélectionner la ligne"
                        />
                      </td>
                    )}
                    {visibleColumns.map((c) => (
                      <td
                        key={c.id}
                        className={cn(
                          "text-secondary py-2",
                          c.compact ? "px-2" : cellPad,
                          c.align === "right" &&
                            "text-right tabular-nums text-primary",
                          c.align === "center" && "text-center",
                        )}
                      >
                        {c.cell(row)}
                      </td>
                    ))}
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
