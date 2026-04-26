import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Plus, Trash2, Eye, ShoppingCart } from "lucide-react";
import { Link } from "react-router-dom";
import toast from "react-hot-toast";
import { PageHeader } from "@/components/ui/PageHeader";
import { Spinner } from "@/components/ui/Spinner";
import { Pagination } from "@/components/ui/Pagination";
import { EmptyState } from "@/components/ui/EmptyState";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { ventesService, type VenteSearchParams } from "./ventesService";
import { useAuth } from "@/features/auth/AuthContext";
import { formatCurrency, formatDateTime } from "@/utils/format";
import { VenteDetailModal } from "./VenteDetailModal";
import type { VenteResponse } from "@/types";

export function VentesPage() {
  const { hasRole } = useAuth();
  const canCreate = hasRole("ADMIN", "SELLER", "MANAGER");
  const canDelete = hasRole("ADMIN");
  const qc = useQueryClient();

  const [page, setPage] = useState(0);
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [minTotal, setMinTotal] = useState<string>("");
  const [maxTotal, setMaxTotal] = useState<string>("");

  const params: VenteSearchParams = useMemo(
    () => ({
      page,
      size: 10,
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
  const [confirmDelete, setConfirmDelete] = useState<VenteResponse | null>(null);

  const deleteMut = useMutation({
    mutationFn: (id: number) => ventesService.remove(id),
    onSuccess: () => {
      toast.success("Vente supprimée");
      setConfirmDelete(null);
      void qc.invalidateQueries({ queryKey: ["ventes"] });
    },
  });

  const data = ventesQuery.data;

  return (
    <>
      <PageHeader
        title="Ventes"
        subtitle="Historique de toutes les transactions."
        actions={
          canCreate && (
            <Link to="/ventes/new" className="btn-primary">
              <Plus size={16} />
              Nouvelle vente
            </Link>
          )
        }
      />

      <div className="card p-4 mb-4">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          <div>
            <label className="label">Date de début</label>
            <input
              type="date"
              className="input"
              value={startDate}
              onChange={(e) => {
                setStartDate(e.target.value);
                setPage(0);
              }}
            />
          </div>
          <div>
            <label className="label">Date de fin</label>
            <input
              type="date"
              className="input"
              value={endDate}
              onChange={(e) => {
                setEndDate(e.target.value);
                setPage(0);
              }}
            />
          </div>
          <div>
            <label className="label">Total min</label>
            <input
              type="number"
              min="0"
              step="0.01"
              className="input"
              value={minTotal}
              onChange={(e) => {
                setMinTotal(e.target.value);
                setPage(0);
              }}
            />
          </div>
          <div>
            <label className="label">Total max</label>
            <input
              type="number"
              min="0"
              step="0.01"
              className="input"
              value={maxTotal}
              onChange={(e) => {
                setMaxTotal(e.target.value);
                setPage(0);
              }}
            />
          </div>
        </div>
      </div>

      <div className="card overflow-hidden">
        {ventesQuery.isPending ? (
          <div className="flex justify-center py-16"><Spinner size="lg" /></div>
        ) : !data || data.empty ? (
          <EmptyState icon={ShoppingCart} title="Aucune vente" description="Ajustez vos filtres ou enregistrez une nouvelle vente." />
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr>
                    <th className="table-th">#</th>
                    <th className="table-th">Date</th>
                    <th className="table-th">Vendeur</th>
                    <th className="table-th text-right">Lignes</th>
                    <th className="table-th text-right">Total</th>
                    <th className="table-th text-right">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {data.content.map((v) => (
                    <tr key={v.id} className="hover:bg-secondary-50/40">
                      <td className="table-td font-medium">#{v.id}</td>
                      <td className="table-td">{formatDateTime(v.date)}</td>
                      <td className="table-td">{v.userName}</td>
                      <td className="table-td text-right">{v.lignes?.length ?? 0}</td>
                      <td className="table-td text-right font-semibold">{formatCurrency(v.total)}</td>
                      <td className="table-td text-right">
                        <div className="inline-flex gap-1">
                          <button
                            className="btn-ghost p-2"
                            aria-label="Voir le détail"
                            onClick={() => setDetailId(v.id)}
                          >
                            <Eye size={16} />
                          </button>
                          {canDelete && (
                            <button
                              className="btn-ghost p-2 text-error hover:bg-red-50"
                              aria-label="Supprimer"
                              onClick={() => setConfirmDelete(v)}
                            >
                              <Trash2 size={16} />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <Pagination
              page={data.page}
              totalPages={data.totalPages}
              totalElements={data.totalElements}
              size={data.size}
              onPageChange={setPage}
            />
          </>
        )}
      </div>

      <VenteDetailModal id={detailId} onClose={() => setDetailId(null)} />

      <ConfirmDialog
        open={Boolean(confirmDelete)}
        title="Supprimer la vente ?"
        message={`La vente #${confirmDelete?.id} sera supprimée. Cette action ne réintègre pas le stock.`}
        loading={deleteMut.isPending}
        onClose={() => setConfirmDelete(null)}
        onConfirm={() => {
          if (confirmDelete) deleteMut.mutate(confirmDelete.id);
        }}
      />
    </>
  );
}
