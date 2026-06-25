import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ArrowLeftRight, Plus } from "lucide-react";
import { useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import {
  Badge,
  Button,
  DataTable,
  FilterBar,
  Input,
  Label,
  PageHeader,
  Pagination,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  toastUI,
  type Column,
} from "@/components/ui";
import { useAuth } from "@/features/auth/AuthContext";
import { productsService } from "@/features/products/productsService";
import type {
  StockMovementRequest,
  StockMovementResponse,
  StockMovementType,
} from "@/types";
import { formatDateTime, formatNumber } from "@/utils/format";
import { StockMovementForm } from "./StockMovementForm";
import { stockService, type StockSearchParams } from "./stockService";

export function StockMovementsPage() {
  const { hasRole } = useAuth();
  const canCreate = hasRole("ADMIN", "STOCK_MANAGER");
  const qc = useQueryClient();

  const [searchParams, setSearchParams] = useSearchParams();
  const page = Math.max(0, Number(searchParams.get("page") ?? 0));
  const type = (searchParams.get("type") ?? "all") as
    | StockMovementType
    | "all";
  const productId = searchParams.get("productId") ?? "all";
  const startDate = searchParams.get("startDate") ?? "";
  const endDate = searchParams.get("endDate") ?? "";

  const update = (patch: Record<string, string | number | undefined>) =>
    setSearchParams(
      (prev) => {
        const next = new URLSearchParams(prev);
        for (const [k, v] of Object.entries(patch)) {
          if (
            v === undefined ||
            v === "" ||
            v === 0 ||
            v === "all"
          )
            next.delete(k);
          else next.set(k, String(v));
        }
        return next;
      },
      { replace: true },
    );

  const params: StockSearchParams = useMemo(
    () => ({
      page,
      size: 15,
      type: type === "all" ? undefined : type,
      productId: productId === "all" ? undefined : Number(productId),
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

  const createMut = useMutation({
    mutationFn: (b: StockMovementRequest) => stockService.create(b),
    onSuccess: () => {
      toastUI.success("Mouvement enregistré");
      setFormOpen(false);
      void qc.invalidateQueries({ queryKey: ["stock-movements"] });
      void qc.invalidateQueries({ queryKey: ["products"] });
    },
    onError: () => toastUI.error("Enregistrement impossible"),
  });

  const data = movementsQuery.data;
  const total = data?.totalElements ?? 0;
  const hasActiveFilters =
    type !== "all" ||
    productId !== "all" ||
    Boolean(startDate) ||
    Boolean(endDate);

  const columns: Column<StockMovementResponse>[] = [
    {
      id: "id",
      header: "Réf.",
      cell: (m) => <span className="font-mono text-xs text-muted">#{m.id}</span>,
      width: "72px",
    },
    {
      id: "date",
      header: "Date",
      cell: (m) => (
        <span className="text-secondary">{formatDateTime(m.date)}</span>
      ),
      sortKey: "date",
      width: "180px",
    },
    {
      id: "type",
      header: "Type",
      cell: (m) =>
        m.type === "IN" ? (
          <Badge variant="success" dot>
            Entrée
          </Badge>
        ) : (
          <Badge variant="warning" dot>
            Sortie
          </Badge>
        ),
      width: "100px",
    },
    {
      id: "product",
      header: "Produit",
      cell: (m) => (
        <span className="font-medium text-primary">{m.productName}</span>
      ),
    },
    {
      id: "user",
      header: "Utilisateur",
      cell: (m) => <span className="text-secondary">{m.userName}</span>,
      hideable: true,
    },
    {
      id: "reason",
      header: "Raison",
      cell: (m) => (
        <span className="text-secondary">
          {m.reason ?? <span className="text-disabled">—</span>}
        </span>
      ),
      hideable: true,
    },
    {
      id: "quantity",
      header: "Quantité",
      cell: (m) => (
        <span
          className={cn_quantity_class(m.type)}
        >
          {m.type === "IN" ? "+" : "−"}
          {formatNumber(m.quantity)}
        </span>
      ),
      align: "right",
      width: "120px",
    },
  ];

  return (
    <div className="max-w-[1400px] mx-auto space-y-4">
      <PageHeader
        title="Mouvements de stock"
        description="Historique chronologique des entrées et sorties."
        meta={total > 0 && <Badge variant="neutral">{total}</Badge>}
        actions={
          canCreate && (
            <Button onClick={() => setFormOpen(true)}>
              <Plus className="h-3.5 w-3.5" />
              Nouveau mouvement
            </Button>
          )
        }
      />

      <FilterBar
        onReset={() => setSearchParams({}, { replace: true })}
        hasActiveFilters={hasActiveFilters}
      >
        <Select value={type} onValueChange={(v) => update({ type: v, page: 0 })}>
          <SelectTrigger className="w-36">
            <SelectValue placeholder="Type" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Tous types</SelectItem>
            <SelectItem value="IN">Entrées</SelectItem>
            <SelectItem value="OUT">Sorties</SelectItem>
          </SelectContent>
        </Select>
        <Select
          value={productId}
          onValueChange={(v) => update({ productId: v, page: 0 })}
        >
          <SelectTrigger className="w-56">
            <SelectValue placeholder="Produit" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Tous produits</SelectItem>
            {products.map((p) => (
              <SelectItem key={p.id} value={String(p.id)}>
                {p.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <div className="flex items-center gap-2">
          <Label htmlFor="from" className="text-muted whitespace-nowrap">
            Du
          </Label>
          <Input
            id="from"
            type="date"
            className="w-40"
            value={startDate}
            onChange={(e) => update({ startDate: e.target.value, page: 0 })}
          />
          <Label htmlFor="to" className="text-muted whitespace-nowrap">
            au
          </Label>
          <Input
            id="to"
            type="date"
            className="w-40"
            value={endDate}
            onChange={(e) => update({ endDate: e.target.value, page: 0 })}
          />
        </div>
      </FilterBar>

      <DataTable<StockMovementResponse>
        columns={columns}
        data={data?.content ?? []}
        getRowId={(m) => m.id}
        loading={movementsQuery.isPending}
        rowCount={10}
        emptyTitle="Aucun mouvement"
        emptyDescription={
          hasActiveFilters
            ? "Ajustez vos filtres."
            : "Les mouvements de stock apparaîtront ici."
        }
        emptyAction={
          !hasActiveFilters && canCreate ? (
            <Button onClick={() => setFormOpen(true)}>
              <Plus className="h-3.5 w-3.5" />
              Nouveau mouvement
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

      <StockMovementForm
        open={formOpen}
        onClose={() => setFormOpen(false)}
        products={products}
        submitting={createMut.isPending}
        onSubmit={(body) => createMut.mutateAsync(body)}
      />
    </div>
  );
}

function cn_quantity_class(type: StockMovementType): string {
  return type === "IN"
    ? "font-medium text-success-soft-fg tabular-nums"
    : "font-medium text-warning-soft-fg tabular-nums";
}
