import { useEffect, useState, type FormEvent } from "react";
import { Modal } from "@/components/ui/Modal";
import type { CategoryResponse, ProductRequest, ProductResponse } from "@/types";

interface Props {
  open: boolean;
  onClose: () => void;
  onSubmit: (body: ProductRequest) => Promise<unknown> | void;
  initial?: ProductResponse | null;
  categories: CategoryResponse[];
  submitting?: boolean;
}

const empty: ProductRequest = { name: "", price: 0, quantity: 0, alertThreshold: 0, categoryId: 0 };

export function ProductForm({ open, onClose, onSubmit, initial, categories, submitting }: Props) {
  const [form, setForm] = useState<ProductRequest>(empty);

  useEffect(() => {
    if (open) {
      if (initial) {
        setForm({
          name: initial.name,
          price: Number(initial.price),
          quantity: Number(initial.quantity),
          alertThreshold: Number(initial.alertThreshold),
          categoryId: initial.categoryId,
        });
      } else {
        setForm({ ...empty, categoryId: categories[0]?.id ?? 0 });
      }
    }
  }, [open, initial, categories]);

  const handle = (e: FormEvent) => {
    e.preventDefault();
    void onSubmit(form);
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={initial ? "Modifier le produit" : "Nouveau produit"}
      description={initial ? `ID #${initial.id}` : "Ajouter un produit au catalogue."}
      footer={
        <>
          <button type="button" className="btn-secondary" onClick={onClose} disabled={submitting}>
            Annuler
          </button>
          <button type="submit" form="product-form" className="btn-primary" disabled={submitting}>
            {submitting ? "..." : initial ? "Enregistrer" : "Créer"}
          </button>
        </>
      }
    >
      <form id="product-form" onSubmit={handle} className="space-y-4">
        <div>
          <label className="label">Nom du produit</label>
          <input
            className="input"
            required
            maxLength={150}
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
          />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="label">Prix unitaire</label>
            <input
              className="input"
              type="number"
              step="0.01"
              min="0.01"
              required
              value={form.price}
              onChange={(e) => setForm({ ...form, price: Number(e.target.value) })}
            />
          </div>
          <div>
            <label className="label">Quantité</label>
            <input
              className="input"
              type="number"
              min="0"
              required
              value={form.quantity}
              onChange={(e) => setForm({ ...form, quantity: Number(e.target.value) })}
            />
          </div>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="label">Seuil d'alerte</label>
            <input
              className="input"
              type="number"
              min="0"
              required
              value={form.alertThreshold}
              onChange={(e) => setForm({ ...form, alertThreshold: Number(e.target.value) })}
            />
          </div>
          <div>
            <label className="label">Catégorie</label>
            <select
              className="input"
              required
              value={form.categoryId || ""}
              onChange={(e) => setForm({ ...form, categoryId: Number(e.target.value) })}
            >
              <option value="" disabled>Sélectionner...</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
          </div>
        </div>
      </form>
    </Modal>
  );
}
