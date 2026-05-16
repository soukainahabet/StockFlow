import { ScanLine } from "lucide-react";
import { useEffect, useState, type FormEvent } from "react";
import { BarcodeScanner } from "@/components/ui/BarcodeScanner";
import { Button } from "@/components/ui/Button";
import {
  Drawer,
  DrawerBody,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
} from "@/components/ui/Drawer";
import { Input } from "@/components/ui/Input";
import { Label } from "@/components/ui/Label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/Select";
import type { CategoryResponse, ProductRequest, ProductResponse } from "@/types";

interface Props {
  open: boolean;
  onClose: () => void;
  onSubmit: (body: ProductRequest) => Promise<unknown> | void;
  initial?: ProductResponse | null;
  categories: CategoryResponse[];
  submitting?: boolean;
}

const empty: ProductRequest = {
  name: "",
  barcode: "",
  price: 0,
  buyPrice: 0,
  quantity: 0,
  alertThreshold: 0,
  categoryId: 0,
};

export function ProductForm({
  open,
  onClose,
  onSubmit,
  initial,
  categories,
  submitting,
}: Props) {
  const [form, setForm] = useState<ProductRequest>(empty);

  useEffect(() => {
    if (!open) return;
    if (initial) {
      setForm({
        name: initial.name,
        barcode: initial.barcode ?? "",
        price: Number(initial.price),
        buyPrice: Number(initial.buyPrice ?? 0),
        quantity: Number(initial.quantity),
        alertThreshold: Number(initial.alertThreshold),
        categoryId: initial.categoryId,
      });
    } else {
      setForm({ ...empty, categoryId: categories[0]?.id ?? 0 });
    }
  }, [open, initial, categories]);

  const [scannerOpen, setScannerOpen] = useState(false);

  const handle = (e: FormEvent) => {
    e.preventDefault();
    // Normalise barcode : empty string → null (signals "no barcode")
    const payload: ProductRequest = {
      ...form,
      barcode: form.barcode && form.barcode.trim().length > 0
        ? form.barcode.trim()
        : null,
    };
    void onSubmit(payload);
  };

  return (
    <Drawer open={open} onOpenChange={(next) => !next && onClose()}>
      <DrawerContent size="md">
        <DrawerHeader>
          <DrawerTitle>
            {initial ? "Modifier le produit" : "Nouveau produit"}
          </DrawerTitle>
          <DrawerDescription>
            {initial
              ? `Référence #${initial.id}`
              : "Ajoutez un produit au catalogue."}
          </DrawerDescription>
        </DrawerHeader>

        <form id="product-form" onSubmit={handle} className="contents">
          <DrawerBody className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="product-name" required>
                Nom du produit
              </Label>
              <Input
                id="product-name"
                required
                maxLength={150}
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                autoFocus
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="product-barcode">
                Code-barres / QR{" "}
                <span className="text-muted font-normal text-xs">
                  (optionnel)
                </span>
              </Label>
              <div className="flex items-center gap-2">
                <Input
                  id="product-barcode"
                  maxLength={64}
                  value={form.barcode ?? ""}
                  onChange={(e) =>
                    setForm({ ...form, barcode: e.target.value })
                  }
                  placeholder="EAN-13, UPC, QR…"
                  className="font-mono text-xs"
                />
                <Button
                  type="button"
                  variant="secondary"
                  size="md"
                  onClick={() => setScannerOpen(true)}
                  aria-label="Scanner avec la caméra"
                >
                  <ScanLine className="h-3.5 w-3.5" />
                  Scanner
                </Button>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="product-buy-price" required>
                  Prix d'achat (€)
                </Label>
                <Input
                  id="product-buy-price"
                  type="number"
                  step="0.01"
                  min="0"
                  required
                  value={form.buyPrice}
                  onChange={(e) =>
                    setForm({ ...form, buyPrice: Number(e.target.value) })
                  }
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="product-price" required>
                  Prix de vente (€)
                </Label>
                <Input
                  id="product-price"
                  type="number"
                  step="0.01"
                  min="0.01"
                  required
                  value={form.price}
                  invalid={form.price > 0 && form.price <= form.buyPrice}
                  onChange={(e) =>
                    setForm({ ...form, price: Number(e.target.value) })
                  }
                />
                {form.price > 0 && form.buyPrice >= 0 && (
                  <p className="text-xs text-muted tabular-nums">
                    Marge :{" "}
                    <span
                      className={
                        form.price > form.buyPrice
                          ? "text-success-soft-fg font-medium"
                          : "text-danger font-medium"
                      }
                    >
                      {form.price - form.buyPrice >= 0 ? "+" : ""}
                      {(form.price - form.buyPrice).toFixed(2)} €
                      {form.price > 0 &&
                        ` (${(
                          ((form.price - form.buyPrice) / form.price) *
                          100
                        ).toFixed(1)} %)`}
                    </span>
                  </p>
                )}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="product-qty" required>
                  Quantité en stock
                </Label>
                <Input
                  id="product-qty"
                  type="number"
                  min="0"
                  required
                  value={form.quantity}
                  onChange={(e) =>
                    setForm({ ...form, quantity: Number(e.target.value) })
                  }
                />
              </div>
              <div className="space-y-1.5">
                <Label required>Catégorie</Label>
                <Select
                  value={form.categoryId ? String(form.categoryId) : ""}
                  onValueChange={(v) =>
                    setForm({ ...form, categoryId: Number(v) })
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Sélectionner…" />
                  </SelectTrigger>
                  <SelectContent>
                    {categories.map((c) => (
                      <SelectItem key={c.id} value={String(c.id)}>
                        {c.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="product-threshold" required>
                Seuil d'alerte stock
              </Label>
              <Input
                id="product-threshold"
                type="number"
                min="0"
                required
                value={form.alertThreshold}
                onChange={(e) =>
                  setForm({
                    ...form,
                    alertThreshold: Number(e.target.value),
                  })
                }
              />
              <p className="text-xs text-muted">
                Une alerte s'affiche dès que la quantité descend à ce seuil.
              </p>
            </div>
          </DrawerBody>

          <DrawerFooter>
            <Button type="submit" loading={submitting}>
              {initial ? "Enregistrer" : "Créer le produit"}
            </Button>
            <Button
              type="button"
              variant="secondary"
              onClick={onClose}
              disabled={submitting}
            >
              Annuler
            </Button>
          </DrawerFooter>
        </form>
      </DrawerContent>

      <BarcodeScanner
        open={scannerOpen}
        onClose={() => setScannerOpen(false)}
        onScan={(code) => {
          setForm((f) => ({ ...f, barcode: code }));
          setScannerOpen(false);
        }}
        title="Associer un code-barres au produit"
        description="Scannez l'étiquette du produit ou saisissez le code manuellement."
      />
    </Drawer>
  );
}
