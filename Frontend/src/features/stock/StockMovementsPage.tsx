import { useMemo, useState, type FormEvent } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Plus, ArrowLeftRight, ArrowDownToLine, ArrowUpFromLine } from "lucide-react";
import toast from "react-hot-toast";
import { PageHeader } from "@/components/ui/PageHeader";
import { Spinner } from "@/components/ui/Spinner";
import { Pagination } from "@/components/ui/Pagination";
import { EmptyState } from "@/components/ui/EmptyState";
import { Modal } from "@/components/ui/Modal";
import { stockService, type StockSearchParams } from "./stockService";
import { productsService } from "@/features/products/productsService";
import { useAuth } from "@/features/auth/AuthContext";
import { formatDateTime, formatNumber } from "@/utils/format";
import type { StockMovementRequest, StockMovementType } from "@/types";

export function StockMovementsPage() {
  const { hasRole } = useAuth();
  const canCreate = hasRole("ADMIN", "STOCK_MANAGER");
  const qc = useQueryClient();

  const [page, setPage] = useState(0);
  const [type, setType] = useState<StockMovementType | "">("");
  const [productId, setProductId] = useState<number | "">("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");

  const params: StockSearchParams = useMemo(
    () => ({
      page,
      size: 15,
      type: (type || undefined) as StockMovementType | undefined,
      productId: typeof productId === "number" ? productId : undefined,
      startDate: startDate ? `${startDate}T00:00:00` : undefined,
      endDate: endDate ? `${endDate}T23:59:59` : undefined,
    }),
    [page, type, productId, startDate, endDate],
  );

  const movementsQuery = useQuery({
    queryKey: ["stock-movements", params],
    queryFn: () => stockService.list(params),
  });

  const productsQuery = useQuery({
    queryKey: ["products", "all-for-stock"],
    queryFn: () => productsService.list({ page: 0, size: 500 }),
  });
  const products = productsQuery.data?.content ?? [];

  const [formOpen, setFormOpen] = useState(false);
  const [form, setForm] = useState<StockMovementRequest>({ type: "IN", quantity: 1, productId: 0 });

  const createMut = useMutation({
    mutationFn: (b: StockMovementRequest) => stockService.create(b),
    onSuccess: () => {
      toast.success("Mouvement enregistré");
      setFormOpen(false);
      void qc.invalidateQueries({ queryKey: ["stock-movements"] });
      void qc.invalidateQueries({ queryKey: ["products"] });
    },
  });

  const submit = (e: FormEvent) => {
    e.preventDefault();
    if (!form.productId || form.quantity <= 0) {
      toast.error("Sélectionnez un produit et une quantité valide.");
      return;
    }
    createMut.mutate(form);
  };

  const data = movementsQuery.data;

  return (
    <>
      <PageHeader
        title="Mouvements de stock"
        subtitle="Historique des entrées et sorties de stock."
        actions={
          canCreate && (
            <button
              className="btn-primary"
              onClick={() => {
                setForm({ type: "IN", quantity: 1, productId: products[0]?.id ?? 0 });
                setFormOpen(true);
              }}
            >
              <Plus size={16} />
              Nouveau mouvement
            </button>
          )
        }
      />

      <div className="card p-4 mb-4">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          <div>
            <label className="label">Type</label>
            <select
              className="input"
              value={type}
              onChange={(e) => {
                setType(e.target.value as StockMovementType | "");
                setPage(0);
              }}
            >
              <option value="">Tous</option>
              <option value="IN">Entrée (IN)</option>
              <option value="OUT">Sortie (OUT)</option>
            </select>
          </div>
          <div>
            <label className="label">Produit</label>
            <select
              className="input"
              value={productId}
              onChange={(e) => {
                setProductId(e.target.value === "" ? "" : Number(e.target.value));
                setPage(0);
              }}
            >
              <option value="">Tous</option>
              {products.map((p) => (
                <option key={p.id} value={p.id}>{p.name}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="label">Du</label>
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
            <label className="label">Au</label>
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
        </div>
      </div>

      <div className="card overflow-hidden">
        {movementsQuery.isPending ? (
          <div className="flex justify-center py-16"><Spinner size="lg" /></div>
        ) : !data || data.empty ? (
          <EmptyState icon={ArrowLeftRight} title="Aucun mouvement" />
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr>
                    <th className="table-th">#</th>
                    <th className="table-th">Date</th>
                    <th className="table-th">Type</th>
                    <th className="table-th">Produit</th>
                    <th className="table-th">Utilisateur</th>
                    <th className="table-th text-right">Quantité</th>
                  </tr>
                </thead>
                <tbody>
                  {data.content.map((m) => (
                    <tr key={m.id} className="hover:bg-secondary-50/40">
                      <td className="table-td font-medium">#{m.id}</td>
                      <td className="table-td">{formatDateTime(m.date)}</td>
                      <td className="table-td">
                        {m.type === "IN" ? (
                          <span className="badge-success"><ArrowDownToLine size={12} />Entrée</span>
                        ) : (
                          <span className="badge-warning"><ArrowUpFromLine size={12} />Sortie</span>
                        )}
                      </td>
                      <td className="table-td">{m.productName}</td>
                      <td className="table-td">{m.userName}</td>
                      <td className="table-td text-right font-semibold">{formatNumber(m.quantity)}</td>
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

      <Modal
        open={formOpen}
        onClose={() => setFormOpen(false)}
        title="Nouveau mouvement de stock"
        size="sm"
        footer={
          <>
            <button className="btn-secondary" onClick={() => setFormOpen(false)}>Annuler</button>
            <button type="submit" form="stock-form" className="btn-primary" disabled={createMut.isPending}>
              {createMut.isPending ? "..." : "Enregistrer"}
            </button>
          </>
        }
      >
        <form id="stock-form" onSubmit={submit} className="space-y-4">
          <div>
            <label className="label">Type</label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setForm({ ...form, type: "IN" })}
                className={`flex items-center justify-center gap-2 rounded-lg border px-3 py-2 text-sm font-medium transition ${
                  form.type === "IN"
                    ? "border-success bg-green-50 text-green-700"
                    : "border-secondary-200 text-secondary-600 hover:bg-secondary-50"
                }`}
              >
                <ArrowDownToLine size={15} />
                Entrée (IN)
              </button>
              <button
                type="button"
                onClick={() => setForm({ ...form, type: "OUT" })}
                className={`flex items-center justify-center gap-2 rounded-lg border px-3 py-2 text-sm font-medium transition ${
                  form.type === "OUT"
                    ? "border-warning bg-amber-50 text-amber-700"
                    : "border-secondary-200 text-secondary-600 hover:bg-secondary-50"
                }`}
              >
                <ArrowUpFromLine size={15} />
                Sortie (OUT)
              </button>
            </div>
          </div>
          <div>
            <label className="label">Produit</label>
            <select
              className="input"
              required
              value={form.productId || ""}
              onChange={(e) => setForm({ ...form, productId: Number(e.target.value) })}
            >
              <option value="" disabled>Sélectionner...</option>
              {products.map((p) => (
                <option key={p.id} value={p.id}>{p.name} (stock: {p.quantity})</option>
              ))}
            </select>
          </div>
          <div>
            <label className="label">Quantité</label>
            <input
              type="number"
              min="1"
              required
              className="input"
              value={form.quantity}
              onChange={(e) => setForm({ ...form, quantity: Number(e.target.value) })}
            />
          </div>
        </form>
      </Modal>
    </>
  );
}
