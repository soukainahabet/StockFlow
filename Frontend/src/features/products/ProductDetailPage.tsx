import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  AlertTriangle,
  ArrowDownToLine,
  ArrowLeft,
  ArrowUpFromLine,
  Boxes,
  Pencil,
  Trash2,
} from "lucide-react";
import { useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import {
  Badge,
  Button,
  Card,
  CardContent,
  ConfirmDialog,
  EmptyState,
  PageHeader,
  Skeleton,
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
  toastUI,
  Tooltip,
} from "@/components/ui";
import { useAuth } from "@/features/auth/AuthContext";
import { categoriesService } from "@/features/categories/categoriesService";
import { ProductForm } from "@/features/products/ProductForm";
import { productsService } from "@/features/products/productsService";
import { StockMovementForm } from "@/features/stock/StockMovementForm";
import { stockService } from "@/features/stock/stockService";
import { cn } from "@/lib/cn";
import type {
  ProductRequest,
  StockMovementRequest,
  StockMovementResponse,
} from "@/types";
import { formatCurrency, formatDateTime, formatNumber } from "@/utils/format";

export function ProductDetailPage() {
  const { id } = useParams<{ id: string }>();
  const productId = Number(id);
  const navigate = useNavigate();
  const qc = useQueryClient();
  const { hasRole } = useAuth();
  const canManage = hasRole("ADMIN");
  const canMove = hasRole("ADMIN", "STOCK_MANAGER");

  const productQuery = useQuery({
    queryKey: ["product", productId],
    queryFn: () => productsService.getById(productId),
    enabled: Number.isFinite(productId) && productId > 0,
  });
  const categoriesQuery = useQuery({
    queryKey: ["categories", "all"],
    queryFn: categoriesService.listAll,
  });
  const movementsQuery = useQuery({
    queryKey: ["stock-movements", "by-product", productId],
    queryFn: () => stockService.byProduct(productId, 0, 50),
    enabled: Number.isFinite(productId) && productId > 0,
  });

  const [editOpen, setEditOpen] = useState(false);
  const [stockOpen, setStockOpen] = useState<"IN" | "OUT" | null>(null);
  const [confirmDelete, setConfirmDelete] = useState(false);

  const updateMut = useMutation({
    mutationFn: (body: ProductRequest) =>
      productsService.update(productId, body),
    onSuccess: () => {
      toastUI.success("Produit mis à jour");
      setEditOpen(false);
      void qc.invalidateQueries({ queryKey: ["product", productId] });
      void qc.invalidateQueries({ queryKey: ["products"] });
    },
    onError: () => toastUI.error("Mise à jour impossible"),
  });
  const deleteMut = useMutation({
    mutationFn: () => productsService.remove(productId),
    onSuccess: () => {
      toastUI.success("Produit supprimé");
      void qc.invalidateQueries({ queryKey: ["products"] });
      navigate("/products");
    },
    onError: () => toastUI.error("Suppression impossible"),
  });
  const stockMut = useMutation({
    mutationFn: (b: StockMovementRequest) => stockService.create(b),
    onSuccess: () => {
      toastUI.success("Mouvement enregistré");
      setStockOpen(null);
      void qc.invalidateQueries({ queryKey: ["product", productId] });
      void qc.invalidateQueries({ queryKey: ["stock-movements"] });
      void qc.invalidateQueries({ queryKey: ["products"] });
    },
    onError: () => toastUI.error("Échec de l'enregistrement"),
  });

  const p = productQuery.data;
  const isOut = p?.quantity === 0;
  const isLow = Boolean(p?.lowStock);

  if (productQuery.isPending) {
    return (
      <div className="max-w-[1200px] mx-auto space-y-4">
        <Skeleton className="h-5 w-32" />
        <Skeleton className="h-8 w-64" />
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <Skeleton className="h-64 lg:col-span-2" />
          <Skeleton className="h-64" />
        </div>
      </div>
    );
  }

  if (!p) {
    return (
      <div className="max-w-[1200px] mx-auto">
        <Link
          to="/products"
          className="inline-flex items-center gap-1 text-sm text-muted hover:text-primary mb-4"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          Produits
        </Link>
        <EmptyState
          icon={Boxes}
          title="Produit introuvable"
          description="Ce produit n'existe pas ou a été supprimé."
          action={
            <Button asChild variant="secondary">
              <Link to="/products">Retour à la liste</Link>
            </Button>
          }
        />
      </div>
    );
  }

  return (
    <div className="max-w-[1200px] mx-auto">
      <Link
        to="/products"
        className="inline-flex items-center gap-1 text-sm text-muted hover:text-primary mb-3"
      >
        <ArrowLeft className="h-3.5 w-3.5" />
        Produits
      </Link>

      <PageHeader
        title={p.name}
        description={`Référence #${p.id}`}
        meta={
          <div className="flex items-center gap-1.5">
            <Badge variant="neutral">{p.categoryName}</Badge>
            {isOut ? (
              <Badge variant="danger" dot>
                Rupture
              </Badge>
            ) : isLow ? (
              <Badge variant="warning" dot>
                Stock faible
              </Badge>
            ) : (
              <Badge variant="success" dot>
                OK
              </Badge>
            )}
          </div>
        }
        actions={
          canManage && (
            <>
              <Tooltip content="Modifier">
                <Button
                  variant="secondary"
                  size="md"
                  onClick={() => setEditOpen(true)}
                >
                  <Pencil className="h-3.5 w-3.5" />
                  Modifier
                </Button>
              </Tooltip>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setConfirmDelete(true)}
                aria-label="Supprimer"
                className="text-muted hover:text-danger"
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </>
          )
        }
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 items-start">
        {/* Tabs principaux */}
        <div className="lg:col-span-2">
          <Tabs defaultValue="info">
            <TabsList>
              <TabsTrigger value="info">Informations</TabsTrigger>
              <TabsTrigger value="movements">
                Mouvements
                {movementsQuery.data && (
                  <Badge variant="neutral" className="ml-1.5">
                    {movementsQuery.data.totalElements}
                  </Badge>
                )}
              </TabsTrigger>
              <TabsTrigger value="sales">Ventes</TabsTrigger>
            </TabsList>

            <TabsContent value="info">
              <Card>
                <CardContent className="p-0">
                  <dl className="divide-y divide-default">
                    <DataRow label="Nom" value={p.name} />
                    <DataRow label="Référence" value={`#${p.id}`} />
                    <DataRow label="Catégorie" value={p.categoryName} />
                    <DataRow
                      label="Prix d'achat"
                      value={
                        p.buyPrice == null ? (
                          <span className="text-muted">—</span>
                        ) : (
                          <span className="font-medium tabular-nums">
                            {formatCurrency(p.buyPrice)}
                          </span>
                        )
                      }
                    />
                    <DataRow
                      label="Prix de vente"
                      value={
                        <span className="font-medium tabular-nums">
                          {formatCurrency(p.price)}
                        </span>
                      }
                    />
                    <DataRow
                      label="Marge unitaire"
                      value={
                        p.buyPrice == null ? (
                          <span className="text-muted">—</span>
                        ) : (
                          (() => {
                            const margin = p.price - p.buyPrice;
                            const marginPct =
                              p.price > 0 ? (margin / p.price) * 100 : 0;
                            return (
                              <span
                                className={cn(
                                  "font-medium tabular-nums",
                                  margin >= 0
                                    ? "text-success-soft-fg"
                                    : "text-danger",
                                )}
                              >
                                {margin >= 0 ? "+" : ""}
                                {formatCurrency(margin)}{" "}
                                <span className="text-muted font-normal">
                                  ({marginPct.toFixed(1)} %)
                                </span>
                              </span>
                            );
                          })()
                        )
                      }
                    />
                    <DataRow
                      label="Stock actuel"
                      value={
                        <span className="font-medium tabular-nums">
                          {formatNumber(p.quantity)}
                        </span>
                      }
                    />
                    <DataRow
                      label="Seuil d'alerte"
                      value={
                        <span className="tabular-nums text-muted">
                          {formatNumber(p.alertThreshold)}
                        </span>
                      }
                    />
                  </dl>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="movements">
              <MovementsList
                rows={movementsQuery.data?.content ?? []}
                loading={movementsQuery.isPending}
              />
            </TabsContent>

            <TabsContent value="sales">
              <Card>
                <CardContent>
                  <EmptyState
                    size="sm"
                    icon={Boxes}
                    title="Bientôt disponible"
                    description="L'historique des ventes par produit nécessite un endpoint dédié. Disponible dans une prochaine itération."
                  />
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>

        {/* Encart Stock sticky */}
        <aside className="lg:sticky lg:top-[72px]">
          <Card>
            <CardContent className="space-y-4">
              <div>
                <p className="text-xs font-medium uppercase tracking-wider text-muted">
                  Stock actuel
                </p>
                <p
                  className={cn(
                    "mt-1 text-3xl font-semibold tabular-nums leading-none",
                    isOut
                      ? "text-danger"
                      : isLow
                        ? "text-warning"
                        : "text-primary",
                  )}
                >
                  {formatNumber(p.quantity)}
                </p>
                <p className="mt-1 text-xs text-muted">
                  Seuil d'alerte :{" "}
                  <span className="tabular-nums">
                    {formatNumber(p.alertThreshold)}
                  </span>
                </p>
              </div>

              {isLow && (
                <div className="flex items-start gap-2 rounded-md bg-warning-soft text-warning-soft-fg px-3 py-2 text-xs ring-1 ring-inset ring-warning/20">
                  <AlertTriangle
                    className="h-3.5 w-3.5 mt-0.5 shrink-0"
                    aria-hidden="true"
                  />
                  <p>
                    {isOut
                      ? "Stock épuisé — déclenchez un réapprovisionnement."
                      : "Stock sous le seuil d'alerte."}
                  </p>
                </div>
              )}

              {canMove && (
                <div className="grid grid-cols-2 gap-2">
                  <Button
                    variant="secondary"
                    onClick={() => setStockOpen("IN")}
                    className="border-success/20 text-success-soft-fg hover:bg-success-soft"
                  >
                    <ArrowDownToLine className="h-3.5 w-3.5" />
                    Entrée
                  </Button>
                  <Button
                    variant="secondary"
                    onClick={() => setStockOpen("OUT")}
                    disabled={isOut}
                    className="border-warning/20 text-warning-soft-fg hover:bg-warning-soft"
                  >
                    <ArrowUpFromLine className="h-3.5 w-3.5" />
                    Sortie
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </aside>
      </div>

      <ProductForm
        open={editOpen}
        onClose={() => setEditOpen(false)}
        initial={p}
        categories={categoriesQuery.data ?? []}
        submitting={updateMut.isPending}
        onSubmit={(body) => updateMut.mutateAsync(body)}
      />

      <StockMovementForm
        open={stockOpen !== null}
        onClose={() => setStockOpen(null)}
        products={[p]}
        defaultProductId={p.id}
        defaultType={stockOpen ?? "IN"}
        lockProduct
        submitting={stockMut.isPending}
        onSubmit={(body) => stockMut.mutateAsync(body)}
      />

      <ConfirmDialog
        open={confirmDelete}
        title="Supprimer le produit ?"
        message={`"${p.name}" sera supprimé définitivement et n'apparaîtra plus dans le catalogue.`}
        confirmLabel="Supprimer"
        loading={deleteMut.isPending}
        onClose={() => setConfirmDelete(false)}
        onConfirm={() => deleteMut.mutate()}
      />
    </div>
  );
}

function DataRow({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="grid grid-cols-3 gap-3 px-4 py-2.5">
      <dt className="text-xs text-muted">{label}</dt>
      <dd className="col-span-2 text-sm text-primary">{value}</dd>
    </div>
  );
}

function MovementsList({
  rows,
  loading,
}: {
  rows: StockMovementResponse[];
  loading: boolean;
}) {
  if (loading) {
    return (
      <Card>
        <CardContent className="p-0">
          <ul className="divide-y divide-default">
            {Array.from({ length: 5 }).map((_, i) => (
              <li key={i} className="flex items-center gap-3 px-4 py-2.5">
                <Skeleton className="h-5 w-14" />
                <div className="flex-1 space-y-1">
                  <Skeleton className="h-3 w-32" />
                  <Skeleton className="h-2.5 w-20" />
                </div>
                <Skeleton className="h-3 w-10" />
              </li>
            ))}
          </ul>
        </CardContent>
      </Card>
    );
  }
  if (rows.length === 0) {
    return (
      <Card>
        <CardContent>
          <EmptyState
            size="sm"
            icon={ArrowDownToLine}
            title="Aucun mouvement"
            description="Les entrées et sorties de stock apparaîtront ici."
          />
        </CardContent>
      </Card>
    );
  }
  return (
    <Card>
      <CardContent className="p-0">
        <ul className="divide-y divide-default">
          {rows.map((m) => (
            <li
              key={m.id}
              className="flex items-center gap-3 px-4 py-2.5"
            >
              <Badge variant={m.type === "IN" ? "success" : "warning"} dot>
                {m.type === "IN" ? "Entrée" : "Sortie"}
              </Badge>
              <div className="flex-1 min-w-0">
                <p className="text-sm text-primary truncate">{m.userName}</p>
                <p className="text-xs text-muted">{formatDateTime(m.date)}</p>
              </div>
              <span
                className={cn(
                  "text-sm font-medium tabular-nums",
                  m.type === "IN" ? "text-success-soft-fg" : "text-warning-soft-fg",
                )}
              >
                {m.type === "IN" ? "+" : "−"}
                {formatNumber(m.quantity)}
              </span>
            </li>
          ))}
        </ul>
      </CardContent>
    </Card>
  );
}
