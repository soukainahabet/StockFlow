import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Eye, Plus, Trash2 } from "lucide-react";
import { useMemo, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import {
  Badge,
  Button,
  ConfirmDialog,
  DataTable,
  FilterBar,
  Input,
  Label,
  PageHeader,
  Pagination,
  toastUI,
  Tooltip,
  type Column,
} from "@/components/ui";
import { useAuth } from "@/features/auth/AuthContext";
import type { VenteResponse } from "@/types";
import { formatCurrency, formatDateTime } from "@/utils/format";
import { VenteDetailModal } from "./VenteDetailModal";
import { ventesService, type VenteSearchParams } from "./ventesService";

export function VentesPage() {
  const { hasRole } = useAuth();
  const canCreate = hasRole("ADMIN", "SELLER");
  const canDelete = hasRole("ADMIN");
  const qc = useQueryClient();

  const [searchParams, setSearchParams] = useSearchParams();
  const page = Math.max(0, Number(searchParams.get("page") ?? 0));
  const startDate = searchParams.get("startDate") ?? "";
  const endDate = searchParams.get("endDate") ?? "";
  const minTotal = searchParams.get("minTotal") ?? "";
  const maxTotal = searchParams.get("maxTotal") ?? "";

  const update = (patch: Record<string, string | number | undefined>) =>
    setSearchParams(
      (prev) => {
        const next = new URLSearchParams(prev);
        for (const [k, v] of Object.entries(patch)) {
          if (v === undefined || v === "" || v === 0) next.delete(k);
          else next.set(k, String(v));
        }
        return next;
      },
      { replace: true },
    );

  const params: VenteSearchParams = useMemo(
    () => ({
      page,
      size: 15,
      startDate: startDate ? `${startDate}T00:00:00` : undefined,
      endDate: endDate ? `${endDate}T23:59:59` : undefined,
      minTotal: minTotal ? Number(minTotal) : undefined,
      maxTotal: maxTotal ? Number(maxTotal) : undefined,
    }),
    [page, startDate, endDate, minTotal, maxTotal],
  );

  const ventesQuery = useQuery({
    queryKey: ["ventes", params],
    queryFn: () => ventesService.list(params),
  });

  const [detailId, setDetailId] = useState<number | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<VenteResponse | null>(
    null,
  );

  const deleteMut = useMutation({
    mutationFn: (id: number) => ventesService.remove(id),
    onSuccess: () => {
      toastUI.success("Vente supprimée");
      setConfirmDelete(null);
      void qc.invalidateQueries({ queryKey: ["ventes"] });
    },
    onError: () => toastUI.error("Suppression impossible"),
  });

  const data = ventesQuery.data;
  const total = data?.totalElements ?? 0;
  const hasActiveFilters =
    Boolean(startDate || endDate || minTotal || maxTotal);

  const columns: Column<VenteResponse>[] = [
    {
      id: "id",
      header: "N°",
      cell: (v) => (
        <span className="font-mono text-xs text-muted">#{v.id}</span>
      ),
      width: "72px",
      sortKey: "id",
    },
    {
      id: "date",
      header: "Date",
      cell: (v) => (
        <span className="text-secondary">{formatDateTime(v.date)}</span>
      ),
      sortKey: "date",
      width: "180px",
    },
    {
      id: "seller",
      header: "Vendeur",
      cell: (v) => v.userName,
    },
    {
      id: "lines",
      header: "Lignes",
      cell: (v) => (
        <span className="text-muted">{v.lignes?.length ?? 0}</span>
      ),
      align: "right",
      width: "80px",
      hideable: true,
    },
    {
      id: "total",
      header: "Total",
      cell: (v) => (
        <span className="font-medium text-primary">
          {formatCurrency(v.total)}
        </span>
      ),
      align: "right",
      sortKey: "total",
      width: "120px",
    },
    {
      id: "actions",
      header: "",
      cell: (v) => (
        <div className="inline-flex items-center gap-0.5 justify-end" data-row-stop>
          <Tooltip content="Voir le détail">
            <Button
              variant="ghost"
              size="icon-sm"
              onClick={() => setDetailId(v.id)}
            >
              <Eye className="h-3.5 w-3.5" />
            </Button>
          </Tooltip>
          {canDelete && (
            <Tooltip content="Supprimer">
              <Button
                variant="ghost"
                size="icon-sm"
                onClick={() => setConfirmDelete(v)}
                className="text-muted hover:text-danger"
              >
                <Trash2 className="h-3.5 w-3.5" />
              </Button>
            </Tooltip>
          )}
        </div>
      ),
      align: "right",
      compact: true,
      width: "96px",
    },
  ];

  return (
    <div className="max-w-[1400px] mx-auto space-y-4">
      <PageHeader
        title="Ventes"
        description="Historique de toutes les transactions enregistrées."
        meta={total > 0 && <Badge variant="neutral">{total}</Badge>}
        actions={
          canCreate && (
            <Button asChild>
              <Link to="/ventes/new">
                <Plus className="h-3.5 w-3.5" />
                Nouvelle vente
              </Link>
            </Button>
          )
        }
      />

      <FilterBar
        onReset={() => setSearchParams({}, { replace: true })}
        hasActiveFilters={hasActiveFilters}
      >
        <div className="flex items-center gap-2">
          <Label htmlFor="from" className="text-muted whitespace-nowrap">
            Du
          </Label>
          <Input
            id="from"
            type="date"
            className="w-40"
            value={startDate}
            onChange={(e) => update({ startDate: e.target.value, page: 0 })}
          />
          <Label htmlFor="to" className="text-muted whitespace-nowrap">
            au
          </Label>
          <Input
            id="to"
            type="date"
            className="w-40"
            value={endDate}
            onChange={(e) => update({ endDate: e.target.value, page: 0 })}
          />
        </div>
        <div className="flex items-center gap-2">
          <Label htmlFor="min" className="text-muted whitespace-nowrap">
            €
          </Label>
          <Input
            id="min"
            type="number"
            min="0"
            step="0.01"
            placeholder="min"
            className="w-24"
            value={minTotal}
            onChange={(e) => update({ minTotal: e.target.value, page: 0 })}
          />
          <span className="text-muted">–</span>
          <Input
            type="number"
            min="0"
            step="0.01"
            placeholder="max"
            className="w-24"
            value={maxTotal}
            onChange={(e) => update({ maxTotal: e.target.value, page: 0 })}
          />
        </div>
      </FilterBar>

      <DataTable<VenteResponse>
        columns={columns}
        data={data?.content ?? []}
        getRowId={(v) => v.id}
        loading={ventesQuery.isPending}
        rowCount={10}
        onRowClick={(v) => setDetailId(v.id)}
        emptyTitle="Aucune vente"
        emptyDescription={
          hasActiveFilters
            ? "Ajustez vos filtres."
            : "Aucune transaction enregistrée."
        }
        emptyAction={
          !hasActiveFilters && canCreate ? (
            <Button asChild>
              <Link to="/ventes/new">
                <Plus className="h-3.5 w-3.5" />
                Nouvelle vente
              </Link>
            </Button>
          ) : undefined
        }
      />

      {data && data.totalPages > 1 && (
        <Pagination
          page={data.page}
          totalPages={data.totalPages}
          totalElements={data.totalElements}
          pageSize={data.size}
          onPageChange={(p) => update({ page: p })}
        />
      )}

      <VenteDetailModal id={detailId} onClose={() => setDetailId(null)} />

      <ConfirmDialog
        open={Boolean(confirmDelete)}
        title="Supprimer la vente ?"
        message={`La vente #${confirmDelete?.id} sera supprimée. Cette action ne réintègre pas le stock.`}
        confirmLabel="Supprimer"
        loading={deleteMut.isPending}
        onClose={() => setConfirmDelete(null)}
        onConfirm={() => {
          if (confirmDelete) deleteMut.mutate(confirmDelete.id);
        }}
      />
    </div>
  );
}
