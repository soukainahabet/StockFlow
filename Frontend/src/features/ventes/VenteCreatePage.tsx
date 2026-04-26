import { useMemo, useState } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { Plus, Trash2, ShoppingCart } from "lucide-react";
import toast from "react-hot-toast";
import { PageHeader } from "@/components/ui/PageHeader";
import { Spinner } from "@/components/ui/Spinner";
import { ventesService } from "./ventesService";
import { productsService } from "@/features/products/productsService";
import { formatCurrency } from "@/utils/format";
import type { LigneVenteRequest, ProductResponse } from "@/types";

interface Line extends LigneVenteRequest {
  key: string;
}

const newKey = () => Math.random().toString(36).slice(2);

export function VenteCreatePage() {
  const navigate = useNavigate();
  const [lines, setLines] = useState<Line[]>([{ key: newKey(), productId: 0, quantite: 1 }]);

  const productsQuery = useQuery({
    queryKey: ["products", "all-for-vente"],
    queryFn: () => productsService.list({ page: 0, size: 500 }),
  });
  const products: ProductResponse[] = productsQuery.data?.content ?? [];
  const productsMap = useMemo(
    () => Object.fromEntries(products.map((p) => [p.id, p])),
    [products],
  ) as Record<number, ProductResponse>;

  const total = useMemo(
    () =>
      lines.reduce((sum, l) => {
        const p = productsMap[l.productId];
        if (!p) return sum;
        return sum + Number(p.price) * l.quantite;
      }, 0),
    [lines, productsMap],
  );

  const addLine = () => setLines((ls) => [...ls, { key: newKey(), productId: 0, quantite: 1 }]);
  const removeLine = (key: string) => setLines((ls) => ls.filter((l) => l.key !== key));
  const updateLine = (key: string, patch: Partial<LigneVenteRequest>) =>
    setLines((ls) => ls.map((l) => (l.key === key ? { ...l, ...patch } : l)));

  const createMut = useMutation({
    mutationFn: () =>
      ventesService.create({
        lignes: lines.map((l) => ({ productId: l.productId, quantite: l.quantite })),
      }),
    onSuccess: (v) => {
      toast.success(`Vente #${v.id} enregistrée`);
      navigate("/ventes");
    },
  });

  const submit = () => {
    if (lines.length === 0) {
      toast.error("Ajoutez au moins une ligne.");
      return;
    }
    for (const l of lines) {
      if (!l.productId || l.quantite <= 0) {
        toast.error("Toutes les lignes doivent avoir un produit et une quantité valides.");
        return;
      }
      const p = productsMap[l.productId];
      if (p && l.quantite > p.quantity) {
        toast.error(`Stock insuffisant pour "${p.name}" (dispo : ${p.quantity}).`);
        return;
      }
    }
    createMut.mutate();
  };

  return (
    <>
      <PageHeader
        title="Nouvelle vente"
        subtitle="Sélectionnez les produits et leurs quantités. Le total est calculé automatiquement."
      />

      {productsQuery.isPending ? (
        <div className="flex justify-center py-20"><Spinner size="lg" /></div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <div className="lg:col-span-2 card overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr>
                    <th className="table-th">Produit</th>
                    <th className="table-th text-right">Stock</th>
                    <th className="table-th text-right">Quantité</th>
                    <th className="table-th text-right">Sous-total</th>
                    <th className="table-th text-right">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {lines.map((l) => {
                    const p = productsMap[l.productId];
                    return (
                      <tr key={l.key}>
                        <td className="table-td">
                          <select
                            className="input"
                            value={l.productId || ""}
                            onChange={(e) => updateLine(l.key, { productId: Number(e.target.value) })}
                          >
                            <option value="" disabled>Sélectionner...</option>
                            {products.map((p) => (
                              <option key={p.id} value={p.id} disabled={p.quantity === 0}>
                                {p.name} — {formatCurrency(p.price)}
                              </option>
                            ))}
                          </select>
                        </td>
                        <td className="table-td text-right text-secondary-500">{p?.quantity ?? "—"}</td>
                        <td className="table-td text-right">
                          <input
                            type="number"
                            min={1}
                            max={p?.quantity ?? undefined}
                            className="input text-right w-24 ml-auto"
                            value={l.quantite}
                            onChange={(e) => updateLine(l.key, { quantite: Math.max(1, Number(e.target.value)) })}
                          />
                        </td>
                        <td className="table-td text-right font-semibold">
                          {p ? formatCurrency(Number(p.price) * l.quantite) : "—"}
                        </td>
                        <td className="table-td text-right">
                          <button
                            type="button"
                            className="btn-ghost p-2 text-error hover:bg-red-50"
                            onClick={() => removeLine(l.key)}
                            disabled={lines.length === 1}
                            aria-label="Supprimer la ligne"
                          >
                            <Trash2 size={16} />
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
            <div className="px-4 py-3 border-t border-secondary-100">
              <button type="button" className="btn-secondary" onClick={addLine}>
                <Plus size={16} />
                Ajouter une ligne
              </button>
            </div>
          </div>

          <div className="card p-5 h-fit space-y-4">
            <div className="flex items-center gap-2.5">
              <div className="rounded-lg bg-primary-50 p-2 text-primary-700">
                <ShoppingCart size={18} />
              </div>
              <h3 className="text-base font-semibold text-secondary-900">Récapitulatif</h3>
            </div>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-secondary-500">Lignes</span>
                <span className="font-medium">{lines.length}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-secondary-500">Articles</span>
                <span className="font-medium">{lines.reduce((s, l) => s + l.quantite, 0)}</span>
              </div>
            </div>
            <div className="border-t border-secondary-100 pt-3 flex items-center justify-between">
              <span className="text-sm text-secondary-500">Total</span>
              <span className="text-2xl font-bold text-primary">{formatCurrency(total)}</span>
            </div>
            <button type="button" className="btn-primary w-full" onClick={submit} disabled={createMut.isPending}>
              {createMut.isPending ? "Enregistrement..." : "Enregistrer la vente"}
            </button>
            <button
              type="button"
              className="btn-secondary w-full"
              onClick={() => navigate("/ventes")}
              disabled={createMut.isPending}
            >
              Annuler
            </button>
          </div>
        </div>
      )}
    </>
  );
}
