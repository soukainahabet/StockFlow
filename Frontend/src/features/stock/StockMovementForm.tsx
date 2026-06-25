import { ArrowDownToLine, ArrowUpFromLine } from "lucide-react";
import { useEffect, useState, type FormEvent } from "react";
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
import { cn } from "@/lib/cn";
import type {
  ProductResponse,
  StockMovementRequest,
  StockMovementType,
} from "@/types";

interface Props {
  open: boolean;
  onClose: () => void;
  onSubmit: (body: StockMovementRequest) => Promise<unknown> | void;
  products: ProductResponse[];
  defaultProductId?: number;
  defaultType?: StockMovementType;
  submitting?: boolean;
  /** Quand true, le sélecteur de produit est masqué (utile depuis la fiche produit). */
  lockProduct?: boolean;
}

export function StockMovementForm({
  open,
  onClose,
  onSubmit,
  products,
  defaultProductId,
  defaultType = "IN",
  submitting,
  lockProduct,
}: Props) {
  const [form, setForm] = useState<StockMovementRequest>({
    type: defaultType,
    quantity: 1,
    productId: defaultProductId ?? 0,
    reason: "",
  });

  useEffect(() => {
    if (!open) return;
    setForm({
      type: defaultType,
      quantity: 1,
      productId: defaultProductId ?? products[0]?.id ?? 0,
      reason: "",
    });
  }, [open, defaultProductId, defaultType, products]);

  const submit = (e: FormEvent) => {
    e.preventDefault();
    if (!form.productId || form.quantity <= 0) return;
    const trimmedReason = form.reason?.trim();
    void onSubmit({
      ...form,
      reason: trimmedReason ? trimmedReason : null,
    });
  };

  const selectedProduct = products.find((p) => p.id === form.productId);
  const willGoNegative =
    form.type === "OUT" &&
    selectedProduct &&
    form.quantity > selectedProduct.quantity;

  return (
    <Drawer open={open} onOpenChange={(next) => !next && onClose()}>
      <DrawerContent size="sm">
        <DrawerHeader>
          <DrawerTitle>Nouveau mouvement de stock</DrawerTitle>
          <DrawerDescription>
            Enregistrez une entrée ou une sortie pour {lockProduct ? "ce produit" : "un produit"}.
          </DrawerDescription>
        </DrawerHeader>

        <form id="stock-form" onSubmit={submit} className="contents">
          <DrawerBody className="space-y-4">
            <div className="space-y-1.5">
              <Label>Type</Label>
              <div className="grid grid-cols-2 gap-2">
                <TypeButton
                  active={form.type === "IN"}
                  tone="success"
                  icon={ArrowDownToLine}
                  label="Entrée"
                  onClick={() => setForm({ ...form, type: "IN" })}
                />
                <TypeButton
                  active={form.type === "OUT"}
                  tone="warning"
                  icon={ArrowUpFromLine}
                  label="Sortie"
                  onClick={() => setForm({ ...form, type: "OUT" })}
                />
              </div>
            </div>

            {!lockProduct && (
              <div className="space-y-1.5">
                <Label required>Produit</Label>
                <Select
                  value={form.productId ? String(form.productId) : ""}
                  onValueChange={(v) =>
                    setForm({ ...form, productId: Number(v) })
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Sélectionner…" />
                  </SelectTrigger>
                  <SelectContent>
                    {products.map((p) => (
                      <SelectItem key={p.id} value={String(p.id)}>
                        {p.name}{" "}
                        <span className="text-muted">(stock {p.quantity})</span>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            <div className="space-y-1.5">
              <Label htmlFor="qty" required>
                Quantité
              </Label>
              <Input
                id="qty"
                type="number"
                min={1}
                required
                value={form.quantity}
                onChange={(e) =>
                  setForm({ ...form, quantity: Math.max(1, Number(e.target.value)) })
                }
                invalid={Boolean(willGoNegative)}
              />
              {selectedProduct && (
                <p className="text-xs text-muted">
                  Stock actuel :{" "}
                  <span className="font-medium tabular-nums">
                    {selectedProduct.quantity}
                  </span>
                  {form.type === "OUT" && (
                    <>
                      {" · Après mouvement : "}
                      <span
                        className={cn(
                          "font-medium tabular-nums",
                          willGoNegative ? "text-danger" : "text-primary",
                        )}
                      >
                        {selectedProduct.quantity - form.quantity}
                      </span>
                    </>
                  )}
                </p>
              )}
              {willGoNegative && (
                <p className="text-xs text-danger">
                  Quantité supérieure au stock disponible.
                </p>
              )}
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="reason">Raison (optionnel)</Label>
              <Input
                id="reason"
                type="text"
                maxLength={255}
                placeholder="Ex. Réapprovisionnement, casse, inventaire…"
                value={form.reason ?? ""}
                onChange={(e) => setForm({ ...form, reason: e.target.value })}
              />
            </div>
          </DrawerBody>

          <DrawerFooter>
            <Button
              type="submit"
              loading={submitting}
              disabled={Boolean(willGoNegative)}
            >
              Enregistrer
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
    </Drawer>
  );
}

function TypeButton({
  active,
  tone,
  icon: Icon,
  label,
  onClick,
}: {
  active: boolean;
  tone: "success" | "warning";
  icon: typeof ArrowDownToLine;
  label: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "flex items-center justify-center gap-2 rounded-md border px-3 h-9 text-sm font-medium transition-colors",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-ring focus-visible:ring-offset-1 focus-visible:ring-offset-app",
        active
          ? tone === "success"
            ? "bg-success-soft border-success/30 text-success-soft-fg"
            : "bg-warning-soft border-warning/30 text-warning-soft-fg"
          : "bg-surface border-default text-secondary hover:bg-surface-muted hover:border-strong",
      )}
    >
      <Icon className="h-3.5 w-3.5" />
      {label}
    </button>
  );
}
