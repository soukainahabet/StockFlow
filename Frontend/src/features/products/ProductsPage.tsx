import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Pencil, Plus, Trash2 } from "lucide-react";
import { useMemo, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import {
  Badge,
  Button,
  ConfirmDialog,
  DataTable,
  FilterBar,
  PageHeader,
  Pagination,
  SearchInput,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  toastUI,
  Tooltip,
  type Column,
  type SortState,
} from "@/components/ui";
import { categoriesService } from "@/features/categories/categoriesService";
import { useAuth } from "@/features/auth/AuthContext";
import type { ProductRequest, ProductResponse } from "@/types";
import { formatCurrency, formatNumber } from "@/utils/format";
import { ProductForm } from "./ProductForm";
import { productsService, type ProductSearchParams } from "./productsService";

type StatusFilter = "all" | "ok" | "low" | "out";

function readParams(sp: URLSearchParams) {
  return {
    q: sp.get("q") ?? "",
    category: sp.get("category") ?? "",
    status: (sp.get("status") as StatusFilter | null) ?? "all",
    page: Math.max(0, Number(sp.get("page") ?? 0)),
    sort: sp.get("sort") ?? "",
  };
}

export function ProductsPage() {
  const { hasRole } = useAuth();
  const canManage = hasRole("ADMIN");
  const qc = useQueryClient();
  const navigate = useNavigate();

  const [searchParams, setSearchParams] = useSearchParams();
  const { q, category, status, page, sort } = readParams(searchParams);
  const sortState: SortState | undefined = useMemo(() => {
    if (!sort) return undefined;
    const [key, dir] = sort.split(",");
    return dir === "asc" || dir === "desc"
      ? { key, direction: dir }
      : undefined;
  }, [sort]);

  const update = (patch: Record<string, string | number | undefined | null>) =>
    setSearchParams(
      (prev) => {
        const next = new URLSearchParams(prev);
        for (const [k, v] of Object.entries(patch)) {
          if (v === undefined || v === null || v === "" || v === 0)
            next.delete(k);
          else next.set(k, String(v));
        }
        return next;
      },
      { replace: true },
    );

  const params: ProductSearchParams = useMemo(
    () => ({
      page,
      size: 15,
      name: q || undefined,
      categoryId: category ? Number(category) : undefined,
      lowStock: status === "low" || status === "out" ? true : undefined,
      sort: sort || undefined,
    }),
    [page, q, category, status, sort],
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
  const [confirmDelete, setConfirmDelete] = useState<ProductResponse | null>(
    null,
  );

  const createMut = useMutation({
    mutationFn: (b: ProductRequest) => productsService.create(b),
    onSuccess: () => {
      toastUI.success("Produit créé");
      setFormOpen(false);
      void qc.invalidateQueries({ queryKey: ["products"] });
    },
    onError: () => toastUI.error("Création impossible"),
  });
  const updateMut = useMutation({
    mutationFn: ({ id, body }: { id: number; body: ProductRequest }) =>
      productsService.update(id, body),
    onSuccess: () => {
      toastUI.success("Produit mis à jour");
      setFormOpen(false);
      setEditing(null);
      void qc.invalidateQueries({ queryKey: ["products"] });
    },
    onError: () => toastUI.error("Mise à jour impossible"),
  });
  const deleteMut = useMutation({
    mutationFn: (id: number) => productsService.remove(id),
    onSuccess: () => {
      toastUI.success("Produit supprimé");
      setConfirmDelete(null);
      void qc.invalidateQueries({ queryKey: ["products"] });
    },
    onError: () => toastUI.error("Suppression impossible"),
  });

  const data = productsQuery.data;
  const total = data?.totalElements ?? 0;
  const hasActiveFilters =
    Boolean(q) || Boolean(category) || status !== "all";

  // Filtrage statut côté client (le backend n'a qu'un flag lowStock)
  const rows = useMemo(() => {
    const content = data?.content ?? [];
    if (status === "out") return content.filter((p) => p.quantity === 0);
    if (status === "ok") return content.filter((p) => !p.lowStock);
    return content;
  }, [data, status]);

  const columns: Column<ProductResponse>[] = [
    {
      id: "sku",
      header: "Réf.",
      cell: (p) => (
        <span className="font-mono text-xs text-muted">#{p.id}</span>
      ),
      width: "72px",
      sortKey: "id",
    },
    {
      id: "name",
      header: "Produit",
      cell: (p) => (
        <span className="font-medium text-primary">{p.name}</span>
      ),
      sortKey: "name",
    },
    {
      id: "category",
      header: "Catégorie",
      cell: (p) => <Badge variant="neutral">{p.categoryName}</Badge>,
    },
    {
      id: "barcode",
      header: "Code-barres",
      cell: (p) =>
        p.barcode ? (
          <span className="font-mono text-xs text-muted">{p.barcode}</span>
        ) : (
          <span className="text-disabled">—</span>
        ),
      hideable: true,
      defaultHidden: true,
    },
    {
      id: "buyPrice",
      header: "Prix achat",
      cell: (p) =>
        p.buyPrice == null ? (
          <span className="text-disabled">—</span>
        ) : (
          <span className="text-muted">{formatCurrency(p.buyPrice)}</span>
        ),
      align: "right",
      hideable: true,
      defaultHidden: true,
    },
    {
      id: "price",
      header: "Prix vente",
      cell: (p) => formatCurrency(p.price),
      align: "right",
      sortKey: "price",
    },
    {
      id: "quantity",
      header: "Stock",
      cell: (p) => formatNumber(p.quantity),
      align: "right",
      sortKey: "quantity",
    },
    {
      id: "threshold",
      header: "Seuil",
      cell: (p) => (
        <span className="text-muted">{formatNumber(p.alertThreshold)}</span>
      ),
      align: "right",
      hideable: true,
      defaultHidden: true,
    },
    {
      id: "status",
      header: "Statut",
      cell: (p) =>
        p.quantity === 0 ? (
          <Badge variant="danger" dot>
            Rupture
          </Badge>
        ) : p.lowStock ? (
          <Badge variant="warning" dot>
            Faible
          </Badge>
        ) : (
          <Badge variant="success" dot>
            OK
          </Badge>
        ),
    },
    ...(canManage
      ? [
          {
            id: "actions",
            header: "",
            cell: (p: ProductResponse) => (
              <div
                className="inline-flex items-center gap-0.5 justify-end"
                data-row-stop
                onClick={(e) => e.stopPropagation()}
              >
                <Tooltip content="Modifier">
                  <Button
                    variant="ghost"
                    size="icon-sm"
                    onClick={() => {
                      setEditing(p);
                      setFormOpen(true);
                    }}
                  >
                    <Pencil className="h-3.5 w-3.5" />
                  </Button>
                </Tooltip>
                <Tooltip content="Supprimer">
                  <Button
                    variant="ghost"
                    size="icon-sm"
                    onClick={() => setConfirmDelete(p)}
                    className="text-muted hover:text-danger"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </Tooltip>
              </div>
            ),
            align: "right" as const,
            compact: true,
            width: "96px",
          },
        ]
      : []),
  ];

  return (
    <div className="max-w-[1400px] mx-auto space-y-4">
      <PageHeader
        title="Produits"
        description="Gérez votre catalogue et vos stocks."
        meta={
          total > 0 && (
            <Badge variant="neutral">{total.toLocaleString("fr-FR")} réf.</Badge>
          )
        }
        actions={
          canManage && (
            <Button
              onClick={() => {
                setEditing(null);
                setFormOpen(true);
              }}
            >
              <Plus className="h-3.5 w-3.5" />
              Nouveau produit
            </Button>
          )
        }
      />

      <FilterBar
        onReset={() =>
          setSearchParams({}, { replace: true })
        }
        hasActiveFilters={hasActiveFilters}
      >
        <SearchInput
          key={q}
          defaultValue={q}
          onSearch={(v) => update({ q: v, page: 0 })}
          placeholder="Rechercher un produit…"
          className="w-full sm:w-72"
        />
        <Select
          value={category || "all"}
          onValueChange={(v) =>
            update({ category: v === "all" ? undefined : v, page: 0 })
          }
        >
          <SelectTrigger className="w-44">
            <SelectValue placeholder="Catégorie" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Toutes catégories</SelectItem>
            {(categoriesQuery.data ?? []).map((c) => (
              <SelectItem key={c.id} value={String(c.id)}>
                {c.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select
          value={status}
          onValueChange={(v) =>
            update({
              status: v === "all" ? undefined : v,
              page: 0,
            })
          }
        >
          <SelectTrigger className="w-40">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Tout statut</SelectItem>
            <SelectItem value="ok">Stock OK</SelectItem>
            <SelectItem value="low">Stock faible</SelectItem>
            <SelectItem value="out">Rupture</SelectItem>
          </SelectContent>
        </Select>
      </FilterBar>

      <DataTable<ProductResponse>
        columns={columns}
        data={rows}
        getRowId={(r) => r.id}
        loading={productsQuery.isPending}
        rowCount={10}
        sort={sortState}
        onSortChange={(s) =>
          update({ sort: s ? `${s.key},${s.direction}` : undefined })
        }
        onRowClick={(r) => navigate(`/products/${r.id}`)}
        emptyTitle="Aucun produit"
        emptyDescription={
          hasActiveFilters
            ? "Ajustez vos filtres."
            : "Créez votre premier produit pour commencer."
        }
        emptyAction={
          !hasActiveFilters && canManage ? (
            <Button
              onClick={() => {
                setEditing(null);
                setFormOpen(true);
              }}
            >
              <Plus className="h-3.5 w-3.5" />
              Nouveau produit
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
          editing
            ? updateMut.mutateAsync({ id: editing.id, body })
            : createMut.mutateAsync(body)
        }
      />

      <ConfirmDialog
        open={Boolean(confirmDelete)}
        title="Supprimer le produit ?"
        message={`"${confirmDelete?.name}" sera supprimé définitivement.`}
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
