import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Plus, Pencil, Trash2, Search, Package, AlertTriangle } from "lucide-react";
import toast from "react-hot-toast";
import { PageHeader } from "@/components/ui/PageHeader";
import { Spinner } from "@/components/ui/Spinner";
import { Pagination } from "@/components/ui/Pagination";
import { EmptyState } from "@/components/ui/EmptyState";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { productsService, type ProductSearchParams } from "./productsService";
import { categoriesService } from "@/features/categories/categoriesService";
import { ProductForm } from "./ProductForm";
import { useAuth } from "@/features/auth/AuthContext";
import { formatCurrency, formatNumber } from "@/utils/format";
import type { ProductRequest, ProductResponse } from "@/types";

export function ProductsPage() {
  const { hasRole } = useAuth();
  const canManage = hasRole("ADMIN");
  const qc = useQueryClient();

  const [page, setPage] = useState(0);
  const [name, setName] = useState("");
  const [categoryId, setCategoryId] = useState<number | "">("");
  const [lowStock, setLowStock] = useState(false);

  const params: ProductSearchParams = useMemo(
    () => ({
      page,
      size: 10,
      name: name || undefined,
      categoryId: typeof categoryId === "number" ? categoryId : undefined,
      lowStock: lowStock || undefined,
    }),
    [page, name, categoryId, lowStock],
  );

  const productsQuery = useQuery({
    queryKey: ["products", params],
    queryFn: () => productsService.list(params),
  });

  const categoriesQuery = useQuery({
    queryKey: ["categories", "all"],
    queryFn: categoriesService.listAll,
  });

  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<ProductResponse | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<ProductResponse | null>(null);

  const createMut = useMutation({
    mutationFn: (body: ProductRequest) => productsService.create(body),
    onSuccess: () => {
      toast.success("Produit créé");
      setFormOpen(false);
      void qc.invalidateQueries({ queryKey: ["products"] });
    },
  });

  const updateMut = useMutation({
    mutationFn: ({ id, body }: { id: number; body: ProductRequest }) =>
      productsService.update(id, body),
    onSuccess: () => {
      toast.success("Produit mis à jour");
      setFormOpen(false);
      setEditing(null);
      void qc.invalidateQueries({ queryKey: ["products"] });
    },
  });

  const deleteMut = useMutation({
    mutationFn: (id: number) => productsService.remove(id),
    onSuccess: () => {
      toast.success("Produit supprimé");
      setConfirmDelete(null);
      void qc.invalidateQueries({ queryKey: ["products"] });
    },
  });

  const data = productsQuery.data;

  return (
    <>
      <PageHeader
        title="Produits"
        subtitle="Gérez votre catalogue de produits."
        actions={
          canManage && (
            <button
              className="btn-primary"
              onClick={() => {
                setEditing(null);
                setFormOpen(true);
              }}
            >
              <Plus size={16} />
              Nouveau produit
            </button>
          )
        }
      />

      <div className="card p-4 mb-4">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div className="relative">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-secondary-400" />
            <input
              className="input pl-9"
              placeholder="Rechercher un produit..."
              value={name}
              onChange={(e) => {
                setName(e.target.value);
                setPage(0);
              }}
            />
          </div>
          <select
            className="input"
            value={categoryId}
            onChange={(e) => {
              setCategoryId(e.target.value === "" ? "" : Number(e.target.value));
              setPage(0);
            }}
          >
            <option value="">Toutes les catégories</option>
            {(categoriesQuery.data ?? []).map((c) => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>
          <label className="flex items-center gap-2 px-3 py-2 rounded-lg border border-secondary-200 bg-white cursor-pointer">
            <input
              type="checkbox"
              checked={lowStock}
              onChange={(e) => {
                setLowStock(e.target.checked);
                setPage(0);
              }}
              className="rounded border-secondary-300 text-primary focus:ring-primary"
            />
            <span className="text-sm text-secondary-700">Uniquement stock faible</span>
          </label>
        </div>
      </div>

      <div className="card overflow-hidden">
        {productsQuery.isPending ? (
          <div className="flex justify-center py-16"><Spinner size="lg" /></div>
        ) : !data || data.empty ? (
          <EmptyState icon={Package} title="Aucun produit" description="Ajustez vos filtres ou créez un produit." />
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr>
                    <th className="table-th">Produit</th>
                    <th className="table-th">Catégorie</th>
                    <th className="table-th text-right">Prix</th>
                    <th className="table-th text-right">Quantité</th>
                    <th className="table-th text-right">Seuil</th>
                    <th className="table-th">État</th>
                    {canManage && <th className="table-th text-right">Actions</th>}
                  </tr>
                </thead>
                <tbody>
                  {data.content.map((p) => (
                    <tr key={p.id} className="hover:bg-secondary-50/40">
                      <td className="table-td">
                        <div className="font-medium text-secondary-900">{p.name}</div>
                        <div className="text-xs text-secondary-500">#{p.id}</div>
                      </td>
                      <td className="table-td">{p.categoryName}</td>
                      <td className="table-td text-right font-semibold">{formatCurrency(p.price)}</td>
                      <td className="table-td text-right">{formatNumber(p.quantity)}</td>
                      <td className="table-td text-right text-secondary-500">{formatNumber(p.alertThreshold)}</td>
                      <td className="table-td">
                        {p.lowStock ? (
                          <span className="badge-error"><AlertTriangle size={12} />Stock faible</span>
                        ) : (
                          <span className="badge-success">OK</span>
                        )}
                      </td>
                      {canManage && (
                        <td className="table-td text-right">
                          <div className="inline-flex gap-1">
                            <button
                              className="btn-ghost p-2"
                              aria-label="Modifier"
                              onClick={() => {
                                setEditing(p);
                                setFormOpen(true);
                              }}
                            >
                              <Pencil size={16} />
                            </button>
                            <button
                              className="btn-ghost p-2 text-error hover:bg-red-50"
                              aria-label="Supprimer"
                              onClick={() => setConfirmDelete(p)}
                            >
                              <Trash2 size={16} />
                            </button>
                          </div>
                        </td>
                      )}
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

      <ProductForm
        open={formOpen}
        onClose={() => {
          setFormOpen(false);
          setEditing(null);
        }}
        initial={editing}
        categories={categoriesQuery.data ?? []}
        submitting={createMut.isPending || updateMut.isPending}
        onSubmit={(body) =>
          editing ? updateMut.mutateAsync({ id: editing.id, body }) : createMut.mutateAsync(body)
        }
      />
      <ConfirmDialog
        open={Boolean(confirmDelete)}
        title="Supprimer le produit ?"
        message={`Cette action est irréversible. "${confirmDelete?.name}" sera supprimé.`}
        confirmLabel="Supprimer"
        loading={deleteMut.isPending}
        onClose={() => setConfirmDelete(null)}
        onConfirm={() => {
          if (confirmDelete) deleteMut.mutate(confirmDelete.id);
        }}
      />
    </>
  );
}
