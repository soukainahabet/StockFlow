import { useMutation, useQuery } from "@tanstack/react-query";
import { AlertCircle, ArrowLeft, Plus, ScanLine, Trash2 } from "lucide-react";
import { useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  Badge,
  BarcodeScanner,
  Button,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  EmptyState,
  Input,
  Label,
  PageHeader,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Skeleton,
  toastUI,
  Tooltip,
} from "@/components/ui";
import { productsService } from "@/features/products/productsService";
import { cn } from "@/lib/cn";
import type { LigneVenteRequest, ProductResponse } from "@/types";
import { formatCurrency } from "@/utils/format";
import { ventesService } from "./ventesService";

interface Line extends LigneVenteRequest {
  key: string;
}

const newKey = () => Math.random().toString(36).slice(2);

export function VenteCreatePage() {
  const navigate = useNavigate();
  const [lines, setLines] = useState<Line[]>([
    { key: newKey(), productId: 0, quantite: 1 },
  ]);

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
  const itemsCount = lines.reduce((s, l) => s + l.quantite, 0);

  // Validation
  const errors = useMemo(() => {
    const errs: { lineKey: string; message: string }[] = [];
    for (const l of lines) {
      if (!l.productId) continue; // ligne vide acceptée tant que non soumise
      const p = productsMap[l.productId];
      if (!p) continue;
      if (l.quantite <= 0) {
        errs.push({ lineKey: l.key, message: "Quantité requise" });
      } else if (l.quantite > p.quantity) {
        errs.push({
          lineKey: l.key,
          message: `Stock insuffisant (dispo ${p.quantity})`,
        });
      }
    }
    return errs;
  }, [lines, productsMap]);
  const errorByLine = useMemo(
    () => new Map(errors.map((e) => [e.lineKey, e.message])),
    [errors],
  );
  const canSubmit =
    lines.length > 0 &&
    lines.every((l) => l.productId > 0 && l.quantite > 0) &&
    errors.length === 0;

  const addLine = () =>
    setLines((ls) => [...ls, { key: newKey(), productId: 0, quantite: 1 }]);
  const removeLine = (key: string) =>
    setLines((ls) =>
      ls.length === 1 ? ls : ls.filter((l) => l.key !== key),
    );
  const updateLine = (key: string, patch: Partial<LigneVenteRequest>) =>
    setLines((ls) => ls.map((l) => (l.key === key ? { ...l, ...patch } : l)));

  // Scanner : ajoute le produit scanné en nouvelle ligne, ou incrémente si déjà présent
  const [scannerOpen, setScannerOpen] = useState(false);
  const handleScan = async (code: string) => {
    try {
      const product = await productsService.getByBarcode(code);
      if (product.quantity <= 0) {
        toastUI.warning({
          title: product.name,
          message: "Produit en rupture de stock — impossible de l'ajouter.",
        });
        return;
      }
      setScannerOpen(false);
      setLines((ls) => {
        // Cherche une ligne existante non remplie ou une ligne du même produit
        const existingIdx = ls.findIndex((l) => l.productId === product.id);
        if (existingIdx >= 0) {
          const existing = ls[existingIdx];
          if (existing.quantite + 1 > product.quantity) {
            toastUI.warning(
              `Stock insuffisant pour ${product.name} (dispo ${product.quantity}).`,
            );
            return ls;
          }
          return ls.map((l, i) =>
            i === existingIdx ? { ...l, quantite: l.quantite + 1 } : l,
          );
        }
        // Sinon : remplir la 1ère ligne vide ou ajouter
        const emptyIdx = ls.findIndex((l) => l.productId === 0);
        if (emptyIdx >= 0) {
          return ls.map((l, i) =>
            i === emptyIdx
              ? { ...l, productId: product.id, quantite: 1 }
              : l,
          );
        }
        return [...ls, { key: newKey(), productId: product.id, quantite: 1 }];
      });
      toastUI.success({
        title: "Produit ajouté",
        message: `${product.name} · ${formatCurrency(product.price)}`,
      });
    } catch {
      toastUI.error(`Code "${code}" introuvable dans le catalogue.`);
    }
  };

  const createMut = useMutation({
    mutationFn: () =>
      ventesService.create({
        lignes: lines.map((l) => ({
          productId: l.productId,
          quantite: l.quantite,
        })),
      }),
    onSuccess: (v) => {
      toastUI.success({
        title: `Vente #${v.id} enregistrée`,
        message: `Total : ${formatCurrency(v.total)}`,
      });
      navigate("/ventes");
    },
    onError: () => toastUI.error("Enregistrement impossible"),
  });

  return (
    <div className="max-w-[1200px] mx-auto">
      <Link
        to="/ventes"
        className="inline-flex items-center gap-1 text-sm text-muted hover:text-primary mb-3"
      >
        <ArrowLeft className="h-3.5 w-3.5" />
        Ventes
      </Link>

      <PageHeader
        title="Nouvelle vente"
        description="Composez les lignes, le total se met à jour automatiquement."
      />

      {productsQuery.isPending ? (
        <Skeleton className="h-96 w-full" />
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 items-start">
          {/* Lignes */}
          <Card className="lg:col-span-2">
            <CardHeader className="flex-row items-center justify-between">
              <CardTitle>Lignes ({lines.length})</CardTitle>
              <div className="flex items-center gap-2">
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => setScannerOpen(true)}
                >
                  <ScanLine className="h-3.5 w-3.5" />
                  Scanner
                </Button>
                <Button variant="secondary" size="sm" onClick={addLine}>
                  <Plus className="h-3.5 w-3.5" />
                  Ajouter une ligne
                </Button>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              {lines.length === 0 ? (
                <EmptyState
                  size="sm"
                  title="Aucune ligne"
                  description="Ajoutez au moins un produit."
                  action={
                    <Button onClick={addLine}>
                      <Plus className="h-3.5 w-3.5" />
                      Ajouter
                    </Button>
                  }
                />
              ) : (
                <ul className="divide-y divide-default">
                  {lines.map((l) => {
                    const p = productsMap[l.productId];
                    const err = errorByLine.get(l.key);
                    return (
                      <li key={l.key} className="px-4 py-3">
                        <div className="grid grid-cols-12 gap-3 items-end">
                          <div className="col-span-12 sm:col-span-6 space-y-1">
                            <Label className="text-xs">Produit</Label>
                            <Select
                              value={l.productId ? String(l.productId) : ""}
                              onValueChange={(v) =>
                                updateLine(l.key, { productId: Number(v) })
                              }
                            >
                              <SelectTrigger>
                                <SelectValue placeholder="Sélectionner…" />
                              </SelectTrigger>
                              <SelectContent>
                                {products.map((prod) => (
                                  <SelectItem
                                    key={prod.id}
                                    value={String(prod.id)}
                                    disabled={prod.quantity === 0}
                                  >
                                    {prod.name}{" "}
                                    <span className="text-muted">
                                      · {formatCurrency(prod.price)}
                                    </span>
                                    {prod.quantity === 0 && (
                                      <span className="text-danger ml-1">
                                        (rupture)
                                      </span>
                                    )}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>
                          <div className="col-span-4 sm:col-span-2 space-y-1">
                            <Label className="text-xs">Stock</Label>
                            <div className="h-9 px-2 flex items-center text-sm text-muted tabular-nums">
                              {p?.quantity ?? "—"}
                            </div>
                          </div>
                          <div className="col-span-4 sm:col-span-2 space-y-1">
                            <Label className="text-xs">Quantité</Label>
                            <Input
                              type="number"
                              min={1}
                              max={p?.quantity}
                              value={l.quantite}
                              onChange={(e) =>
                                updateLine(l.key, {
                                  quantite: Math.max(1, Number(e.target.value)),
                                })
                              }
                              className="text-right"
                              invalid={Boolean(err)}
                            />
                          </div>
                          <div className="col-span-3 sm:col-span-1 space-y-1 text-right">
                            <Label className="text-xs">Sous-total</Label>
                            <div className="h-9 flex items-center justify-end text-sm font-medium text-primary tabular-nums">
                              {p
                                ? formatCurrency(Number(p.price) * l.quantite)
                                : "—"}
                            </div>
                          </div>
                          <div className="col-span-1 flex justify-end">
                            <Tooltip content="Supprimer la ligne">
                              <Button
                                variant="ghost"
                                size="icon-sm"
                                onClick={() => removeLine(l.key)}
                                disabled={lines.length === 1}
                                className="text-muted hover:text-danger"
                                aria-label="Supprimer la ligne"
                              >
                                <Trash2 className="h-3.5 w-3.5" />
                              </Button>
                            </Tooltip>
                          </div>
                        </div>
                        {err && (
                          <div className="mt-1.5 flex items-center gap-1 text-xs text-danger">
                            <AlertCircle className="h-3 w-3" />
                            {err}
                          </div>
                        )}
                      </li>
                    );
                  })}
                </ul>
              )}
            </CardContent>
          </Card>

          {/* Récap */}
          <Card className="lg:sticky lg:top-[72px]">
            <CardHeader>
              <CardTitle>Récapitulatif</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <dl className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <dt className="text-muted">Lignes</dt>
                  <dd className="tabular-nums">{lines.length}</dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-muted">Articles</dt>
                  <dd className="tabular-nums">{itemsCount}</dd>
                </div>
              </dl>
              <div className="border-t border-default pt-3 flex items-end justify-between">
                <span className="text-xs uppercase tracking-wider text-muted">
                  Total
                </span>
                <span
                  className={cn(
                    "text-2xl font-semibold tabular-nums leading-none",
                    canSubmit ? "text-primary" : "text-muted",
                  )}
                >
                  {formatCurrency(total)}
                </span>
              </div>
              {errors.length > 0 && (
                <div className="rounded-md bg-danger-soft text-danger-soft-fg px-3 py-2 text-xs ring-1 ring-inset ring-danger/20 flex items-start gap-2">
                  <AlertCircle className="h-3.5 w-3.5 mt-0.5 shrink-0" />
                  <span>
                    {errors.length} ligne(s) invalide(s) — corrigez avant
                    d'enregistrer.
                  </span>
                </div>
              )}
              {!canSubmit && errors.length === 0 && (
                <Badge variant="neutral" className="text-xs">
                  Sélectionnez les produits pour activer l'enregistrement
                </Badge>
              )}
              <div className="space-y-2">
                <Button
                  onClick={() => createMut.mutate()}
                  disabled={!canSubmit}
                  loading={createMut.isPending}
                  className="w-full"
                >
                  Enregistrer la vente
                </Button>
                <Button
                  type="button"
                  variant="secondary"
                  onClick={() => navigate("/ventes")}
                  disabled={createMut.isPending}
                  className="w-full"
                >
                  Annuler
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      <BarcodeScanner
        open={scannerOpen}
        onClose={() => setScannerOpen(false)}
        onScan={handleScan}
        title="Scanner pour ajouter au panier"
        description="Scannez le code-barres d'un produit pour l'ajouter automatiquement à la vente."
      />
    </div>
  );
}
